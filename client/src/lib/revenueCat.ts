// RevenueCat Billing Service
// Gerencia compras via Apple In-App Purchase e Google Play Billing

export interface Offering {
  id: string;
  products: Product[];
}

export interface Product {
  id: string;
  price: string;
  currency: string;
  title: string;
  description: string;
}

export interface CustomerInfo {
  activeSubscriptions: string[];
  allExpirationDates: Record<string, string | null>;
  entitlements: {
    active: Record<string, any>;
  };
}

class RevenueCatService {
  private apiKey: string = import.meta.env.VITE_REVENUECAT_API_KEY || '';
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    // Em produção, aqui você carregaria o SDK do RevenueCat
    // Para MVP, simulamos com localStorage
    this.initialized = true;
    console.log('RevenueCat initialized');
  }

  async getOfferings(): Promise<Offering[]> {
    // Mock offerings para demonstração
    return [
      {
        id: 'default',
        products: [
          {
            id: 'gold_monthly',
            price: 'R$ 9,90',
            currency: 'BRL',
            title: 'Gold',
            description: 'IA Essencial + Strong + Hebraico/Grego',
          },
          {
            id: 'premium_monthly',
            price: 'R$ 19,90',
            currency: 'BRL',
            title: 'Premium',
            description: 'IA Premium + Strong + Hebraico/Grego',
          },
          {
            id: 'strong_lifetime',
            price: 'Em breve',
            currency: 'BRL',
            title: 'Strong Vitalício',
            description: 'Strong + Hebraico/Grego para sempre',
          },
        ],
      },
    ];
  }

  async purchase(productId: string): Promise<boolean> {
    try {
      // Em produção, isso chamaria o SDK do RevenueCat
      // Para MVP, simulamos com localStorage
      const purchases = JSON.parse(localStorage.getItem('rc_purchases') || '[]');
      purchases.push({
        id: productId,
        timestamp: Date.now(),
        expiresAt: productId === 'strong_lifetime' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      localStorage.setItem('rc_purchases', JSON.stringify(purchases));
      
      console.log(`Purchase initiated for ${productId}`);
      return true;
    } catch (error) {
      console.error('Purchase failed:', error);
      return false;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    // Mock customer info
    const purchases = JSON.parse(localStorage.getItem('rc_purchases') || '[]');
    const activeSubscriptions = purchases
      .filter((p: any) => !p.expiresAt || new Date(p.expiresAt) > new Date())
      .map((p: any) => p.id);

    return {
      activeSubscriptions,
      allExpirationDates: {},
      entitlements: {
        active: {},
      },
    };
  }

  async restorePurchases(): Promise<CustomerInfo> {
    // Em produção, isso restauraria compras do RevenueCat
    return this.getCustomerInfo();
  }
}

export const revenueCat = new RevenueCatService();
