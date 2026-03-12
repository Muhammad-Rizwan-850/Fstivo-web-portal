// =====================================================
// AD BUDGET MANAGEMENT
// =====================================================

import { createServerClient } from '@/lib/supabase/secure-client';
import { logger } from '@/lib/logger';

export interface BudgetInfo {
  adId: string;
  budgetType: 'daily' | 'total';
  totalBudget: number;
  dailyBudget?: number;
  spent: number;
  remaining: number;
  dailySpent?: number;
  dailyRemaining?: number;
  percentageUsed: number;
  isExhausted: boolean;
  projectedExhaustionDate?: string;
}

export interface BudgetAlert {
  adId: string;
  type: 'warning' | 'critical' | 'exhausted';
  message: string;
  percentageUsed: number;
  spent: number;
  budget: number;
  recommendedAction?: string;
}

/**
 * Get budget information for an ad
 */
export async function getAdBudget(adId: string): Promise<BudgetInfo | null> {
  try {
    const supabase = await createServerClient();

    const { data: ad, error } = await supabase
      .from('banner_ads')
      .select('*')
      .eq('id', adId)
      .single();

    if (error || !ad) {
      return null;
    }

    const spent = ad.spent || 0;
    const totalBudget = ad.budget_amount;
    const dailyBudget = ad.daily_budget;
    const remaining = totalBudget - spent;
    const percentageUsed = (spent / totalBudget) * 100;
    const isExhausted = remaining <= 0;

    let dailySpent = 0;
    let dailyRemaining = 0;

    if (dailyBudget) {
      dailySpent = await getDailySpend(adId);
      dailyRemaining = dailyBudget - dailySpent;
    }

    // Project exhaustion date
    let projectedExhaustionDate: string | undefined;
    if (dailyBudget && remaining > 0) {
      const daysRemaining = Math.floor(remaining / dailyBudget);
      const exhaustionDate = new Date();
      exhaustionDate.setDate(exhaustionDate.getDate() + daysRemaining);
      projectedExhaustionDate = exhaustionDate.toISOString();
    }

    return {
      adId,
      budgetType: ad.budget_type,
      totalBudget,
      dailyBudget,
      spent,
      remaining,
      dailySpent,
      dailyRemaining,
      percentageUsed,
      isExhausted,
      projectedExhaustionDate,
    };
  } catch (error) {
    logger.error('Error getting ad budget:', error);
    return null;
  }
}

/**
 * Get daily spend for an ad
 */
async function getDailySpend(adId: string): Promise<number> {
  try {
    const supabase = await createServerClient();

    const today = new Date().toISOString().split('T')[0];

    // This is a simplified calculation
    // In production, you'd track actual spend per impression/click
    const { data: events } = await supabase
      .from('ad_tracking')
      .select('*')
      .eq('ad_id', adId)
      .gte('created_at', today)
      .lte('created_at', today + 'T23:59:59');

    // Simplified: assume each impression costs PKR 0.10
    const impressions = events?.filter((e: any) => e.event_type === 'impression').length || 0;
    return impressions * 0.1;
  } catch (error) {
    logger.error('Error getting daily spend:', error);
    return 0;
  }
}

/**
 * Update ad spend
 */
export async function updateAdSpend(
  adId: string,
  amount: number
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('banner_ads')
      .update({
        spent: (supabase as any).raw('spent + ' + amount),
      })
      .eq('id', adId);

    if (error) {
      logger.error('Error updating ad spend:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error updating ad spend:', error);
    return false;
  }
}

/**
 * Check if ad has budget
 */
export async function hasBudget(adId: string): Promise<boolean> {
  try {
    const budget = await getAdBudget(adId);

    if (!budget) {
      return false;
    }

    // Check total budget
    if (budget.remaining <= 0) {
      return false;
    }

    // Check daily budget if set
    if (budget.dailyBudget && budget.dailyRemaining !== undefined && budget.dailyRemaining <= 0) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error checking budget:', error);
    return false;
  }
}

/**
 * Get budget alerts for an ad
 */
