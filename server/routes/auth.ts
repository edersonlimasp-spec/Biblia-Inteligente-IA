import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { hashPassword, verifyPassword, generateToken, ensureAuthenticated, ensureAdmin, ensureSuperAdmin, optionalAuth, isTrialActive, getTrialDaysRemaining, type AuthRequest } from "../auth";
import { sendPasswordResetEmail, sendReengagementEmail } from "../email";
import admin from "firebase-admin";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { askTheologicalQuestion, generateBiblicalImage, analyzeImageWithVision } from "../openai";
import { insertUserSchema, insertSubscriptionSchema, insertBookmarkSchema, insertAnnotationSchema, insertAIHistorySchema, strongEntries, users, subscriptions, bonuses, bibleVersions, bibleVerses, userBiblePreferences, bibleWords, pdfWordIndex, studyModules, studyTracks, studyLessons, studyModuleTranslations, studyTrackTranslations, studyLessonTranslations, guests, coupons, couponRedemptions, type Coupon, type CouponRedemption, insertCouponSchema, sermonRecordings } from "@shared/schema";
import { z } from "zod";
import { bibleBooks, getBookById } from "../bible-data/books";
import { getBookChapter } from "../bible-data/bible-index";
import { db } from "../db";
import { eq, or, like, sql, and, inArray, gte, desc } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { forceSeedStrongEntries, forceSeedStudyModules } from "../init-db";
import { getGoogleAccessToken } from "../payments/google";
import { STRONG_DATA } from "../strong-data-embedded";
import { TRANSLATION_REGISTRY, getEnabledTranslations, hasDataAvailable, getTranslation, getDefaultTranslation } from "../bible/translations";
import iapRoutes from "../payments/iap-routes";
import { generateStrongDefinition, isEntryIncomplete } from "../services/strong-ai-generator";
import { readingPlanService } from "../reading-plans";
import { transcribeAudio, generateSermonSummary, generateShareToken } from "../services/sermon-ai";
import { GENESIS_WORD_STRONG } from "../genesis-strong-mappings";
import { EXO_WORD_STRONG } from "../exo-strong-mappings";
import { NUM_WORD_STRONG } from "../num-strong-mappings";
import { LEV_WORD_STRONG } from "../lev-strong-mappings";
import { DEU_WORD_STRONG } from "../deu-strong-mappings";
import { getClientPlatform, getPlatformAllowedSources, getFromStrongCache, setInStrongCache, initFirebaseAdmin, firebaseInitialized } from "./shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerAuthRoutes(app: Express): void {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { deviceId, ...userData } = req.body;
      const validatedData = insertUserSchema.parse(userData);
      
      if (!validatedData.email || !validatedData.password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Link deviceId to user if provided (guest converting to registered user)
      if (deviceId && typeof storage.linkGuestToUser === 'function') {
        try {
          await storage.linkGuestToUser(deviceId, user.id);
          console.log(`✅ Guest ${deviceId} vinculado ao usuário ${user.id}`);
        } catch (linkError) {
          console.warn('Erro ao vincular deviceId ao usuário:', linkError);
        }
      }

      // Auto-grant registration bonus (7-day trial extension)
      // System admin ID for auto-granted bonuses
      const SYSTEM_ADMIN_ID = '54a45c5b-7364-47dc-b1dd-0cd824384ec4';
      const now = new Date();
      const bonusEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      try {
        await storage.createBonus({
          userId: user.id,
          bonusType: 'TRIAL_EXTEND',
          startAt: now,
          endAt: bonusEndDate,
          reason: 'Bônus automático por cadastro com email (+7 dias)',
          grantedByAdminId: SYSTEM_ADMIN_ID,
        });
        console.log(`🎁 Bônus de 7 dias concedido ao usuário ${user.email}`);
      } catch (bonusError) {
        console.warn('Erro ao conceder bônus de registro:', bonusError);
      }

      // Generate token
      const token = generateToken(user.id, user.email || '', user.role || 'user');

      // Return user without password + trial info
      const { password: _, ...userWithoutPassword } = user;
      const trialActive = isTrialActive(user.trialStartDate);
      const daysRemaining = getTrialDaysRemaining(user.trialStartDate);
      
      res.json({ 
        user: userWithoutPassword, 
        token,
        trial: {
          active: trialActive,
          daysRemaining,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Erro ao criar conta" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      // Validação Zod: formato de email e senha obrigatória
      const loginSchema = z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Senha é obrigatória"),
      });
      const loginParsed = loginSchema.safeParse(req.body);
      if (!loginParsed.success) {
        return res.status(400).json({ error: loginParsed.error.errors[0]?.message ?? "Dados inválidos" });
      }
      const { email, password } = loginParsed.data;
      
      // ===== LOGS DETALHADOS PARA DEBUG =====
      console.log(`\n🔐 ===== TENTATIVA DE LOGIN =====`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Senha recebida: ${'*'.repeat(password?.length || 0)} (${password?.length || 0} caracteres)`);
      console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

      console.log(`🔍 Buscando usuário no banco...`);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log(`❌ USUÁRIO NÃO ENCONTRADO: ${email}`);
        return res.status(401).json({ 
          error: "Email não cadastrado. Verifique o email ou crie uma nova conta.",
          errorType: "user_not_found"
        });
      }
      
      console.log(`✅ Usuário encontrado!`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Nome: ${user.name}`);
      console.log(`   - Role: ${user.role}`);
      
      if (!user.password) {
        console.log(`❌ Usuário sem senha (possivelmente login social)`);
        return res.status(401).json({ 
          error: "Esta conta usa login social. Por favor, faça login com Google.",
          errorType: "social_login"
        });
      }
      
      // Não logamos o hash em produção por segurança
      if (process.env.NODE_ENV !== 'production') {
        console.log(`   - Hash no banco: ${user.password.substring(0, 25)}...`);
      }

      console.log(`🔐 Comparando senha com bcrypt...`);
      const isPasswordValid = await verifyPassword(password, user.password);
      console.log(`🔐 Resultado bcrypt.compare: ${isPasswordValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
      
      if (!isPasswordValid) {
        console.log(`❌ SENHA INVÁLIDA para ${email}`);
        return res.status(401).json({ 
          error: "Senha incorreta. Verifique e tente novamente.",
          errorType: "invalid_password"
        });
      }

      console.log(`✅ LOGIN BEM-SUCEDIDO para ${email}!`);
      const token = generateToken(user.id, user.email || '', user.role || 'user');
      const { password: _, ...userWithoutPassword } = user;
      
      // Update last login and last seen
      await storage.updateUserLastLogin(user.id);
      await storage.updateUserLastSeen(user.id, 'web');
      
      const trialActive = isTrialActive(user.trialStartDate);
      const daysRemaining = getTrialDaysRemaining(user.trialStartDate);
      
      console.log(`🎫 Token gerado, enviando resposta...`);
      console.log(`🔐 ===== FIM DO LOGIN =====\n`);
      
      res.json({ 
        user: userWithoutPassword, 
        token,
        trial: {
          active: trialActive,
          daysRemaining,
        },
      });
    } catch (error) {
      console.error("❌ ERRO CRÍTICO no login:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  // Google Firebase Authentication - verify Firebase ID token and create/login user
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { idToken, deviceId } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ error: "Token do Google é obrigatório" });
      }
      
      if (!firebaseInitialized) {
        return res.status(503).json({ error: "Login com Google não está disponível no momento" });
      }
      
      // Verify the Firebase ID token
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (verifyError) {
        console.error("❌ Erro ao verificar token do Firebase:", verifyError);
        return res.status(401).json({ error: "Token inválido" });
      }
      
      const { email, name, picture, uid } = decodedToken;
      
      if (!email) {
        return res.status(400).json({ error: "Email não disponível na conta Google" });
      }
      
      console.log(`🔐 Login com Google: ${email}`);
      
      // Check if user already exists by email
      let user = await storage.getUserByEmail(email);
      
      if (user) {
        // Update profile info from Google if changed
        if (picture && user.profileImageUrl !== picture) {
          await storage.updateUser(user.id, { profileImageUrl: picture });
        }
        console.log(`✅ Usuário existente: ${email}`);
      } else {
        // Create new user with Google data
        const [firstName, ...lastNameParts] = (name || email.split('@')[0]).split(' ');
        const lastName = lastNameParts.join(' ') || null;
        
        user = await storage.createUser({
          email,
          name: name || email.split('@')[0],
          password: '', // No password for Google users
          firstName,
          lastName,
          profileImageUrl: picture || null,
          googleId: uid,
        });
        console.log(`✅ Novo usuário criado via Google: ${email}`);
      }
      
      // Link deviceId if provided (guest converting to registered)
      if (deviceId && typeof storage.linkGuestToUser === 'function') {
        try {
          await storage.linkGuestToUser(deviceId, user.id);
          console.log(`✅ Guest ${deviceId} vinculado ao usuário ${user.id}`);
        } catch (linkError) {
          console.warn('Erro ao vincular deviceId:', linkError);
        }
      }
      
      // Update last login
      await storage.updateUserLastLogin(user.id);
      
      // Generate JWT token
      const token = generateToken(user.id, user.email!, user.role || 'user');
      
      const { password: _, ...userWithoutPassword } = user;
      const trialActive = isTrialActive(user.trialStartDate);
      const daysRemaining = getTrialDaysRemaining(user.trialStartDate);
      
      res.json({
        user: userWithoutPassword,
        token,
        trial: {
          active: trialActive,
          daysRemaining,
        },
      });
    } catch (error) {
      console.error("❌ Erro no login com Google:", error);
      res.status(500).json({ error: "Erro ao fazer login com Google" });
    }
  });

  // ----------------------------------------------------------------------------
  // Sign in with Apple (iOS) — verifica identityToken via JWKS da Apple
  //
  // PRÉ-REQUISITOS QUE NÃO PODEM SER FEITOS NESTE REPO (manuais):
  //   1. Apple Developer Console → habilitar "Sign in with Apple" no App ID
  //      `com.bibliainteligente.app`.
  //   2. Xcode (App.xcworkspace) → Signing & Capabilities → adicionar
  //      "Sign in with Apple" (gera App.entitlements automaticamente).
  //   3. (Opcional, somente se for usar refresh tokens server-to-server)
  //      criar Service ID + chave privada AuthKey e armazenar como segredo.
  //      Para o login básico que validamos aqui (verificação de identityToken)
  //      NÃO precisamos da chave privada — apenas das chaves públicas JWKS.
  // ----------------------------------------------------------------------------
  const APPLE_BUNDLE_ID = "com.bibliainteligente.ios";
  let appleJwksCache: { keys: any[]; fetchedAt: number } | null = null;

  async function getAppleJwks(): Promise<any[]> {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (appleJwksCache && Date.now() - appleJwksCache.fetchedAt < ONE_DAY) {
      return appleJwksCache.keys;
    }
    const r = await fetch("https://appleid.apple.com/auth/keys");
    if (!r.ok) throw new Error("Falha ao buscar JWKS da Apple");
    const data = await r.json();
    appleJwksCache = { keys: data.keys || [], fetchedAt: Date.now() };
    return appleJwksCache.keys;
  }

  app.post("/api/auth/apple", async (req, res) => {
    try {
      const { identityToken, user: appleUserId, email: bodyEmail, fullName, nonce, deviceId } = req.body || {};
      if (!identityToken) {
        return res.status(400).json({ error: "identityToken é obrigatório" });
      }
      if (!nonce || typeof nonce !== "string") {
        return res.status(400).json({ error: "nonce é obrigatório" });
      }

      // 1. Decodificar header para identificar a chave (kid)
      const decodedHeader: any = jwt.decode(identityToken, { complete: true });
      if (!decodedHeader?.header?.kid) {
        return res.status(401).json({ error: "Token Apple inválido (header)" });
      }

      // 2. Buscar JWK correspondente
      const keys = await getAppleJwks();
      const jwk = keys.find((k: any) => k.kid === decodedHeader.header.kid);
      if (!jwk) {
        return res.status(401).json({ error: "Chave pública da Apple não encontrada" });
      }

      // 3. Converter JWK → PEM (Node 16+ suporta JWK nativamente)
      const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
      const pem = publicKey.export({ type: "spki", format: "pem" }) as string;

      // 4. Verificar assinatura, issuer e audience — alg fixado em RS256 (padrão Apple)
      let payload: any;
      try {
        payload = jwt.verify(identityToken, pem, {
          algorithms: ["RS256"],
          issuer: "https://appleid.apple.com",
          audience: APPLE_BUNDLE_ID,
        });
      } catch (verifyErr) {
        console.error("❌ Apple identityToken inválido:", verifyErr);
        return res.status(401).json({ error: "Token Apple inválido" });
      }

      // 4b. Validar nonce — Apple inclui SHA256(nonce) hex no payload em fluxo nativo iOS.
      // Aceitamos também comparação direta (caso o plugin já entregue hash) por defesa em profundidade.
      const expectedHashed = crypto.createHash("sha256").update(nonce).digest("hex");
      const tokenNonce: string | undefined = payload.nonce;
      if (!tokenNonce || (tokenNonce !== expectedHashed && tokenNonce !== nonce)) {
        console.error("❌ Nonce Apple não confere", { tokenNonce, expectedHashed });
        return res.status(401).json({ error: "Nonce Apple inválido" });
      }

      // Apple só envia email/fullName na PRIMEIRA autorização. Em logins
      // seguintes precisamos casar pelo `sub` (Apple user id) salvo em googleId.
      const appleSub: string = payload.sub;
      const email: string | null = payload.email || bodyEmail || null;

      if (!appleSub) {
        return res.status(400).json({ error: "Apple não retornou identificador do usuário" });
      }

      // 5. Localizar usuário existente: primeiro por googleId (reaproveitamos a coluna
      //    para guardar o sub Apple prefixado), depois por email.
      const appleIdKey = `apple:${appleSub}`;
      let user: (typeof users.$inferSelect) | undefined =
        (await db.select().from(users).where(eq(users.googleId, appleIdKey)).limit(1))[0];
      if (!user && email) {
        user = await storage.getUserByEmail(email);
        if (user && !user.googleId) {
          await storage.updateUser(user.id, { googleId: appleIdKey });
        }
      }

      if (!user) {
        if (!email) {
          return res.status(400).json({
            error: "É necessário compartilhar o e-mail com a Apple para criar a conta",
          });
        }
        const givenName = fullName?.givenName || null;
        const familyName = fullName?.familyName || null;
        const displayName =
          [givenName, familyName].filter(Boolean).join(" ").trim() || email.split("@")[0];

        user = await storage.createUser({
          email,
          name: displayName,
          password: "", // sem senha (login social)
          firstName: givenName,
          lastName: familyName,
          profileImageUrl: null,
          googleId: appleIdKey,
        });
        console.log(`✅ Novo usuário criado via Apple: ${email}`);
      } else {
        console.log(`✅ Login Apple existente: ${user.email}`);
      }

      if (deviceId && typeof storage.linkGuestToUser === "function") {
        try {
          await storage.linkGuestToUser(deviceId, user.id);
        } catch (e) {
          console.warn("Erro ao vincular deviceId Apple:", e);
        }
      }

      await storage.updateUserLastLogin(user.id);

      const token = generateToken(user.id, user.email!, user.role || "user");
      const { password: _, ...userWithoutPassword } = user;
      const trialActive = isTrialActive(user.trialStartDate);
      const daysRemaining = getTrialDaysRemaining(user.trialStartDate);

      res.json({
        user: userWithoutPassword,
        token,
        trial: { active: trialActive, daysRemaining },
      });
    } catch (error) {
      console.error("❌ Erro no login com Apple:", error);
      res.status(500).json({ error: "Erro ao fazer login com Apple" });
    }
  });

  // ----------------------------------------------------------------------------
  // Apagar conta — exigência da Apple App Store (Guideline 5.1.1(v)) e Google Play.
  // Remove o usuário; cascades do schema removem dados associados.
  // ----------------------------------------------------------------------------
  app.delete("/api/user/me", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const existing = await storage.getUser(userId);
      if (!existing) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      await storage.deleteUser(userId);
      console.log(`🗑️  Conta apagada: ${existing.email} (${userId})`);
      res.json({ success: true });
    } catch (error) {
      console.error("❌ Erro ao apagar conta:", error);
      res.status(500).json({ error: "Erro ao apagar conta" });
    }
  });

  // Get current user info
  app.get("/api/auth/me", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const { password: _, ...userWithoutPassword } = user;
      
      // Add trial info
      const trialActive = isTrialActive(user.trialStartDate);
      const daysRemaining = getTrialDaysRemaining(user.trialStartDate);

      res.json({
        user: userWithoutPassword,
        trial: {
          active: trialActive,
          daysRemaining,
        },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Erro ao buscar dados do usuário" });
    }
  });

  // Logout - não requer autenticação pois o token pode estar expirado
  app.post("/api/auth/logout", async (req, res) => {
    try {
      console.log(`🔓 Logout realizado`);
      res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Erro ao fazer logout" });
    }
  });

  // Forgot password - send reset link via email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security, don't reveal if email exists or not
        return res.json({ 
          message: "Se existe uma conta com esse email, você receberá um link de reset em breve." 
        });
      }

      // Generate reset token (valid for 30 minutes)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 1800000); // 30 minutes

      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);

      // Build the base URL for the reset link.
      // Priority:
      //   1. FRONTEND_URL env var (set this in production for reliability)
      //   2. Origin header — only if it is a real public http/https URL.
      //      REJECTED: capacitor://localhost (iOS Capacitor WebView)
      //      REJECTED: http://localhost (Android Capacitor WebView — serves from localhost)
      //      REJECTED: http://127.0.0.1 / ::1 (loopback addresses)
      //   3. Referer header (public http/https only, same exclusions)
      //   4. Hard-coded production URL (most reliable for Capacitor users)
      const _isPublicOrigin = (raw: string): boolean => {
        try {
          const url = new URL(raw);
          if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
          const h = url.hostname;
          if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return false;
          return true;
        } catch {
          return false;
        }
      };
      const _resolveBaseUrl = (): string => {
        // 1. Explicit env var (set FRONTEND_URL to https://bibliainteligente.replit.app)
        if (process.env.FRONTEND_URL) {
          const u = process.env.FRONTEND_URL;
          return u.endsWith('/') ? u.slice(0, -1) : u;
        }
        // 2. Origin header — only public URLs (rejects localhost & capacitor://)
        const origin = req.get('origin');
        if (origin && _isPublicOrigin(origin)) {
          return origin.endsWith('/') ? origin.slice(0, -1) : origin;
        }
        // 3. Referer header — only public URLs
        const referer = req.get('referer');
        if (referer && _isPublicOrigin(referer)) {
          try {
            return new URL(referer).origin;
          } catch { /* ignore */ }
        }
        // 4. Always use the known production URL — safest fallback for native apps
        //    (both Android Capacitor http://localhost and iOS capacitor://localhost
        //     are filtered above, so we land here and return the correct public URL)
        return 'https://bibliainteligente.replit.app';
      };
      const baseUrl = _resolveBaseUrl();
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
      
      // Send email with reset link
      const emailResult = await sendPasswordResetEmail(email, resetLink, user.name || undefined);

      // Only show dev link if email was NOT sent successfully via Resend
      const showDevLink = !emailResult.success && process.env.NODE_ENV !== 'production';
      
      res.json({ 
        message: emailResult.success 
          ? "Se existe uma conta com esse email, você receberá um link de reset em breve."
          : emailResult.message,
        emailSent: emailResult.success,
        ...(showDevLink && { devToken: resetToken, devLink: resetLink })
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Erro ao processar solicitação" });
    }
  });

  // Reset password - confirm reset with token and new password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token e nova senha são obrigatórios" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });
      }

      // Get reset token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ error: "Token de reset inválido ou expirado" });
      }

      if (resetToken.used) {
        return res.status(400).json({ error: "Este token de reset já foi usado" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: "Token de reset expirado" });
      }

      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      await storage.markResetTokenAsUsed(token);

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Erro ao resetar senha" });
    }
  });

  // Change password (authenticated user)
  app.post("/api/auth/change-password", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Nova senha deve ter pelo menos 6 caracteres" });
      }

      // Get current user
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Verify current password
      if (!user.password) {
        return res.status(400).json({ error: "Esta conta usa login social e não possui senha" });
      }
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ error: "Senha atual está incorreta" });
      }

      // Prevent using same password
      const isSamePassword = await verifyPassword(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({ error: "Nova senha não pode ser igual à senha atual" });
      }

      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(req.userId!, hashedPassword);

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Erro ao alterar senha" });
    }
  });

  // User subscription status (used by AIPanel to check access)
  app.get("/api/user/subscription-status", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      // Prevent caching of subscription status
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
      
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const trialActive = isTrialActive(user.trialStartDate);

      // Platform-aware: only honour subscriptions from the correct payment source
      const clientPlatform = getClientPlatform(req);
      const allowedSources = getPlatformAllowedSources(clientPlatform);

      const hasGold = await storage.hasActiveSubscription(req.userId!, 'gold', allowedSources);
      const hasPremium = await storage.hasActiveSubscription(req.userId!, 'premium', allowedSources);
      const hasLifetime = await storage.hasActiveSubscription(req.userId!, 'strong_lifetime', allowedSources);

      // Check for active bonuses that grant Gold or Premium access (always platform-agnostic)
      const hasGoldBonus = await storage.hasActiveBonus(req.userId!, 'gold_free');
      const hasPremiumBonus = await storage.hasActiveBonus(req.userId!, 'premium_free');
      const hasTrialExtendBonus = await storage.hasActiveBonus(req.userId!, 'trial_extend');
      
      // Combine subscription and bonus access
      // trialActive = degustação Premium de 7 dias (novos usuários)
      const effectiveHasGold = hasGold || hasGoldBonus || hasTrialExtendBonus;
      const effectiveHasPremium = hasPremium || hasPremiumBonus || trialActive;

      // For native apps: detect if user has a web-only subscription they cannot use here.
      // This allows the UI to show an informative message ("You have a web subscription —
      // to use the Play Store app, please subscribe via Google Play Billing").
      let hasWebOnlySubscription = false;
      if (clientPlatform !== 'web' && !hasGold && !hasPremium && !hasLifetime) {
        const webSources = ['web', 'mp_webhook', 'mercadopago'];
        const hasWebGold    = await storage.hasActiveSubscription(req.userId!, 'gold', webSources);
        const hasWebPremium = await storage.hasActiveSubscription(req.userId!, 'premium', webSources);
        const hasWebLifetime = await storage.hasActiveSubscription(req.userId!, 'strong_lifetime', webSources);
        hasWebOnlySubscription = hasWebGold || hasWebPremium || hasWebLifetime;
      }

      console.log(`[Subscription Status] userId=${req.userId} platform=${clientPlatform}, hasGold=${hasGold}, hasPremium=${hasPremium}, hasLifetime=${hasLifetime}, webOnly=${hasWebOnlySubscription}`);

      res.json({
        hasPremium: effectiveHasPremium,
        hasGold: effectiveHasGold,
        hasLifetime,
        trialActive,
        userId: req.userId,
        hasWebOnlySubscription,
      });
    } catch (error) {
      console.error("Get subscription status error:", error);
      res.status(500).json({ error: "Erro ao buscar status de assinatura" });
    }
  });

  // Update user preferred language
  app.post("/api/user/language", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { language } = req.body;
      
      if (!language || !["pt", "en", "es"].includes(language)) {
        return res.status(400).json({ error: "Idioma inválido" });
      }

      await storage.updateUserLanguage(req.userId!, language);
      res.json({ success: true, language });
    } catch (error) {
      console.error("Update language error:", error);
      res.status(500).json({ error: "Erro ao atualizar idioma" });
    }
  });

  // Admin Routes
  // IMPORTANT: This route allows the FIRST user to become admin without authentication
  // After the first admin exists, only authenticated admins can make others admin
  app.get("/api/bookmarks", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const bookmarks = await storage.getUserBookmarks(req.userId!);
      res.json(bookmarks);
    } catch (error) {
      console.error("Get bookmarks error:", error);
      res.status(500).json({ error: "Erro ao buscar marcadores" });
    }
  });

  app.post("/api/bookmarks", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertBookmarkSchema.parse({
        ...req.body,
        userId: req.userId,
      });

      const bookmark = await storage.createBookmark(validatedData);
      res.json(bookmark);
    } catch (error) {
      console.error("Create bookmark error:", error);
      res.status(400).json({ error: "Erro ao criar marcador" });
    }
  });

  app.delete("/api/bookmarks/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      await storage.deleteBookmark(req.params.id, req.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete bookmark error:", error);
      res.status(500).json({ error: "Erro ao deletar marcador" });
    }
  });

  // Annotations
  app.get("/api/annotations", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const annotations = await storage.getUserAnnotations(req.userId!);
      res.json(annotations);
    } catch (error) {
      console.error("Get annotations error:", error);
      res.status(500).json({ error: "Erro ao buscar anotações" });
    }
  });

  app.get("/api/annotations/:book/:chapter/:verse", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { book, chapter, verse } = req.params;
      const annotations = await storage.getVerseAnnotations(
        req.userId!,
        book,
        parseInt(chapter),
        parseInt(verse)
      );
      res.json(annotations);
    } catch (error) {
      console.error("Get verse annotations error:", error);
      res.status(500).json({ error: "Erro ao buscar anotações" });
    }
  });

  app.post("/api/annotations", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertAnnotationSchema.parse({
        ...req.body,
        userId: req.userId,
      });

      const annotation = await storage.createAnnotation(validatedData);
      res.json(annotation);
    } catch (error) {
      console.error("Create annotation error:", error);
      res.status(400).json({ error: "Erro ao criar anotação" });
    }
  });

  app.patch("/api/annotations/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { note } = req.body;
      if (!note) {
        return res.status(400).json({ error: "Nota é obrigatória" });
      }

      const annotation = await storage.updateAnnotation(req.params.id, req.userId!, note);
      if (!annotation) {
        return res.status(404).json({ error: "Anotação não encontrada" });
      }

      res.json(annotation);
    } catch (error) {
      console.error("Update annotation error:", error);
      res.status(500).json({ error: "Erro ao atualizar anotação" });
    }
  });

  app.delete("/api/annotations/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      await storage.deleteAnnotation(req.params.id, req.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete annotation error:", error);
      res.status(500).json({ error: "Erro ao deletar anotação" });
    }
  });

  // -----------------------------------
  // HIGHLIGHTS ROUTES (Cloud Sync)
  // -----------------------------------

  app.get("/api/highlights", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userHighlights = await storage.getUserHighlights(req.userId!);
      res.json(userHighlights);
    } catch (error) {
      console.error("Get highlights error:", error);
      res.status(500).json({ error: "Erro ao buscar destaques" });
    }
  });

  app.get("/api/highlights/:book/:chapter", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { book, chapter } = req.params;
      const chapterHighlights = await storage.getChapterHighlights(req.userId!, book, parseInt(chapter));
      res.json(chapterHighlights);
    } catch (error) {
      console.error("Get chapter highlights error:", error);
      res.status(500).json({ error: "Erro ao buscar destaques do capítulo" });
    }
  });

  app.post("/api/highlights", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { book, chapter, verse, color } = req.body;
      
      if (!book || chapter === undefined || verse === undefined || !color) {
        return res.status(400).json({ error: "Livro, capítulo, versículo e cor são obrigatórios" });
      }

      const highlight = await storage.createHighlight({
        userId: req.userId!,
        book,
        chapter: parseInt(chapter),
        verse: parseInt(verse),
        color,
      });

      res.json(highlight);
    } catch (error) {
      console.error("Create highlight error:", error);
      res.status(400).json({ error: "Erro ao criar destaque" });
    }
  });

  app.delete("/api/highlights/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      await storage.deleteHighlight(req.params.id, req.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete highlight error:", error);
      res.status(500).json({ error: "Erro ao remover destaque" });
    }
  });

  app.delete("/api/highlights/verse/:book/:chapter/:verse", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { book, chapter, verse } = req.params;
      await storage.deleteVerseHighlight(req.userId!, book, parseInt(chapter), parseInt(verse));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete verse highlight error:", error);
      res.status(500).json({ error: "Erro ao remover destaque do versículo" });
    }
  });

  // -----------------------------------
  // READING HISTORY ROUTES (Cloud Sync)
  // -----------------------------------

  app.get("/api/reading-history", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getUserReadingHistory(req.userId!, limit);
      res.json(history);
    } catch (error) {
      console.error("Get reading history error:", error);
      res.status(500).json({ error: "Erro ao buscar histórico de leitura" });
    }
  });

  app.post("/api/reading-history", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { book, chapter, versionCode } = req.body;
      
      if (!book || chapter === undefined) {
        return res.status(400).json({ error: "Livro e capítulo são obrigatórios" });
      }

      const historyEntry = await storage.addReadingHistory({
        userId: req.userId!,
        book,
        chapter: parseInt(chapter),
        versionCode: versionCode || 'ACF',
        readAt: new Date(),
      });

      res.json(historyEntry);
    } catch (error) {
      console.error("Add reading history error:", error);
      res.status(400).json({ error: "Erro ao registrar histórico de leitura" });
    }
  });

  // -----------------------------------
  // CLOUD SYNC ROUTES
  // -----------------------------------

  app.get("/api/sync/all", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const deviceId = req.headers['x-device-id'] as string || 'default';
      
      const allData = await storage.getAllUserData(req.userId!);
      await storage.updateSyncState(req.userId!, deviceId);
      
      res.json({
        success: true,
        data: allData,
        syncedAt: new Date().toISOString(),
        deviceId,
      });
    } catch (error) {
      console.error("Sync all error:", error);
      res.status(500).json({ error: "Erro ao sincronizar dados" });
    }
  });

  app.get("/api/sync/state", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const deviceId = req.headers['x-device-id'] as string || 'default';
      const state = await storage.getSyncState(req.userId!, deviceId);
      
      res.json({
        lastSyncAt: state?.lastSyncAt?.toISOString() || null,
        syncVersion: state?.syncVersion || 0,
        deviceId,
      });
    } catch (error) {
      console.error("Get sync state error:", error);
      res.status(500).json({ error: "Erro ao buscar estado de sincronização" });
    }
  });

  // -----------------------------------
  // CHAT SESSIONS CLOUD SYNC
  // -----------------------------------

  // Get all chat sessions from cloud
  app.get("/api/sync/chat-sessions", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const sessions = await storage.getUserChatSessions(req.userId!);
      const syncMeta = await storage.getUserSyncMeta(req.userId!);
      
      res.json({
        success: true,
        sessions,
        lastSyncedAt: syncMeta?.lastSyncedAt?.toISOString() || null,
      });
    } catch (error) {
      console.error("[Sync] Get chat sessions error:", error);
      res.status(500).json({ error: "Erro ao buscar sessões de chat" });
    }
  });

  // Sync chat sessions to cloud (upsert multiple)
  app.post("/api/sync/chat-sessions", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const { sessions, deletedIds } = req.body;
      const deviceId = req.headers['x-device-id'] as string || 'default';
      
      console.log(`[Sync] User ${req.userId} syncing ${sessions?.length || 0} sessions, deleting ${deletedIds?.length || 0}`);
      
      // Delete sessions marked for deletion
      if (deletedIds && Array.isArray(deletedIds)) {
        for (const id of deletedIds) {
          await storage.deleteChatSession(id, req.userId!);
        }
      }
      
      // Upsert all sessions
      const syncedSessions = [];
      if (sessions && Array.isArray(sessions)) {
        for (const session of sessions) {
          const synced = await storage.upsertChatSession({
            id: session.id,
            userId: req.userId!,
            title: session.title,
            messages: session.messages,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
          });
          syncedSessions.push(synced);
        }
      }
      
      // Update sync metadata
      await storage.updateUserSyncMeta(req.userId!, deviceId);
      
      res.json({
        success: true,
        syncedCount: syncedSessions.length,
        deletedCount: deletedIds?.length || 0,
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Sync] Sync chat sessions error:", error);
      res.status(500).json({ error: "Erro ao sincronizar sessões de chat" });
    }
  });

  // Get sessions updated since a specific timestamp (incremental sync)
  app.get("/api/sync/chat-sessions/since/:timestamp", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const since = new Date(req.params.timestamp);
      if (isNaN(since.getTime())) {
        return res.status(400).json({ error: "Timestamp inválido" });
      }
      
      const sessions = await storage.getChatSessionsSince(req.userId!, since);
      
      res.json({
        success: true,
        sessions,
        since: since.toISOString(),
      });
    } catch (error) {
      console.error("[Sync] Get sessions since error:", error);
      res.status(500).json({ error: "Erro ao buscar sessões atualizadas" });
    }
  });

  // Delete a specific chat session from cloud
  app.delete("/api/sync/chat-sessions/:id", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      await storage.deleteChatSession(req.params.id, req.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("[Sync] Delete chat session error:", error);
      res.status(500).json({ error: "Erro ao deletar sessão de chat" });
    }
  });

  // -----------------------------------
  // GUEST ROUTES (anonymous visitors)
  // -----------------------------------

  // Register or update guest device
  app.post("/api/guest/register", async (req, res) => {
    try {
      const { deviceId, platform, locale } = req.body;
      
      if (!deviceId) {
        return res.status(400).json({ error: "deviceId é obrigatório" });
      }
      
      const guest = await storage.createOrUpdateGuest(deviceId, platform || 'web', locale);
      
      // Track app open event
      await storage.trackAppEvent(deviceId, 'app_open', { platform, locale });
      
      res.json({
        success: true,
        trial: {
          active: new Date() < guest.trialEndAt,
          daysRemaining: Math.max(0, Math.ceil((guest.trialEndAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
          endsAt: guest.trialEndAt.toISOString(),
        },
        isNewDevice: guest.totalSessions === 1,
      });
    } catch (error) {
      console.error("Guest register error:", error);
      res.status(500).json({ error: "Erro ao registrar dispositivo" });
    }
  });

  // Get guest trial status
  app.get("/api/guest/trial/:deviceId", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const trialInfo = await storage.getGuestTrialInfo(deviceId);
      
      if (!trialInfo) {
        return res.json({ active: true, daysRemaining: 30, isNew: true });
      }
      
      res.json(trialInfo);
    } catch (error) {
      console.error("Guest trial error:", error);
      res.status(500).json({ error: "Erro ao verificar trial" });
    }
  });

  // Track app event (for analytics)
  app.post("/api/events/track", async (req, res) => {
    try {
      const { deviceId, eventType, eventData } = req.body;
      
      if (!deviceId || !eventType) {
        return res.status(400).json({ error: "deviceId e eventType são obrigatórios" });
      }
      
      // Try to extract userId from auth token if provided
      let userId: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key') as { userId: string };
          userId = decoded.userId;
        } catch {}
      }
      
      // Update guest lastSeenAt to track online status
      if (deviceId && !userId) {
        await storage.updateGuestLastSeen(deviceId);
      }
      
      await storage.trackAppEvent(deviceId, eventType, eventData, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Track event error:", error);
      res.status(500).json({ error: "Erro ao registrar evento" });
    }
  });

  // Guest AI access check (for AI without login)
  // PLANO GRATUITO: Visitante tem 1 pergunta sem login (+ 2 com login = 3 total)
  const GUEST_AI_LIMIT = 1;
  
  app.post("/api/guest/ai/check", async (req, res) => {
    try {
      const { deviceId } = req.body;
      
      if (!deviceId) {
        return res.status(400).json({ error: "deviceId é obrigatório" });
      }
      
      // Check total usage (not daily) for guests
      const totalUsed = await storage.getGuestTotalUsageCount(deviceId);
      const remaining = Math.max(0, GUEST_AI_LIMIT - totalUsed);
      
      if (remaining <= 0) {
        return res.json({
          canAsk: false,
          reason: 'limit_reached',
          message: `Você atingiu o limite de ${GUEST_AI_LIMIT} perguntas do plano gratuito. Crie uma conta e assine para continuar.`,
          used: totalUsed,
          limit: GUEST_AI_LIMIT,
        });
      }
      
      res.json({
        canAsk: true,
        remainingQuestions: remaining,
        used: totalUsed,
        limit: GUEST_AI_LIMIT,
        mode: 'essential',
      });
    } catch (error) {
      console.error("Guest AI check error:", error);
      res.status(500).json({ error: "Erro ao verificar acesso IA" });
    }
  });

  // Guest AI ask (AI without login)
  // PLANO GRATUITO: Visitante tem 1 pergunta sem login (+ 2 com login = 3 total)
  app.post("/api/guest/ai/ask", async (req, res) => {
    try {
      const { deviceId, question, book, chapter, verse, language } = req.body;
      
      if (!deviceId || !question) {
        return res.status(400).json({ error: "deviceId e question são obrigatórios" });
      }
      
      // Auto-register guest if not exists
      const guestExists = await storage.getGuestTrialInfo(deviceId);
      if (!guestExists) {
        await storage.createOrUpdateGuest(deviceId, 'web');
      }
      
      // Check TOTAL limit (not daily) - 1 pergunta sem login
      const totalUsed = await storage.getGuestTotalUsageCount(deviceId);
      if (totalUsed >= GUEST_AI_LIMIT) {
        return res.status(429).json({
          error: "Limite atingido",
          message: `Você atingiu o limite de ${GUEST_AI_LIMIT} perguntas do plano gratuito. Crie uma conta e assine para continuar.`,
          requiresSubscription: true,
        });
      }
      
      // Ask the AI (essential mode for guests)
      const response = await askTheologicalQuestion({
        question,
        mode: 'essential',
        book,
        chapter,
        verse,
        language,
      });
      
      // Increment usage
      await storage.incrementGuestUsageCount(deviceId);
      
      // Track event
      await storage.trackAppEvent(deviceId, 'ia_question', { 
        mode: 'essential', 
        book, 
        chapter, 
        verse 
      });
      
      res.json({
        response,
        remainingQuestions: GUEST_AI_LIMIT - totalUsed - 1,
        used: totalUsed + 1,
        limit: GUEST_AI_LIMIT,
      });
    } catch (error) {
      console.error("Guest AI ask error:", error);
      res.status(500).json({ error: "Erro ao processar pergunta" });
    }
  });

  // -----------------------------------
  // BIBLE VERSIONS ROUTES
  // -----------------------------------
  
  // Get all available versions from Translation Registry
  app.get("/api/versions", async (req, res) => {
    try {
      // Get verse counts from database to verify data availability
      const verseCounts = await db
        .select({
          versionCode: bibleVerses.versionCode,
          count: sql<number>`count(*)`
        })
        .from(bibleVerses)
        .groupBy(bibleVerses.versionCode);
      
      const countMap = verseCounts.reduce((acc, row) => {
        acc[row.versionCode] = Number(row.count);
        return acc;
      }, {} as Record<string, number>);

      // Return enabled translations with actual data status
      // Use hasData from registry (allows fallback versions to appear)
      const translations = getEnabledTranslations().map(t => ({
        code: t.code,
        name: t.name,
        language: t.language,
        licenseType: t.licenseType,
        hasData: t.hasData || (countMap[t.code] || 0) > 1000,
        verseCount: countMap[t.code] || 0,
        notes: t.notes,
        sourceUrl: t.sourceUrl
      }));

      res.json(translations);
    } catch (error) {
      console.error("Get versions error:", error);
      res.status(500).json({ error: "Erro ao buscar versões" });
    }
  });

  // Get full translation registry (for admin)
  app.get("/api/versions/registry", async (req, res) => {
    try {
      res.json(TRANSLATION_REGISTRY);
    } catch (error) {
      console.error("Get registry error:", error);
      res.status(500).json({ error: "Erro ao buscar registro" });
    }
  });

  // Get user's bible preferences

}
