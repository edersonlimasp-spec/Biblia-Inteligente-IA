import { storage } from "../storage";
import { isTrialActive, type AuthRequest } from "../auth";
import { getClientPlatform, getPlatformAllowedSources } from "../routes/shared";

export async function hasAtlasFullAccess(req: AuthRequest): Promise<boolean> {
  if (!req.userId) return false;
  const sources = getPlatformAllowedSources(getClientPlatform(req));
  const [user, gold, premium] = await Promise.all([
    storage.getUser(req.userId),
    storage.hasActiveSubscription(req.userId, "gold", sources),
    storage.hasActiveSubscription(req.userId, "premium", sources),
  ]);
  if (!user) return false;
  return user.role === "admin" || user.role === "super_admin" || gold || premium || isTrialActive(user.trialStartDate);
}