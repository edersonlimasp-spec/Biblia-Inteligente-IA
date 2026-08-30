export const APPLE_PRODUCT_MAP: Record<string, {
  planType: string;
  durationDays: number | null;
  amount: string;
}> = {
  'com.bibliainteligente.gold.monthly': { planType: 'gold', durationDays: 30, amount: '9.90' },
  'com.bibliainteligente.gold.yearly': { planType: 'gold_anual', durationDays: 365, amount: '79.90' },
  'com.bibliainteligente.premium.monthly': { planType: 'premium', durationDays: 30, amount: '19.90' },
  'com.bibliainteligente.premium.yearly': { planType: 'premium_anual', durationDays: 365, amount: '129.90' },
  'com.bibliainteligente.strong.lifetime': { planType: 'strong_lifetime', durationDays: null, amount: '49.90' },
};