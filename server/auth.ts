import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { type Request, type Response, type NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { storage } from './storage';
import type { User } from '@shared/schema';

function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'CRÍTICO: A variável de ambiente SESSION_SECRET não está definida. ' +
      'O servidor não pode iniciar sem um JWT secret seguro. ' +
      'Configure SESSION_SECRET nos secrets do ambiente.'
    );
  }
  return secret;
}
const JWT_SECRET: string = requireSessionSecret();
// Trial de degustação Premium: 7 dias para novos cadastros
const TRIAL_DURATION_DAYS = 7;

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  dbUser?: User;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(userId: string, email: string, role: string = 'user'): string {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; email: string; role?: string } | null {
  const result = verifyLegacyToken(token);
  return result.ok ? result.payload : null;
}

function claimString(claims: unknown, key: string): string | undefined {
  if (!claims || typeof claims !== 'object') return undefined;
  const value = (claims as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function attachDbUser(
  req: AuthRequest,
  email: string,
  createIfMissing: boolean,
): Promise<boolean> {
  let dbUser = await storage.getUserByEmail(email);

  if (!dbUser && createIfMissing) {
    try {
      dbUser = await storage.createUser({
        email,
      });
    } catch {
      // A concurrent first request may have created the email row.
      dbUser = await storage.getUserByEmail(email);
    }
  }

  if (!dbUser) return false;
  req.dbUser = dbUser;
  req.userId = dbUser.id;
  req.userEmail = dbUser.email ?? email;
  req.userRole = dbUser.role;
  return true;
}

type LegacyTokenPayload = { userId: string; email: string; role?: string };
type AuthResolution =
  | { ok: true; source: 'clerk' | 'legacy_jwt' }
  | { ok: false; reasons: string[] };

function verifyLegacyToken(token: string):
  | { ok: true; payload: LegacyTokenPayload }
  | { ok: false; reason: string } {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as LegacyTokenPayload;
    return { ok: true, payload };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : '';
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorName === 'TokenExpiredError') {
      return { ok: false, reason: 'legacy_jwt_expired' };
    }
    if (errorMessage === 'invalid signature') {
      return { ok: false, reason: 'legacy_jwt_invalid_signature' };
    }
    if (errorName === 'NotBeforeError') {
      return { ok: false, reason: 'legacy_jwt_not_active' };
    }
    return { ok: false, reason: 'legacy_jwt_invalid' };
  }
}

async function resolveAuthentication(req: AuthRequest): Promise<AuthResolution> {
  const reasons: string[] = [];

  // Web sessions are first-class and are validated by clerkMiddleware.
  const clerkAuth = getAuth(req);
  const claims = clerkAuth.sessionClaims;
  const email = claimString(claims, 'email');
  if (clerkAuth.userId && email) {
    if (await attachDbUser(req, email, true)) {
      return { ok: true, source: 'clerk' };
    }
    reasons.push('clerk_user_link_failed');
  } else if (clerkAuth.userId) {
    reasons.push('clerk_email_missing');
  } else {
    reasons.push('clerk_session_missing');
  }

  return resolveLegacyBearer(req, reasons);
}

async function resolveLegacyBearer(
  req: AuthRequest,
  reasons: string[] = [],
): Promise<AuthResolution> {
  // A valid server-signed legacy JWT is sufficient authentication on its own.
  // Platform headers remain useful for policy decisions, but never gate JWT
  // signature/expiry validation.
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    reasons.push('authorization_header_missing');
    return { ok: false, reasons };
  }
  if (!authHeader.startsWith('Bearer ')) {
    reasons.push('authorization_header_malformed');
    return { ok: false, reasons };
  }

  const verification = verifyLegacyToken(authHeader.substring(7));
  if (!verification.ok) {
    reasons.push(verification.reason);
    return { ok: false, reasons };
  }
  if (!verification.payload.email?.trim()) {
    reasons.push('legacy_jwt_email_missing');
    return { ok: false, reasons };
  }
  if (!await attachDbUser(req, verification.payload.email, false)) {
    reasons.push('legacy_jwt_user_not_found');
    return { ok: false, reasons };
  }
  return { ok: true, source: 'legacy_jwt' };
}

function logAuthRejection(req: AuthRequest, reasons: string[]): void {
  console.warn(
    `[Auth] Rejected ${req.method} ${req.path}: ${reasons.join(', ')}`,
  );
}

function logAuthException(req: AuthRequest, error: unknown): void {
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  console.warn(`[Auth] Rejected ${req.method} ${req.path}: authentication_exception (${errorName})`);
}

// Optional authentication populates the local app user when a valid Clerk
// cookie or native legacy JWT is present, without rejecting guests.
export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    await resolveAuthentication(req);
    next();
  } catch {
    next();
  }
}

export async function ensureAuthenticated(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const resolution = await resolveAuthentication(req);
    if (!resolution.ok) {
      logAuthRejection(req, resolution.reasons);
      return res.status(401).json({ error: 'Unauthorized', requiresLogin: true });
    }
    next();
  } catch (error) {
    logAuthException(req, error);
    return res.status(401).json({ error: 'Unauthorized', requiresLogin: true });
  }
}

export async function ensureAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const resolution = await resolveAuthentication(req);
    if (!resolution.ok) {
      logAuthRejection(req, resolution.reasons);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.dbUser?.role !== 'admin' && req.dbUser?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  } catch (error) {
    logAuthException(req, error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export async function ensureSuperAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const resolution = await resolveAuthentication(req);
    if (!resolution.ok) {
      logAuthRejection(req, resolution.reasons);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.dbUser?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Super admin access required' });
    }
    next();
  } catch (error) {
    logAuthException(req, error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Check if trial is still active (within 7 days - degustação Premium)
export function isTrialActive(trialStartDate: Date | null | undefined): boolean {
  if (!trialStartDate) return false;
  const now = new Date();
  const trialEnd = new Date(trialStartDate);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);
  return now < trialEnd;
}

// Get days remaining in trial
export function getTrialDaysRemaining(trialStartDate: Date | null | undefined): number {
  if (!trialStartDate) return 0;
  const now = new Date();
  const trialEnd = new Date(trialStartDate);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
