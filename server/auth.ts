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
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role?: string };
  } catch {
    return null;
  }
}

function isNativeClient(req: Request): boolean {
  const platform = req.headers['x-client-platform'];
  const value = Array.isArray(platform) ? platform[0] : platform;
  return value === 'android' || value === 'ios';
}

function claimString(claims: unknown, key: string): string | undefined {
  if (!claims || typeof claims !== 'object') return undefined;
  const value = (claims as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function attachDbUser(req: AuthRequest, email: string): Promise<boolean> {
  let dbUser = await storage.getUserByEmail(email);

  if (!dbUser) {
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

async function resolveAuthentication(req: AuthRequest): Promise<boolean> {
  // Web sessions are first-class and are validated by clerkMiddleware.
  const clerkAuth = getAuth(req);
  const claims = clerkAuth.sessionClaims;
  const email = claimString(claims, 'email');
  if (clerkAuth.userId && email) {
    return attachDbUser(req, email);
  }

  // The legacy JWT transport is intentionally limited to Capacitor clients.
  if (!isNativeClient(req)) return false;
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return false;
  const payload = verifyToken(authHeader.substring(7));
  if (!payload?.email) return false;
  return attachDbUser(req, payload.email);
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
    if (!await resolveAuthentication(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export async function ensureAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!await resolveAuthentication(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.dbUser?.role !== 'admin' && req.dbUser?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export async function ensureSuperAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!await resolveAuthentication(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.dbUser?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Super admin access required' });
    }
    next();
  } catch {
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
