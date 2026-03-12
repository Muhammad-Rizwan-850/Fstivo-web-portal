/**
 * Affiliate Program Type Definitions
 * Re-exports types from monetization library for backwards compatibility
 */

// Re-export from monetization/affiliate modules
export type {
  AffiliateClick,
  ReferralLink as AffiliateReferralLink,
} from '@/lib/monetization/affiliate/tracking';

export type {
  Commission as AffiliateCommission,
  CommissionTier,
} from '@/lib/monetization/affiliate/commission';

export type {
  Payout as AffiliatePayout,
  PayoutRequest,
} from '@/lib/monetization/affiliate/payouts';

// Additional types needed by queries
export interface AffiliateAccount {
  id: string;
  userId: string;
  affiliateCode: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalEarnings: number;
  availableBalance: number;
  totalClicks: number;
  totalConversions: number;
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateMarketingMaterial {
  id: string;
  type: 'banner' | 'social_media' | 'email' | 'text';
  title: string;
  description?: string;
  imageUrl?: string;
  content: any;
  trackingCode: string;
  active: boolean;
  createdAt: string;
}

export interface AffiliateProgramConfig {
  id: string;
  baseCommissionRate: number;
  cookieDurationDays: number;
  minPayoutAmount: number;
  isActive: boolean;
  tierRules: any;
  createdAt: string;
  updatedAt: string;
}