export async function getBudgetAlerts(adId: string): Promise<BudgetAlert[]> {
  try {
    const budget = await getAdBudget(adId);

    if (!budget) {
      return [];
    }

    const alerts: BudgetAlert[] = [];

    if (budget.isExhausted) {
      alerts.push({
        adId,
        type: 'exhausted',
        message: 'Budget has been exhausted. Ad has been paused.',
        percentageUsed: 100,
        spent: budget.spent,
        budget: budget.totalBudget,
        recommendedAction: 'Increase budget or pause the ad',
      });
    } else if (budget.percentageUsed >= 90) {
      alerts.push({
        adId,
        type: 'critical',
        message: `Budget is ${budget.percentageUsed.toFixed(0)}% exhausted.`,
        percentageUsed: budget.percentageUsed,
        spent: budget.spent,
        budget: budget.totalBudget,
        recommendedAction: 'Consider increasing budget soon',
      });
    } else if (budget.percentageUsed >= 75) {
      alerts.push({
        adId,
        type: 'warning',
        message: `Budget is ${budget.percentageUsed.toFixed(0)}% exhausted.`,
        percentageUsed: budget.percentageUsed,
        spent: budget.spent,
        budget: budget.totalBudget,
        recommendedAction: 'Monitor performance and budget usage',
      });
    }

    // Daily budget alerts
    if (budget.dailyBudget && budget.dailyRemaining !== undefined) {
      if (budget.dailyRemaining <= 0) {
        alerts.push({
          adId,
          type: 'critical',
          message: 'Daily budget has been exhausted.',
          percentageUsed: 100,
          spent: budget.dailySpent || 0,
          budget: budget.dailyBudget,
          recommendedAction: 'Ad will resume tomorrow with daily budget reset',
        });
      } else if (budget.dailyRemaining / budget.dailyBudget <= 0.2) {
        alerts.push({
          adId,
          type: 'warning',
          message: `Daily budget is ${((1 - budget.dailyRemaining / budget.dailyBudget) * 100).toFixed(0)}% used.`,
          percentageUsed: (1 - budget.dailyRemaining / budget.dailyBudget) * 100,
          spent: budget.dailySpent || 0,
          budget: budget.dailyBudget,
        });
      }
    }

    return alerts;
  } catch (error) {
    logger.error('Error getting budget alerts:', error);
    return [];
  }
}

/**
 * Get all budget alerts for user
 */
export async function getAllBudgetAlerts(userId: string): Promise<BudgetAlert[]> {
  try {
    const supabase = await createServerClient();

    const { data: ads, error } = await supabase
      .from('banner_ads')
      .select('id')
      .eq('advertiser_id', userId)
      .eq('status', 'active');

    if (error) {
      return [];
    }

    const alerts: BudgetAlert[] = [];

    for (const ad of ads || []) {
      const adAlerts = await getBudgetAlerts(ad.id);
      alerts.push(...adAlerts);
    }

    return alerts;
  } catch (error) {
    logger.error('Error getting all budget alerts:', error);
    return [];
  }
}

/**
 * Pause ads with exhausted budget
 */
export async function pauseExhaustedAds(): Promise<number> {
  try {
    const supabase = await createServerClient();

    // Get all active ads
    const { data: ads, error } = await supabase
      .from('banner_ads')
      .select('id, spent, budget_amount, daily_budget')
      .eq('status', 'active');

    if (error) {
      return 0;
    }

    let pausedCount = 0;

    for (const ad of ads || []) {
      const spent = ad.spent || 0;
      const remaining = ad.budget_amount - spent;

      // Check if total budget exhausted
      if (remaining <= 0) {
        await pauseAd(ad.id);
        pausedCount++;
        continue;
      }

      // Check daily budget
      if (ad.daily_budget) {
        const dailySpent = await getDailySpend(ad.id);
        if (dailySpent >= ad.daily_budget) {
          // Don't pause, just let it resume tomorrow
          // Could add a flag to track daily budget exhaustion
        }
      }
    }

    return pausedCount;
  } catch (error) {
    logger.error('Error pausing exhausted ads:', error);
    return 0;
  }
}

