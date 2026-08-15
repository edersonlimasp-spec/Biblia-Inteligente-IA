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

export function registerPaymentsRoutes(app: Express): void {
  app.use('/api/iap', iapRoutes);

  // ============================================
  // COUPON DISCOUNT SYSTEM
  // ============================================
  
  // Plan prices in cents for coupon calculations
  const PLAN_PRICES_CENTS: Record<string, number> = {
    gold: 990,
    gold_anual: 7990,
    premium: 1990,
    premium_anual: 12990,
    vitalicio: 4990,
    strong_lifetime: 4990,
  };
  
  // Validate coupon endpoint
  app.post("/api/coupons/validate", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const { code, planId } = req.body;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ valid: false, reason: "Código do cupom é obrigatório" });
      }
      
      if (!planId || !PLAN_PRICES_CENTS[planId]) {
        return res.status(400).json({ valid: false, reason: "Plano inválido" });
      }
      
      const normalizedCode = code.trim().toUpperCase();
      
      // Find coupon
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, normalizedCode))
        .limit(1);
      
      if (!coupon) {
        return res.json({ valid: false, reason: "Cupom não encontrado" });
      }
      
      // Check if active
      if (!coupon.active) {
        return res.json({ valid: false, reason: "Cupom inativo" });
      }
      
      // Check date validity
      const now = new Date();
      if (coupon.startsAt && now < coupon.startsAt) {
        return res.json({ valid: false, reason: "Cupom ainda não está ativo" });
      }
      if (coupon.endsAt && now > coupon.endsAt) {
        return res.json({ valid: false, reason: "Cupom expirado" });
      }
      
      // Check applicable plans
      if (coupon.applicablePlans && coupon.applicablePlans.length > 0) {
        if (!coupon.applicablePlans.includes(planId)) {
          return res.json({ valid: false, reason: "Cupom não válido para este plano" });
        }
      }
      
      // Check minimum amount
      const planAmount = PLAN_PRICES_CENTS[planId];
      if (coupon.minAmount && planAmount < coupon.minAmount) {
        return res.json({ valid: false, reason: `Valor mínimo: R$${(coupon.minAmount / 100).toFixed(2)}` });
      }
      
      // Check total redemptions
      if (coupon.maxRedemptions) {
        const [{ count: totalRedemptions }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(couponRedemptions)
          .where(eq(couponRedemptions.couponId, coupon.id));
        
        if (totalRedemptions >= coupon.maxRedemptions) {
          return res.json({ valid: false, reason: "Limite de uso do cupom atingido" });
        }
      }
      
      // Check per-user redemptions
      if (coupon.maxRedemptionsPerUser) {
        const [{ count: userRedemptions }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(couponRedemptions)
          .where(and(
            eq(couponRedemptions.couponId, coupon.id),
            eq(couponRedemptions.userId, userId)
          ));
        
        if (userRedemptions >= coupon.maxRedemptionsPerUser) {
          return res.json({ valid: false, reason: "Você já usou este cupom" });
        }
      }
      
      // Check first purchase only
      if (coupon.firstPurchaseOnly) {
        const existingSubscriptions = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, userId))
          .limit(1);
        
        if (existingSubscriptions.length > 0) {
          return res.json({ valid: false, reason: "Cupom válido apenas para primeira compra" });
        }
      }
      
      // Calculate discount
      let discountAmount: number;
      if (coupon.type === 'PERCENT') {
        discountAmount = Math.round(planAmount * (coupon.value / 100));
      } else {
        discountAmount = Math.min(coupon.value, planAmount);
      }
      
      const finalAmount = Math.max(0, planAmount - discountAmount);
      
      res.json({
        valid: true,
        couponId: coupon.id,
        discountType: coupon.type,
        discountValue: coupon.value,
        discountAmount,
        amountBefore: planAmount,
        finalAmount,
        discountDisplay: coupon.type === 'PERCENT' 
          ? `${coupon.value}% OFF` 
          : `R$${(coupon.value / 100).toFixed(2)} OFF`,
      });
      
    } catch (error) {
      console.error("[Coupon] Erro ao validar cupom:", error);
      res.status(500).json({ valid: false, reason: "Erro interno ao validar cupom" });
    }
  });
  
  // Admin: List all coupons
  app.get("/api/admin/coupons", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const allCoupons = await db
        .select()
        .from(coupons)
        .orderBy(desc(coupons.createdAt));
      
      // Get redemption counts
      const redemptionCounts = await db
        .select({
          couponId: couponRedemptions.couponId,
          count: sql<number>`count(*)::int`,
        })
        .from(couponRedemptions)
        .groupBy(couponRedemptions.couponId);
      
      const countMap = new Map(redemptionCounts.map(r => [r.couponId, r.count]));
      
      const couponsWithCounts = allCoupons.map(c => ({
        ...c,
        redemptionCount: countMap.get(c.id) || 0,
      }));
      
      res.json(couponsWithCounts);
    } catch (error) {
      console.error("[Admin Coupon] Erro ao listar cupons:", error);
      res.status(500).json({ error: "Erro ao listar cupons" });
    }
  });
  
  // Admin: Create coupon
  app.post("/api/admin/coupons", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { code, type, value, active, startsAt, endsAt, maxRedemptions, maxRedemptionsPerUser, minAmount, applicablePlans, firstPurchaseOnly } = req.body;
      
      if (!code || !type || value === undefined) {
        return res.status(400).json({ error: "code, type e value são obrigatórios" });
      }
      
      if (!['PERCENT', 'FIXED'].includes(type)) {
        return res.status(400).json({ error: "type deve ser PERCENT ou FIXED" });
      }
      
      if (type === 'PERCENT' && (value < 0 || value > 100)) {
        return res.status(400).json({ error: "Valor de porcentagem deve estar entre 0 e 100" });
      }
      
      const normalizedCode = code.trim().toUpperCase();
      
      // Check if code exists
      const existing = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, normalizedCode))
        .limit(1);
      
      if (existing.length > 0) {
        return res.status(400).json({ error: "Código de cupom já existe" });
      }
      
      const [newCoupon] = await db.insert(coupons).values({
        code: normalizedCode,
        type,
        value: parseInt(value),
        active: active !== false,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        maxRedemptions: maxRedemptions || null,
        maxRedemptionsPerUser: maxRedemptionsPerUser || 1,
        minAmount: minAmount || null,
        applicablePlans: applicablePlans || null,
        firstPurchaseOnly: firstPurchaseOnly || false,
      }).returning();
      
      console.log(`[Admin Coupon] Cupom criado: ${normalizedCode} (${type} ${value})`);
      res.json(newCoupon);
    } catch (error) {
      console.error("[Admin Coupon] Erro ao criar cupom:", error);
      res.status(500).json({ error: "Erro ao criar cupom" });
    }
  });
  
  // Admin: Update coupon
  app.put("/api/admin/coupons/:id", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { code, type, value, active, startsAt, endsAt, maxRedemptions, maxRedemptionsPerUser, minAmount, applicablePlans, firstPurchaseOnly } = req.body;
      
      const updateData: any = { updatedAt: new Date() };
      
      if (code !== undefined) updateData.code = code.trim().toUpperCase();
      if (type !== undefined) updateData.type = type;
      if (value !== undefined) updateData.value = parseInt(value);
      if (active !== undefined) updateData.active = active;
      if (startsAt !== undefined) updateData.startsAt = startsAt ? new Date(startsAt) : null;
      if (endsAt !== undefined) updateData.endsAt = endsAt ? new Date(endsAt) : null;
      if (maxRedemptions !== undefined) updateData.maxRedemptions = maxRedemptions || null;
      if (maxRedemptionsPerUser !== undefined) updateData.maxRedemptionsPerUser = maxRedemptionsPerUser;
      if (minAmount !== undefined) updateData.minAmount = minAmount || null;
      if (applicablePlans !== undefined) updateData.applicablePlans = applicablePlans;
      if (firstPurchaseOnly !== undefined) updateData.firstPurchaseOnly = firstPurchaseOnly;
      
      const [updated] = await db
        .update(coupons)
        .set(updateData)
        .where(eq(coupons.id, id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: "Cupom não encontrado" });
      }
      
      console.log(`[Admin Coupon] Cupom atualizado: ${updated.code}`);
      res.json(updated);
    } catch (error) {
      console.error("[Admin Coupon] Erro ao atualizar cupom:", error);
      res.status(500).json({ error: "Erro ao atualizar cupom" });
    }
  });
  
  // Admin: Delete coupon (only if no redemptions)
  app.delete("/api/admin/coupons/:id", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      // Check if has redemptions
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(couponRedemptions)
        .where(eq(couponRedemptions.couponId, id));
      
      if (count > 0) {
        return res.status(400).json({ error: "Cupom tem resgates e não pode ser excluído. Desative-o." });
      }
      
      await db.delete(coupons).where(eq(coupons.id, id));
      
      console.log(`[Admin Coupon] Cupom excluído: ${id}`);
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin Coupon] Erro ao excluir cupom:", error);
      res.status(500).json({ error: "Erro ao excluir cupom" });
    }
  });
  
  // Admin: Get coupon details with redemptions
  app.get("/api/admin/coupons/:id/redemptions", ensureAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const redemptions = await db
        .select({
          id: couponRedemptions.id,
          userId: couponRedemptions.userId,
          userEmail: users.email,
          userName: users.name,
          planId: couponRedemptions.planId,
          amountBefore: couponRedemptions.amountBefore,
          discountAmount: couponRedemptions.discountAmount,
          amountAfter: couponRedemptions.amountAfter,
          redeemedAt: couponRedemptions.redeemedAt,
        })
        .from(couponRedemptions)
        .leftJoin(users, eq(couponRedemptions.userId, users.id))
        .where(eq(couponRedemptions.couponId, id))
        .orderBy(desc(couponRedemptions.redeemedAt))
        .limit(50);
      
      res.json(redemptions);
    } catch (error) {
      console.error("[Admin Coupon] Erro ao buscar resgates:", error);
      res.status(500).json({ error: "Erro ao buscar resgates" });
    }
  });

  // ============================================
  // MERCADO PAGO CHECKOUT PRO INTEGRATION
  // ============================================
  
  // Plan configuration with fixed prices (BRL)
  const MP_PLAN_CONFIG: Record<string, { title: string; price: number; days: number | null }> = {
    gold: { title: "Bíblia Inteligente - Plano Gold", price: 9.90, days: 30 },
    gold_anual: { title: "Bíblia Inteligente - Plano Gold Anual", price: 79.90, days: 365 },
    premium: { title: "Bíblia Inteligente - Plano Premium", price: 19.90, days: 30 },
    premium_anual: { title: "Bíblia Inteligente - Plano Premium Anual", price: 129.90, days: 365 },
    vitalicio: { title: "Bíblia Inteligente - Strong Vitalício", price: 49.90, days: null },
    strong_lifetime: { title: "Bíblia Inteligente - Strong Vitalício", price: 49.90, days: null },
  };
  
  // PRODUCTION URL - Always use this for redirects after payment
  // This ensures users are NEVER redirected to *.picard.replit.dev
  const PRODUCTION_APP_URL = 'https://bibliainteligente.replit.app';
  
  // Get APP_URL - for webhooks (can use dev domain)
  function getAppUrl(): string {
    if (process.env.APP_URL) {
      return process.env.APP_URL.replace(/\/$/, '');
    }
    // For REPLIT_DOMAINS, prefer the .replit.app production domain
    if (process.env.REPLIT_DOMAINS) {
      const domains = process.env.REPLIT_DOMAINS.split(',');
      // Find the production domain (ends with .replit.app)
      const prodDomain = domains.find(d => d.endsWith('.replit.app'));
      if (prodDomain) {
        return `https://${prodDomain}`;
      }
      if (domains.length > 0) {
        return `https://${domains[0]}`;
      }
    }
    // Fallback to dev domain only if no production domain
    if (process.env.REPLIT_DEV_DOMAIN) {
      return `https://${process.env.REPLIT_DEV_DOMAIN}`;
    }
    return 'https://localhost:5000';
  }
  
  // Create Mercado Pago Checkout preference
  app.post("/api/mp/create-checkout", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      // ── HARD BLOCK iOS (App Store guideline 3.1.1) ──────────────────
      // Pagamentos externos (Mercado Pago) NUNCA podem ser iniciados a partir
      // do app iOS — Apple exige uso exclusivo de StoreKit IAP. Mesmo que toda
      // a UI client-side falhe, o servidor recusa aqui de forma definitiva.
      if (getClientPlatform(req) === 'ios') {
        console.warn('[MP] ✖ create-checkout bloqueado: requisição vinda do iOS (App Store 3.1.1)');
        return res.status(403).json({ error: "Pagamento indisponível neste dispositivo. Use a App Store." });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const { plan, couponCode } = req.body;
      if (!plan || !MP_PLAN_CONFIG[plan]) {
        return res.status(400).json({ error: "Plano inválido. Escolha: gold, premium ou vitalicio" });
      }
      
      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        console.error("[MP] MP_ACCESS_TOKEN não configurado");
        return res.status(500).json({ error: "Configuração de pagamento não disponível" });
      }
      
      const planConfig = MP_PLAN_CONFIG[plan];
      const planType = plan === 'strong_lifetime' ? 'vitalicio' : plan;
      
      // Fetch user email for payer info
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`[MP] ❌ Usuário não encontrado: ${userId}`);
        return res.status(400).json({ error: "Usuário não encontrado" });
      }
      
      const userEmail = user.email;
      if (!userEmail) {
        console.warn(`[MP] ⚠️ Usuário ${userId} não tem email cadastrado`);
      }
      
      // Apply coupon discount if provided
      let finalPrice = planConfig.price;
      let appliedCoupon: { id: string; code: string; discountAmount: number } | null = null;
      
      if (couponCode && typeof couponCode === 'string') {
        const normalizedCode = couponCode.trim().toUpperCase();
        
        // Validate coupon server-side (never trust frontend calculations)
        const [coupon] = await db
          .select()
          .from(coupons)
          .where(eq(coupons.code, normalizedCode))
          .limit(1);
        
        if (coupon && coupon.active) {
          const now = new Date();
          const isValidDate = (!coupon.startsAt || now >= coupon.startsAt) && (!coupon.endsAt || now <= coupon.endsAt);
          const isValidPlan = !coupon.applicablePlans || coupon.applicablePlans.length === 0 || coupon.applicablePlans.includes(plan);
          const planAmountCents = Math.round(planConfig.price * 100);
          const isMinAmountMet = !coupon.minAmount || planAmountCents >= coupon.minAmount;
          
          // Check redemption limits
          let isWithinLimits = true;
          
          if (coupon.maxRedemptions) {
            const [{ count: totalRedemptions }] = await db
              .select({ count: sql<number>`count(*)::int` })
              .from(couponRedemptions)
              .where(eq(couponRedemptions.couponId, coupon.id));
            if (totalRedemptions >= coupon.maxRedemptions) isWithinLimits = false;
          }
          
          if (isWithinLimits && coupon.maxRedemptionsPerUser) {
            const [{ count: userRedemptions }] = await db
              .select({ count: sql<number>`count(*)::int` })
              .from(couponRedemptions)
              .where(and(
                eq(couponRedemptions.couponId, coupon.id),
                eq(couponRedemptions.userId, userId)
              ));
            if (userRedemptions >= coupon.maxRedemptionsPerUser) isWithinLimits = false;
          }
          
          // Check first purchase only
          let isFirstPurchaseValid = true;
          if (coupon.firstPurchaseOnly) {
            const existingSubs = await db
              .select()
              .from(subscriptions)
              .where(eq(subscriptions.userId, userId))
              .limit(1);
            if (existingSubs.length > 0) isFirstPurchaseValid = false;
          }
          
          if (isValidDate && isValidPlan && isMinAmountMet && isWithinLimits && isFirstPurchaseValid) {
            let discountAmount: number;
            if (coupon.type === 'PERCENT') {
              discountAmount = planConfig.price * (coupon.value / 100);
            } else {
              discountAmount = Math.min(coupon.value / 100, planConfig.price);
            }
            
            finalPrice = Math.max(0.01, planConfig.price - discountAmount); // Minimum R$0.01
            finalPrice = Math.round(finalPrice * 100) / 100; // Round to 2 decimals
            
            appliedCoupon = {
              id: coupon.id,
              code: coupon.code,
              discountAmount: Math.round(discountAmount * 100), // In cents
            };
            
            console.log(`[MP] 🎫 Cupom ${coupon.code} aplicado: -R$${discountAmount.toFixed(2)} (${coupon.type} ${coupon.value})`);
          } else {
            console.log(`[MP] ⚠️ Cupom ${normalizedCode} inválido ou expirado, ignorando`);
          }
        }
      }
      
      // Create external reference with user, plan and coupon info (CRITICAL for webhook)
      const externalReference = JSON.stringify({
        userId,
        plan: planType,
        days: planConfig.days,
        lifetime: planConfig.days === null,
        ...(appliedCoupon && {
          couponId: appliedCoupon.id,
          couponCode: appliedCoupon.code,
          couponDiscount: appliedCoupon.discountAmount,
          originalAmount: Math.round(planConfig.price * 100),
        }),
      });
      
      console.log(`[MP] ════════════════════════════════════════════════════`);
      console.log(`[MP] CRIANDO CHECKOUT`);
      console.log(`[MP] userId: ${userId}`);
      console.log(`[MP] email: ${userEmail}`);
      console.log(`[MP] plan: ${plan}`);
      console.log(`[MP] originalPrice: R$${planConfig.price}`);
      console.log(`[MP] finalPrice: R$${finalPrice}${appliedCoupon ? ` (cupom: ${appliedCoupon.code})` : ''}`);
      console.log(`[MP] external_reference: ${externalReference}`);
      console.log(`[MP] ════════════════════════════════════════════════════`);
      
      // Create Mercado Pago preference
      // IMPORTANT: back_urls MUST use PRODUCTION_APP_URL to avoid *.picard.replit.dev redirect
      const preference = {
        items: [{
          id: `plan_${planType}`,
          title: appliedCoupon 
            ? `${planConfig.title} (Cupom: ${appliedCoupon.code})`
            : planConfig.title,
          description: `Plano ${planType.charAt(0).toUpperCase() + planType.slice(1)} - Bíblia Inteligente IA`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: finalPrice,
        }],
        // ETAPA C: external_reference com userId (CRÍTICO)
        external_reference: externalReference,
        // ETAPA C: metadata com userId e plan (redundância para segurança)
        metadata: {
          userId: userId,
          user_id: userId,
          plan: planType,
          planType: planType,
          userEmail: userEmail || '',
          ...(appliedCoupon && {
            couponId: appliedCoupon.id,
            couponCode: appliedCoupon.code,
            couponDiscount: appliedCoupon.discountAmount,
          }),
        },
        // NOTA: payer.email NÃO é enviado intencionalmente.
        // Quando o e-mail do app do usuário coincide com o e-mail da conta MP do comprador,
        // o MP entende que é auto-compra e desabilita o botão "Pagar" (fica cinza).
        // Sem payer.email, o MP usa o e-mail do login do comprador automaticamente.
        back_urls: {
          success: `${PRODUCTION_APP_URL}/mp/return?status=success`,
          failure: `${PRODUCTION_APP_URL}/mp/return?status=failure`,
          pending: `${PRODUCTION_APP_URL}/mp/return?status=pending`,
        },
        auto_return: "approved",
        notification_url: `${PRODUCTION_APP_URL}/api/mp/webhook`,
        // Statement descriptor
        statement_descriptor: "BIBLIA IA",
        // Payment methods - include Pix, credit card, debit, boleto
        payment_methods: {
          excluded_payment_types: [],
          excluded_payment_methods: [],
          installments: 12,
          default_installments: 1,
        },
      };
      
      console.log(`[MP] Preference payload:`, JSON.stringify(preference, null, 2));
      
      console.log(`[MP] create-checkout plan=${plan} userId=${userId} price=${planConfig.price}`);
      
      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mpAccessToken}`,
        },
        body: JSON.stringify(preference),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[MP] Erro ao criar preferência: ${response.status} - ${errorText}`);
        return res.status(500).json({ error: "Erro ao criar checkout" });
      }
      
      const data = await response.json();
      console.log(`[MP] Checkout criado: preference_id=${data.id}`);
      console.log(`[MP] init_point=${data.init_point}`);
      
      res.json({
        init_point: data.init_point,
        preference_id: data.id,
      });
    } catch (error) {
      console.error("[MP] Erro ao criar checkout:", error);
      res.status(500).json({ error: "Erro interno ao processar pagamento" });
    }
  });
  
  // ===================================
  // MERCADO PAGO PIX - Create Pix payment with QR Code
  // ===================================
  app.post("/api/mp/create-pix", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      // ── HARD BLOCK iOS (App Store guideline 3.1.1) ──────────────────
      // PIX é exclusivamente Mercado Pago e NUNCA pode rodar no iOS.
      if (getClientPlatform(req) === 'ios') {
        console.warn('[MP Pix] ✖ create-pix bloqueado: requisição vinda do iOS (App Store 3.1.1)');
        return res.status(403).json({ error: "Pagamento indisponível neste dispositivo. Use a App Store." });
      }

      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const { plan } = req.body;
      if (!plan || !MP_PLAN_CONFIG[plan]) {
        return res.status(400).json({ error: "Plano inválido. Escolha: gold, premium ou vitalicio" });
      }
      
      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        console.error("[MP Pix] MP_ACCESS_TOKEN não configurado");
        return res.status(500).json({ error: "Configuração de pagamento não disponível" });
      }
      
      const planConfig = MP_PLAN_CONFIG[plan];
      const planType = plan === 'strong_lifetime' ? 'vitalicio' : plan;
      
      // Fetch user for payer info
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(400).json({ error: "Usuário não encontrado" });
      }
      
      // External reference for webhook
      const externalReference = JSON.stringify({
        userId,
        plan: planType,
        days: planConfig.days,
        lifetime: planConfig.days === null,
      });
      
      console.log(`[MP Pix] ════════════════════════════════════════════════════`);
      console.log(`[MP Pix] CRIANDO PAGAMENTO PIX`);
      console.log(`[MP Pix] userId: ${userId}, plan: ${plan}, price: R$${planConfig.price}`);
      console.log(`[MP Pix] ════════════════════════════════════════════════════`);
      
      // Create Pix payment via Mercado Pago API
      const pixPayment = {
        transaction_amount: planConfig.price,
        description: planConfig.title,
        payment_method_id: "pix",
        payer: {
          email: user.email || `user_${userId}@bibliaintegente.app`,
          first_name: user.name?.split(' ')[0] || "Usuario",
          last_name: user.name?.split(' ').slice(1).join(' ') || "App",
        },
        external_reference: externalReference,
        metadata: {
          userId: userId,
          plan: planType,
        },
        notification_url: `${PRODUCTION_APP_URL}/api/mp/webhook`,
      };
      
      const response = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mpAccessToken}`,
          "X-Idempotency-Key": `pix_${userId}_${plan}_${Date.now()}`,
        },
        body: JSON.stringify(pixPayment),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[MP Pix] Erro ao criar pagamento: ${response.status} - ${errorText}`);
        return res.status(500).json({ error: "Erro ao gerar Pix" });
      }
      
      const data = await response.json();
      console.log(`[MP Pix] Pagamento criado: id=${data.id}, status=${data.status}`);
      
      // Extract Pix data
      const pixData = data.point_of_interaction?.transaction_data;
      
      if (!pixData?.qr_code || !pixData?.qr_code_base64) {
        console.error("[MP Pix] QR Code não retornado pela API");
        return res.status(500).json({ error: "Erro ao gerar QR Code Pix" });
      }
      
      res.json({
        paymentId: data.id,
        status: data.status,
        qrCode: pixData.qr_code, // Código copia-e-cola
        qrCodeBase64: pixData.qr_code_base64, // Imagem em base64
        expirationDate: pixData.expiration_date,
        ticketUrl: pixData.ticket_url,
        amount: planConfig.price,
        planName: planConfig.title,
      });
    } catch (error) {
      console.error("[MP Pix] Erro ao criar pagamento:", error);
      res.status(500).json({ error: "Erro interno ao processar Pix" });
    }
  });
  
  // Check Pix payment status (with ownership verification)
  app.get("/api/mp/pix-status/:paymentId", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      // ── HARD BLOCK iOS (App Store guideline 3.1.1) ──────────────────
      if (getClientPlatform(req) === 'ios') {
        return res.status(403).json({ error: "Indisponível neste dispositivo." });
      }
      const { paymentId } = req.params;
      const userId = req.userId;
      
      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        return res.status(500).json({ error: "Configuração não disponível" });
      }
      
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${mpAccessToken}`,
        },
      });
      
      if (!response.ok) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
      }
      
      const data = await response.json();
      
      // Security: Verify payment belongs to requesting user
      let paymentUserId: string | null = null;
      try {
        if (data.external_reference) {
          const refData = JSON.parse(data.external_reference);
          paymentUserId = refData.userId;
        }
      } catch (e) {
        // external_reference might not be JSON
      }
      
      if (!paymentUserId) {
        paymentUserId = data.metadata?.userId || data.metadata?.user_id;
      }
      
      if (paymentUserId && paymentUserId !== userId) {
        console.warn(`[MP Pix Status] Unauthorized: user ${userId} tried to check payment of user ${paymentUserId}`);
        return res.status(403).json({ error: "Acesso não autorizado" });
      }
      
      const isApproved = data.status === 'approved';
      
      // If payment is approved, activate subscription immediately (fallback for webhook delay)
      if (isApproved && userId) {
        try {
          const paymentIdStr = String(data.id);
          
          // IDEMPOTENCY CHECK: Check if this payment was already processed
          const existingByPaymentId = await storage.getSubscriptionByExternalId(paymentIdStr);
          if (existingByPaymentId) {
            console.log(`[MP Pix Status] Pagamento ${paymentIdStr} já processado, ignorando ativação duplicada`);
          } else {
            // Parse plan info from external_reference (required, no fallback to amount)
            let planType: string | null = null;
            let days: number | null = null;
            let lifetime = false;
            
            if (data.external_reference) {
              try {
                const refData = JSON.parse(data.external_reference);
                planType = refData.plan || refData.planType;
                days = refData.days;
                lifetime = refData.lifetime || false;
              } catch (e) {
                console.error("[MP Pix Status] Erro ao parsear external_reference:", e);
              }
            }
            
            if (planType) {
              // Normalizar planType: 'vitalicio' -> 'strong_lifetime' para consistência
              const normalizedPlanType = planType === 'vitalicio' ? 'strong_lifetime' : planType;
              
              console.log(`[MP Pix Status] ✅ Ativando plano via polling: userId=${userId}, plan=${normalizedPlanType}, paymentId=${paymentIdStr}`);
              
              const endDate = lifetime || normalizedPlanType === 'strong_lifetime' ? null : new Date(Date.now() + (days || 30) * 24 * 60 * 60 * 1000);
              
              // Get plan price
              const planPrices: Record<string, string> = {
                'gold': '9.90',
                'gold_anual': '79.90',
                'premium': '19.90',
                'premium_anual': '129.90',
                'vitalicio': '49.90',
                'strong_lifetime': '49.90',
              };
              
              // Usar upsertSubscription para evitar duplicatas (consistência com webhook)
              await storage.upsertSubscription({
                userId,
                planType: normalizedPlanType,
                status: 'active',
                startDate: new Date(),
                endDate,
                amount: planPrices[normalizedPlanType] || planPrices[planType] || '0',
                source: 'web',
                storeTransactionId: paymentIdStr,
              });
              
              console.log(`[MP Pix Status] ✅ Plano ${normalizedPlanType} ativado com sucesso!`);
            } else {
              console.error(`[MP Pix Status] ❌ Não foi possível determinar planType para paymentId=${paymentIdStr}`);
            }
          }
        } catch (activationError) {
          console.error("[MP Pix Status] Erro ao ativar plano:", activationError);
          // Don't fail the response, just log the error
        }
      }
      
      console.log(`[MP Pix Status] paymentId=${paymentId}, status=${data.status}, approved=${isApproved}`);
      
      res.json({
        status: data.status,
        statusDetail: data.status_detail,
        approved: isApproved,
      });
    } catch (error) {
      console.error("[MP Pix Status] Erro:", error);
      res.status(500).json({ error: "Erro ao verificar status" });
    }
  });
  
  // ===================================
  // MERCADO PAGO RETURN ROUTE - Redirect after payment
  // ===================================
  
  // GET /mp/return - Rota de retorno após pagamento no Mercado Pago
  // Esta rota SEMPRE redireciona para o app, nunca mostra erro
  app.get("/mp/return", (req, res) => {
    console.log("[MP Return] ========================================");
    console.log("[MP Return] Query params:", req.query);
    
    // Extrair parâmetros do Mercado Pago
    const status = req.query.status as string || 'unknown';
    const paymentId = req.query.payment_id as string || req.query.collection_id as string || '';
    const preferenceId = req.query.preference_id as string || '';
    const externalReference = req.query.external_reference as string || '';
    const merchantOrderId = req.query.merchant_order_id as string || '';
    
    console.log(`[MP Return] status=${status}, payment_id=${paymentId}, preference_id=${preferenceId}`);
    
    // Construir URL de redirecionamento para as páginas existentes no frontend
    // O frontend tem: /pagamento/sucesso, /pagamento/erro, /pagamento/pendente
    let redirectPath = '/pagamento/sucesso'; // default para sucesso
    
    if (status === 'success' || status === 'approved') {
      redirectPath = '/pagamento/sucesso';
    } else if (status === 'failure' || status === 'rejected') {
      redirectPath = '/pagamento/erro';
    } else if (status === 'pending' || status === 'in_process') {
      redirectPath = '/pagamento/pendente';
    }
    
    // Adicionar parâmetros úteis
    const queryParams = new URLSearchParams();
    if (paymentId) queryParams.set('payment_id', paymentId);
    if (preferenceId) queryParams.set('preference_id', preferenceId);
    
    const queryString = queryParams.toString();
    if (queryString) {
      redirectPath += `?${queryString}`;
    }
    
    // Construir URL final (SEMPRE para produção, nunca para *.picard.replit.dev)
    const finalUrl = `${PRODUCTION_APP_URL}${redirectPath}`;
    
    console.log(`[MP Return] Redirecionando para: ${finalUrl}`);
    
    // SEMPRE retornar redirect 302
    res.redirect(302, finalUrl);
  });
  
  // GET /api/mp/status - Verificar status da assinatura do usuário
  app.get("/api/mp/status", ensureAuthenticated, async (req: AuthRequest, res) => {
    try {
      // ── HARD BLOCK iOS (App Store guideline 3.1.1) ──────────────────
      // No iOS o app não pode consultar/expor assinaturas de fonte web.
      if (getClientPlatform(req) === 'ios') {
        return res.status(403).json({ error: "Indisponível neste dispositivo." });
      }
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      // Buscar assinaturas ativas do usuário
      const hasGold = await storage.hasActiveSubscription(userId, 'gold');
      const hasPremium = await storage.hasActiveSubscription(userId, 'premium');
      const hasStrongLifetime = await storage.hasActiveSubscription(userId, 'strong_lifetime');
      
      // Buscar detalhes da assinatura
      const subscription = await storage.getActiveSubscription(userId);
      
      res.json({
        success: true,
        hasActiveSubscription: hasGold || hasPremium || hasStrongLifetime,
        plans: {
          gold: hasGold,
          premium: hasPremium,
          strong_lifetime: hasStrongLifetime,
        },
        subscription: subscription ? {
          id: subscription.id,
          planType: subscription.planType,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        } : null,
      });
    } catch (error) {
      console.error("[MP Status] Error:", error);
      res.status(500).json({ error: "Erro ao verificar status" });
    }
  });
  
  // ===================================
  // MERCADO PAGO WEBHOOK - COMPLETE IMPLEMENTATION
  // ===================================
  
  // Memory storage for last webhook (expires after 15 minutes)
  interface LastWebhookData {
    receivedAt: Date;
    query: any;
    body: any;
    headers: any;
    processedResult?: {
      success: boolean;
      userId?: string;
      plan?: string;
      error?: string;
      receiptCreated?: boolean;
      grossAmount?: number;
      netAmount?: number;
    };
  }
  let lastWebhookData: LastWebhookData | null = null;
  
  // GET /api/mp/health - Health check endpoint
  app.get("/api/mp/health", (_req, res) => {
    console.log("[MP] Health check");
    res.status(200).json({ 
      ok: true,
      timestamp: new Date().toISOString(),
      webhookUrl: `${PRODUCTION_APP_URL}/api/mp/webhook`,
      hasToken: !!process.env.MP_ACCESS_TOKEN,
    });
  });
  
  // GET /api/mp/last-webhook - Returns the last webhook received (for debugging)
  app.get("/api/mp/last-webhook", (_req, res) => {
    console.log("[MP] Last webhook request");
    
    if (!lastWebhookData) {
      return res.status(200).json({ 
        message: "Nenhum webhook recebido ainda",
        lastWebhook: null,
      });
    }
    
    // Check if expired (15 minutes)
    const now = new Date();
    const age = now.getTime() - lastWebhookData.receivedAt.getTime();
    const maxAge = 15 * 60 * 1000; // 15 minutes
    
    if (age > maxAge) {
      return res.status(200).json({
        message: "Último webhook expirou (mais de 15 minutos)",
        expiredAt: new Date(lastWebhookData.receivedAt.getTime() + maxAge).toISOString(),
        lastWebhook: null,
      });
    }
    
    res.status(200).json({
      message: "Último webhook recebido",
      ageSeconds: Math.round(age / 1000),
      lastWebhook: lastWebhookData,
    });
  });
  
  // GET /api/mp/webhook - Endpoint de teste para verificar se webhook está online
  app.get("/api/mp/webhook", (_req, res) => {
    console.log("[MP Webhook] GET - Teste de verificação do endpoint");
    res.status(200).send("OK webhook endpoint online");
  });
  
  // POST /api/mp/webhook - Recebe notificações do Mercado Pago
  app.post("/api/mp/webhook", async (req, res) => {
    const webhookReceivedAt = new Date();
    
    // Log imediato de recebimento
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║           WEBHOOK MERCADO PAGO RECEBIDO                    ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("[MP Webhook] Timestamp:", webhookReceivedAt.toISOString());
    console.log("[MP Webhook] Query:", JSON.stringify(req.query, null, 2));
    console.log("[MP Webhook] Body:", JSON.stringify(req.body, null, 2));
    console.log("[MP Webhook] Headers:", JSON.stringify({
      'content-type': req.headers['content-type'],
      'x-signature': req.headers['x-signature'],
      'x-request-id': req.headers['x-request-id'],
    }, null, 2));
    
    // Armazenar dados do webhook para debug (clonar de forma segura)
    const safeClone = (obj: unknown): unknown => {
      try {
        if (obj === null || obj === undefined) return null;
        if (typeof obj !== 'object') return obj;
        return JSON.parse(JSON.stringify(obj, (key, value) => {
          if (typeof value === 'bigint') return value.toString();
          if (typeof value === 'function') return '[function]';
          if (value instanceof Date) return value.toISOString();
          return value;
        }));
      } catch {
        return { _cloneError: true, toString: String(obj).substring(0, 500) };
      }
    };
    
    lastWebhookData = {
      receivedAt: webhookReceivedAt,
      query: safeClone(req.query) as any,
      body: safeClone(req.body) as any,
      headers: {
        'content-type': req.headers['content-type'] || null,
        'x-signature': req.headers['x-signature'] || null,
        'x-request-id': req.headers['x-request-id'] || null,
      },
    };
    
    // Responder 200 IMEDIATAMENTE para o Mercado Pago não reenviar
    res.sendStatus(200);
    console.log("[MP Webhook] ✓ Respondeu 200 OK ao Mercado Pago");

    // Verificação HMAC-SHA256 da assinatura do Mercado Pago (pull-back permanece como camada adicional)
    const mpWebhookSecret = process.env.MP_WEBHOOK_SECRET;
    if (mpWebhookSecret) {
      const rawSig = req.headers['x-signature'] as string | undefined;
      const requestId = req.headers['x-request-id'] as string | undefined;
      const notifId = (req.query["data.id"] as string) || req.body?.data?.id || '';
      const tsMatch = rawSig?.match(/ts=(\d+)/);
      const v1Match = rawSig?.match(/v1=([a-f0-9]+)/);
      if (!tsMatch || !v1Match) {
        console.warn("[MP Webhook] ⚠️ x-signature ausente ou malformado — ignorando processamento");
        lastWebhookData.processedResult = { success: false, error: "Assinatura inválida ou ausente" };
        return;
      }
      const signedStr = `id:${notifId};request-id:${requestId ?? ''};ts=${tsMatch[1]}`;
      const expected = crypto.createHmac('sha256', mpWebhookSecret).update(signedStr).digest('hex');
      if (expected !== v1Match[1]) {
        console.warn("[MP Webhook] ⚠️ Assinatura HMAC-SHA256 inválida — possível requisição forjada, ignorando");
        lastWebhookData.processedResult = { success: false, error: "Assinatura HMAC inválida" };
        return;
      }
      console.log("[MP Webhook] ✓ Assinatura HMAC-SHA256 válida");
    } else {
      console.warn("[MP Webhook] ⚠️ MP_WEBHOOK_SECRET não configurado — verificação de assinatura desativada");
    }

    // Processar em background (após resposta)
    try {
      // Extrair type de múltiplas fontes possíveis
      const type = 
        req.query.type as string || 
        req.query.topic as string || 
        req.body?.type || 
        req.body?.topic || 
        req.body?.action || 
        '';
      
      // Extrair dataId de múltiplas fontes possíveis
      const dataId = 
        req.query["data.id"] as string || 
        req.query.id as string || 
        req.body?.data?.id || 
        req.body?.id || 
        '';
      
      console.log(`[MP Webhook] Extracted: type="${type}", dataId="${dataId}"`);
      
      if (!dataId) {
        console.log("[MP Webhook] ❌ Sem dataId - ignorando notificação");
        lastWebhookData.processedResult = { success: false, error: "Sem dataId" };
        return;
      }
      
      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        console.error("[MP Webhook] ❌ MP_ACCESS_TOKEN não configurado!");
        lastWebhookData.processedResult = { success: false, error: "MP_ACCESS_TOKEN não configurado" };
        return;
      }
      
      // Determinar se é payment ou preapproval (assinatura recorrente)
      const isPayment = type === 'payment' || type.startsWith('payment.');
      const isPreapproval = type === 'subscription_preapproval' || type === 'preapproval' || type.startsWith('subscription');
      
      console.log(`[MP Webhook] Tipo de notificação: isPayment=${isPayment}, isPreapproval=${isPreapproval}`);
      
      let apiUrl: string;
      if (isPreapproval) {
        apiUrl = `https://api.mercadopago.com/preapproval/${dataId}`;
      } else {
        // Default: tratar como payment
        apiUrl = `https://api.mercadopago.com/v1/payments/${dataId}`;
      }
      
      console.log(`[MP Webhook] Buscando dados em: ${apiUrl}`);
      
      // Buscar detalhes do pagamento/assinatura no Mercado Pago
      const mpResponse = await fetch(apiUrl, {
        headers: {
          "Authorization": `Bearer ${mpAccessToken}`,
        },
      });
      
      if (!mpResponse.ok) {
        const errorText = await mpResponse.text();
        console.error(`[MP Webhook] ❌ Erro ao buscar MP API: ${mpResponse.status} - ${errorText}`);
        lastWebhookData.processedResult = { success: false, error: `Erro MP API: ${mpResponse.status}` };
        return;
      }
      
      const mpData = await mpResponse.json();
      console.log(`[MP Webhook] ✓ Dados recebidos do MP API`);
      console.log(`[MP Webhook] Dados do MP:`, JSON.stringify(mpData, null, 2));
      
      // Verificar status aprovado
      const status = mpData.status;
      const isApproved = 
        status === 'approved' || 
        status === 'authorized' || 
        status === 'active';
      
      console.log(`[MP Webhook] Status: ${status}, isApproved: ${isApproved}`);
      
      if (!isApproved) {
        console.log(`[MP Webhook] ⏳ Pagamento não aprovado ainda (status=${status}) - aguardando`);
        return;
      }
      
      // ========================================
      // IDENTIFICAR USUÁRIO E PLANO
      // ========================================
      
      // Tentar obter dados do external_reference (JSON com userId, plan, days, lifetime)
      let userId: string | null = null;
      let plan: string | null = null;
      let days: number | null = null;
      let lifetime: boolean = false;
      let couponId: string | null = null;
      let couponCode: string | null = null;
      let couponDiscount: number | null = null;
      let originalAmount: number | null = null;
      
      // Primeiro: tentar external_reference (prioridade)
      const externalRef = mpData.external_reference || mpData.reason || '';
      console.log(`[MP Webhook] external_reference: "${externalRef}"`);
      
      if (externalRef) {
        try {
          const refData = JSON.parse(externalRef);
          userId = refData.userId || refData.user_id || null;
          plan = refData.plan || refData.planType || null;
          days = refData.days || null;
          lifetime = refData.lifetime || false;
          // Extract coupon data if present
          couponId = refData.couponId || null;
          couponCode = refData.couponCode || null;
          couponDiscount = refData.couponDiscount || null;
          originalAmount = refData.originalAmount || null;
          console.log(`[MP Webhook] Parsed external_reference: userId=${userId}, plan=${plan}, days=${days}, lifetime=${lifetime}, couponCode=${couponCode}`);
        } catch (e) {
          // external_reference não é JSON, pode ser string simples (email ou ID)
          console.log(`[MP Webhook] external_reference não é JSON: "${externalRef}"`);
          // Tentar usar como userId diretamente se parecer um UUID ou email
          if (externalRef.includes('@') || externalRef.length > 20) {
            // Pode ser email, tentar buscar usuário
            const userByEmail = await storage.getUserByEmail(externalRef);
            if (userByEmail) {
              userId = userByEmail.id;
              console.log(`[MP Webhook] Encontrado usuário por email: ${userId}`);
            }
          }
        }
      }
      
      // Segundo: tentar metadata (pode ser objeto, string JSON, ou URL-encoded)
      // Procurar metadata em vários locais possíveis
      const possibleMetadatas = [
        mpData.metadata,
        mpData.preapproval_plan?.metadata,
        mpData.data?.metadata,
      ].filter(Boolean);
      
      for (const rawMetadata of possibleMetadatas) {
        if (userId) break; // Já encontrou usuário
        
        let metadataObj = rawMetadata;
        
        // Se metadata for string, tentar parsear
        if (typeof metadataObj === 'string') {
          const trimmed = metadataObj.trim();
          
          // Tentar JSON parse
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
              metadataObj = JSON.parse(trimmed);
              console.log(`[MP Webhook] Metadata era string JSON, parseado:`, JSON.stringify(metadataObj));
            } catch (e) {
              console.log(`[MP Webhook] Metadata string falhou JSON parse: "${trimmed.substring(0, 100)}"`);
              metadataObj = null;
            }
          } 
          // Tentar URL-encoded (ex: "userId=123&plan=premium")
          else if (trimmed.includes('=')) {
            try {
              const params = new URLSearchParams(trimmed);
              metadataObj = Object.fromEntries(params);
              console.log(`[MP Webhook] Metadata era URL-encoded, parseado:`, JSON.stringify(metadataObj));
            } catch (e) {
              console.log(`[MP Webhook] Metadata URL-encoded falhou: "${trimmed.substring(0, 100)}"`);
              metadataObj = null;
            }
          } else {
            metadataObj = null;
          }
        }
        
        if (metadataObj && typeof metadataObj === 'object') {
          userId = metadataObj.user_id || metadataObj.userId || null;
          plan = metadataObj.plan || metadataObj.planType || plan;
          console.log(`[MP Webhook] Metadata object: userId=${userId}, plan=${plan}`);
        }
      }
      
      // Terceiro: tentar payer email
      if (!userId && mpData.payer?.email) {
        const payerEmail = mpData.payer.email;
        console.log(`[MP Webhook] Tentando buscar usuário pelo email do pagador: ${payerEmail}`);
        const userByEmail = await storage.getUserByEmail(payerEmail);
        if (userByEmail) {
          userId = userByEmail.id;
          console.log(`[MP Webhook] ✓ Encontrado usuário pelo email do pagador: ${userId}`);
        }
      }
      
      if (!userId) {
        console.error(`[MP Webhook] ❌ Não foi possível identificar usuário! external_reference="${externalRef}", metadata=${JSON.stringify(mpData.metadata)}, payer=${JSON.stringify(mpData.payer)}`);
        return;
      }
      
      // Inferir plano pelo valor se não foi especificado
      // Para payments: transaction_amount
      // Para preapprovals: auto_recurring.transaction_amount (pode estar em vários níveis)
      const transactionAmount = mpData.transaction_amount || 
                               mpData.auto_recurring?.transaction_amount ||
                               mpData.data?.auto_recurring?.transaction_amount ||
                               mpData.preapproval_plan?.auto_recurring?.transaction_amount ||
                               null;
      
      if (!plan && transactionAmount) {
        const amount = parseFloat(transactionAmount);
        if (amount <= 10) plan = 'gold';
        else if (amount <= 25) plan = 'premium';
        else plan = 'strong_lifetime';
        console.log(`[MP Webhook] Plano inferido pelo valor R$${amount}: ${plan}`);
      }
      
      // Tentar também pelo 'reason' do preapproval (pode conter nome do plano)
      if (!plan && mpData.reason) {
        const reason = mpData.reason.toLowerCase();
        if (reason.includes('gold')) plan = 'gold';
        else if (reason.includes('premium')) plan = 'premium';
        else if (reason.includes('vitalicio') || reason.includes('lifetime')) plan = 'strong_lifetime';
        if (plan) {
          console.log(`[MP Webhook] Plano inferido pelo reason "${mpData.reason}": ${plan}`);
        }
      }
      
      if (!plan) {
        plan = 'premium'; // Default para premium se não conseguir identificar
        console.log(`[MP Webhook] ⚠️ Plano não identificado, usando default: ${plan}`);
      }
      
      // Inferir dias pelo plano se não especificado
      if (!days && !lifetime) {
        if (plan === 'strong_lifetime' || plan === 'vitalicio') {
          lifetime = true;
        } else {
          days = 30; // Default 30 dias
        }
      }
      
      // ========================================
      // ATIVAR PLANO DO USUÁRIO
      // ========================================
      
      // Calcular data de término
      let endDate: Date | null = null;
      if (!lifetime && days) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + days);
      }
      
      // Normalizar nome do plano
      const planType = plan === 'vitalicio' ? 'strong_lifetime' : plan;
      const amount = mpData.transaction_amount?.toString() || 
                     MP_PLAN_CONFIG[plan]?.price.toFixed(2) || 
                     MP_PLAN_CONFIG[planType]?.price.toFixed(2) || 
                     "0.00";
      
      console.log(`[MP Webhook] 🔄 Ativando plano: userId=${userId}, planType=${planType}, days=${days}, lifetime=${lifetime}, endDate=${endDate?.toISOString()}`);
      
      // ========================================
      // EXTRAIR VALORES FINANCEIROS DETALHADOS
      // ========================================
      
      // Valor bruto (transaction_amount) em centavos
      const grossAmountFloat = parseFloat(mpData.transaction_amount || mpData.auto_recurring?.transaction_amount || '0');
      const grossAmount = Math.round(grossAmountFloat * 100); // Converter para centavos
      
      // Taxas do Mercado Pago (fee_details)
      let feeAmount = 0;
      if (mpData.fee_details && Array.isArray(mpData.fee_details)) {
        for (const fee of mpData.fee_details) {
          feeAmount += Math.round(parseFloat(fee.amount || '0') * 100);
        }
      }
      
      // Impostos (taxes_amount se disponível)
      const taxAmount = Math.round(parseFloat(mpData.taxes_amount || '0') * 100);
      
      // Valor líquido (net_amount ou calculado)
      let netAmount = Math.round(parseFloat(mpData.net_amount || '0') * 100);
      if (!netAmount && grossAmount) {
        netAmount = grossAmount - feeAmount - taxAmount;
      }
      
      // Logging detalhado dos valores financeiros
      console.log(`[MP Webhook] ╔════════════════════════════════════════════════════════════╗`);
      console.log(`[MP Webhook] ║           DETALHES FINANCEIROS DO RECIBO                   ║`);
      console.log(`[MP Webhook] ╠════════════════════════════════════════════════════════════╣`);
      console.log(`[MP Webhook] ║ Valor Bruto:   R$ ${(grossAmount / 100).toFixed(2).padStart(10)}`);
      console.log(`[MP Webhook] ║ Taxas MP:      R$ ${(feeAmount / 100).toFixed(2).padStart(10)}`);
      console.log(`[MP Webhook] ║ Impostos:      R$ ${(taxAmount / 100).toFixed(2).padStart(10)}`);
      console.log(`[MP Webhook] ║ Valor Líquido: R$ ${(netAmount / 100).toFixed(2).padStart(10)}`);
      console.log(`[MP Webhook] ║ Origem:        ${isPreapproval ? 'Assinatura Recorrente' : 'Pagamento Único'}`);
      console.log(`[MP Webhook] ╚════════════════════════════════════════════════════════════╝`);
      
      // ========================================
      // VERIFICAÇÃO DE IDEMPOTÊNCIA FORTE
      // ========================================
      
      // Verificar se já existe subscription para este paymentId (evitar duplicidade absoluta)
      const existingSubscriptionByPayment = await storage.getSubscriptionByExternalId(dataId);
      if (existingSubscriptionByPayment) {
        console.log(`[MP Webhook] ⚠️ Subscription já existe para paymentId=${dataId}, ignorando duplicata`);
        console.log(`[MP Webhook] ⚠️ subscriptionId existente: ${existingSubscriptionByPayment.id}`);
        
        // Apenas atualizar recibo se existir
        const existingReceipt = await storage.getPaymentReceiptByExternalId(dataId);
        if (existingReceipt) {
          await storage.updatePaymentReceipt(existingReceipt.id, {
            status: status,
            statusDetail: mpData.status_detail || null,
            processedAt: new Date(),
          });
        }
        return; // PARAR AQUI - não criar nada novo
      }
      
      // Verificar se já existe recibo para este pagamento
      const existingReceipt = await storage.getPaymentReceiptByExternalId(dataId);
      if (existingReceipt) {
        console.log(`[MP Webhook] ⚠️ Recibo já existe para paymentId=${dataId}, atualizando...`);
        await storage.updatePaymentReceipt(existingReceipt.id, {
          status: status,
          statusDetail: mpData.status_detail || null,
          processedAt: new Date(),
        });
      }
      
      // Usar função existente para criar/atualizar assinatura
      const subscription = await storage.upsertSubscription({
        userId,
        planType,
        status: 'active',
        startDate: new Date(),
        endDate,
        amount,
        storeTransactionId: dataId, // Salvar paymentId para idempotência futura
      });
      
      console.log(`[MP Webhook] ✅ ASSINATURA ATIVADA!`);
      console.log(`[MP Webhook] ✅ subscriptionId=${subscription.id}`);
      console.log(`[MP Webhook] ✅ userId=${userId}`);
      console.log(`[MP Webhook] ✅ planType=${planType}`);
      console.log(`[MP Webhook] ✅ endDate=${subscription.endDate}`);
      
      // ========================================
      // REGISTRAR RESGATE DE CUPOM (SE APLICÁVEL)
      // ========================================
      
      if (couponId && couponCode && couponDiscount && originalAmount && userId) {
        try {
          // Check if already redeemed (idempotency)
          const existingRedemption = await db
            .select()
            .from(couponRedemptions)
            .where(and(
              eq(couponRedemptions.couponId, couponId),
              eq(couponRedemptions.userId, userId),
              eq(couponRedemptions.subscriptionId, subscription.id)
            ))
            .limit(1);
          
          if (existingRedemption.length === 0) {
            await db.insert(couponRedemptions).values({
              couponId,
              userId,
              planId: planType,
              subscriptionId: subscription.id,
              amountBefore: originalAmount,
              discountAmount: couponDiscount,
              amountAfter: originalAmount - couponDiscount,
            });
            
            console.log(`[MP Webhook] 🎫 Cupom ${couponCode} registrado: -R$${(couponDiscount / 100).toFixed(2)}`);
          } else {
            console.log(`[MP Webhook] 🎫 Cupom ${couponCode} já foi registrado para esta subscription`);
          }
        } catch (couponError) {
          console.error(`[MP Webhook] ⚠️ Erro ao registrar cupom ${couponCode}:`, couponError);
          // Don't fail the webhook, just log the error
        }
      }
      
      // ========================================
      // CRIAR RECIBO DE PAGAMENTO DETALHADO
      // ========================================
      
      if (!existingReceipt) {
        const payerEmail = mpData.payer?.email || null;
        
        // Validação do recibo
        const validationErrors: string[] = [];
        if (!userId) validationErrors.push('userId não identificado');
        if (!grossAmount) validationErrors.push('grossAmount zerado');
        if (!planType) validationErrors.push('planType não identificado');
        
        const paymentReceipt = await storage.createPaymentReceipt({
          externalPaymentId: dataId,
          paymentProvider: 'mercadopago',
          paymentType: isPreapproval ? 'preapproval' : 'payment',
          userId: userId || null,
          userEmail: payerEmail,
          planType: planType,
          subscriptionDays: lifetime ? null : (days || 30),
          isLifetime: lifetime,
          grossAmount,
          feeAmount,
          taxAmount,
          netAmount,
          currency: mpData.currency_id || 'BRL',
          status: status,
          statusDetail: mpData.status_detail || null,
          origin: 'webhook',
          ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || null,
          userAgent: req.headers['user-agent'] || null,
          deviceId: null,
          providerRawData: mpData,
          isValidated: validationErrors.length === 0,
          validationErrors: validationErrors.length > 0 ? validationErrors : null,
          validatedAt: validationErrors.length === 0 ? new Date() : null,
          subscriptionId: subscription.id,
          activatedAt: new Date(),
          paymentDate: new Date(mpData.date_created || mpData.date_approved || new Date()),
          processedAt: new Date(),
        });
        
        console.log(`[MP Webhook] ✅ RECIBO CRIADO: receiptId=${paymentReceipt.id}`);
        console.log(`[MP Webhook] ✅ isValidated=${paymentReceipt.isValidated}`);
        if (validationErrors.length > 0) {
          console.log(`[MP Webhook] ⚠️ Erros de validação: ${validationErrors.join(', ')}`);
        }
      }
      
      // Rastrear evento de conversão para métricas admin
      await storage.trackPageEvent(userId, 'SUBSCRIPTION_ACTIVATED', { 
        planType, 
        paymentId: dataId,
        amount,
        source: 'mp_webhook',
        grossAmount,
        netAmount,
        feeAmount,
      });
      console.log(`[MP Webhook] ✅ Evento SUBSCRIPTION_ACTIVATED rastreado`);
      
      // Verificação final
      const verify = await storage.hasActiveSubscription(userId, planType);
      console.log(`[MP Webhook] ✅ VERIFICAÇÃO FINAL: hasActiveSubscription(${userId}, ${planType}) = ${verify}`);
      console.log(`[MP Webhook] ╔════════════════════════════════════════════════════════════╗`);
      console.log(`[MP Webhook] ║     PROCESSAMENTO CONCLUÍDO COM SUCESSO!                  ║`);
      console.log(`[MP Webhook] ╚════════════════════════════════════════════════════════════╝`);
      
      // Armazenar resultado de sucesso
      if (lastWebhookData) {
        lastWebhookData.processedResult = { 
          success: true, 
          userId, 
          plan: planType,
          receiptCreated: !existingReceipt,
          grossAmount,
          netAmount,
        };
      }
      
    } catch (error) {
      console.error("[MP Webhook] ❌ ERRO ao processar webhook:", error);
      // Armazenar resultado de erro
      if (lastWebhookData) {
        lastWebhookData.processedResult = { 
          success: false, 
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  });

  // ===================================
  // DEBUG ENDPOINTS (Obrigatórios para validação)
  // ===================================

  // Build info endpoint - para validar versão em produção

}
