import { apiRequest } from './queryClient';

export async function trackEvent(eventType: string, eventData?: any) {
  try {
    await fetch('/api/admin/events/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, eventData }),
    }).catch(() => {}); // Silently fail - don't interrupt user experience
  } catch {}
}

export async function createSession() {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await trackEvent('SESSION_CREATE', { sessionId });
  return sessionId;
}

export async function trackAIQuestion(mode: string) {
  await trackEvent('AI_QUESTION', { mode });
}

export async function trackSubscriptionPageVisit() {
  await trackEvent('SUBSCRIPTION_PAGE_VISIT');
}

export async function trackSubscriptionAbandonment() {
  await trackEvent('SUBSCRIPTION_ABANDONED');
}