async function pauseAd(adId: string): Promise<void> {
  const supabase = await createServerClient();
  await supabase.from('banner_ads').update({ status: 'paused' }).eq('id', adId);
}

/**
 * Get budget forecast
 */
export async function getBudgetForecast(
  adId: string,
  days: number = 30
): Promise<Array<{ date: string; projectedSpend: number; cumulativeSpend: number }>> {
  try {
    const budget = await getAdBudget(adId);

    if (!budget) {
      return [];
    }

    const forecast: Array<{ date: string; projectedSpend: number; cumulativeSpend: number }> = [];

    // Calculate average daily spend from recent data
    const dailySpend = await getAverageDailySpend(adId, 7); // Last 7 days

    let cumulativeSpend = budget.spent;
    const currentDate = new Date();

    for (let i = 0; i < days; i++) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dateStr = currentDate.toISOString().split('T')[0];

      const projectedDailySpend = budget.budgetType === 'daily'
        ? Math.min(dailySpend, budget.dailyBudget || dailySpend)
        : dailySpend;

      cumulativeSpend += projectedDailySpend;

      forecast.push({
        date: dateStr,
        projectedSpend: projectedDailySpend,
        cumulativeSpend,
      });

      // Stop if budget will be exhausted
      if (cumulativeSpend >= budget.totalBudget) {
        break;
      }
    }

    return forecast;
  } catch (error) {
    logger.error('Error getting budget forecast:', error);
    return [];
  }
}

/**
 * Get average daily spend
 */
async function getAverageDailySpend(adId: string, days: number = 7): Promise<number> {
  try {
    const supabase = await createServerClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: events } = await supabase
      .from('ad_tracking')
      .select('created_at')
      .eq('ad_id', adId)
      .gte('created_at', startDate.toISOString());

    // Group by day and calculate average
    const dailyImpressions: Record<string, number> = {};

    for (const event of events || []) {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      dailyImpressions[date] = (dailyImpressions[date] || 0) + 1;
    }

    const dailySpends = Object.values(dailyImpressions).map((count) => count * 0.1); // PKR 0.10 per impression

    return dailySpends.length > 0
      ? dailySpends.reduce((sum, spend) => sum + spend, 0) / dailySpends.length
      : 0;
  } catch (error) {
    logger.error('Error getting average daily spend:', error);
    return 0;
  }
}

/**
 * Recommend budget allocation
 */
export async function recommendBudget(adId: string): Promise<{
  currentDailyBudget?: number;
  recommendedDailyBudget?: number;
  currentTotalBudget: number;
  recommendedTotalBudget?: number;
  reason: string;
}> {
  try {
    const budget = await getAdBudget(adId);
    const performance = await import('./tracking').then((m) => m.getAdPerformance(adId));

    if (!budget) {
      throw new Error('Budget not found');
    }

    const recommendations: any = {
      currentTotalBudget: budget.totalBudget,
    };

    if (performance && performance.ctr > 2 && performance.conversionRate > 5) {
      // High performing ad, recommend increasing budget
      const recommendedDaily = budget.dailyBudget
        ? budget.dailyBudget * 1.5
        : 10000;

      recommendations.currentDailyBudget = budget.dailyBudget;
      recommendations.recommendedDailyBudget = recommendedDaily;
      recommendations.recommendedTotalBudget = budget.totalBudget * 1.5;
      recommendations.reason = 'Ad is performing well (CTR: ' + performance.ctr.toFixed(1) + '%). Consider increasing budget to maximize results.';
    } else if (performance && performance.ctr < 0.5) {
      // Low performing ad, recommend decreasing or pausing
      recommendations.recommendedTotalBudget = budget.totalBudget * 0.5;
      recommendations.reason = 'Ad has low CTR (' + performance.ctr.toFixed(1) + '%). Consider optimizing creatives or reducing budget.';
    } else {
      recommendations.reason = 'Ad performance is average. Monitor and adjust based on results.';
    }

    return recommendations;
  } catch (error) {
    logger.error('Error recommending budget:', error);
    return {
      currentTotalBudget: 0,
      reason: 'Unable to generate recommendation',
    };
  }
}
