import { getDeviceId } from '@/hooks/use-device-id';
import { getApiUrl } from '@/lib/queryClient';

// Get auth token to include in tracking requests for user identification
function getAuthToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

export async function trackEvent(eventType: string, eventData?: any) {
  try {
    // Safety check for SSR/build environment
    if (typeof window === 'undefined') return;
    
    const deviceId = getDeviceId();
    const token = getAuthToken();
    
    // Build headers - include auth token if available for user identification
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Use public endpoint that works for both guests and authenticated users
    await fetch(getApiUrl('/api/events/track'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        deviceId, 
        eventType, 
        eventData,
      }),
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
