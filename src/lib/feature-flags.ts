import { createClient } from '@/lib/supabase/server';
import React from 'react';
import { logger } from '@/lib/logger';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout_percentage?: number;
  user_groups?: string[];
  environment: 'development' | 'staging' | 'production';
  created_at: string;
  updated_at: string;
}

export interface FeatureFlagRule {
  flag_id: string;
  user_id?: string;
  user_group?: string;
  enabled: boolean;
  conditions?: Record<string, any>;
}

class FeatureFlagsManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private rules: Map<string, FeatureFlagRule[]> = new Map();

  constructor() {
    this.initializeFlags();
  }

  private initializeFlags() {
    // Initialize with environment variables and database flags
    const envFlags = this.getEnvironmentFlags();
    envFlags.forEach(flag => this.flags.set(flag.id, flag));
  }

  private getEnvironmentFlags(): FeatureFlag[] {
    const flags: FeatureFlag[] = [];

    // Parse environment variables for feature flags
    const envVars = process.env;
    Object.keys(envVars).forEach(key => {
      if (key.startsWith('FEATURE_')) {
        const flagName = key.replace('FEATURE_', '').toLowerCase();
        const enabled = envVars[key] === 'true' || envVars[key] === '1';

        flags.push({
          id: flagName,
          name: flagName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: `Feature flag for ${flagName}`,
          enabled,
          environment: (process.env.NODE_ENV as any) || 'development',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    });

    return flags;
  }

  async loadFromDatabase(): Promise<void> {
    try {
      const supabase = createClient();

      // Load feature flags from database
      const { data: flags, error: flagsError } = await supabase
        .from('feature_flags')
        .select('*');

      if (flagsError) {
        logger.error('Error loading feature flags from database:', flagsError);
        return;
      }

      // Load feature flag rules
      const { data: rules, error: rulesError } = await supabase
        .from('feature_flag_rules')
        .select('*');

      if (rulesError) {
        logger.error('Error loading feature flag rules from database:', rulesError);
        return;
      }

      // Update in-memory cache
      flags?.forEach((flag: any) => this.flags.set(flag.id, flag));
      rules?.forEach((rule: any) => {
        if (!this.rules.has(rule.flag_id)) {
          this.rules.set(rule.flag_id, []);
        }
        this.rules.get(rule.flag_id)!.push(rule);
      });
    } catch (error) {
      logger.error('Error loading feature flags:', error);
    }
  }

  async isEnabled(flagId: string, userId?: string, context?: Record<string, any>): Promise<boolean> {
    const flag = this.flags.get(flagId);

    if (!flag) {
      return false;
    }

    // Check if globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check user-specific rules
    if (userId) {
      const userRules = this.rules.get(flagId)?.filter(rule =>
        rule.user_id === userId || this.matchesUserGroup(rule, userId)
      );

      if (userRules && userRules.length > 0) {
        // Check if any rule explicitly enables for this user
        const enabledRule = userRules.find(rule => rule.enabled);
        if (enabledRule) {
          return this.evaluateConditions(enabledRule.conditions, context);
        }

        // Check if any rule explicitly disables for this user
        const disabledRule = userRules.find(rule => !rule.enabled);
        if (disabledRule) {
          return false;
        }
      }
    }

    // Check rollout percentage
    if (flag.rollout_percentage !== undefined && flag.rollout_percentage < 100) {
      const hash = this.simpleHash(userId || 'anonymous');
      const percentage = (hash % 100) + 1;
      return percentage <= flag.rollout_percentage;
    }

    return true;
  }

  private matchesUserGroup(rule: FeatureFlagRule, userId: string): boolean {
    if (!rule.user_group) return false;

    // This would typically check against user groups/roles
    // For now, we'll do a simple check
    return rule.user_group === 'admin' || rule.user_group === 'beta';
  }

  private evaluateConditions(conditions: Record<string, any> | undefined, context: Record<string, any> = {}): boolean {
    if (!conditions) return true;

    // Simple condition evaluation
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }

    return true;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async createFlag(flag: Omit<FeatureFlag, 'id' | 'created_at' | 'updated_at'>): Promise<FeatureFlag | null> {
    try {
      const supabase = createClient();
      const newFlag = {
        ...flag,
        id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('feature_flags')
        .insert(newFlag)
        .select()
        .single();

      if (error) {
        logger.error('Error creating feature flag:', error);
        return null;
      }

      this.flags.set(data.id, data);
      return data;
    } catch (error) {
      logger.error('Error creating feature flag:', error);
      return null;
    }
  }

  async updateFlag(flagId: string, updates: Partial<FeatureFlag>): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('feature_flags')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', flagId);

      if (error) {
        logger.error('Error updating feature flag:', error);
        return false;
      }

      const existingFlag = this.flags.get(flagId);
      if (existingFlag) {
        this.flags.set(flagId, { ...existingFlag, ...updates });
      }

      return true;
    } catch (error) {
      logger.error('Error updating feature flag:', error);
      return false;
    }
  }

  async deleteFlag(flagId: string): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', flagId);

      if (error) {
        logger.error('Error deleting feature flag:', error);
        return false;
      }

      this.flags.delete(flagId);
      this.rules.delete(flagId);
      return true;
    } catch (error) {
      logger.error('Error deleting feature flag:', error);
      return false;
    }
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getFlag(flagId: string): FeatureFlag | undefined {
    return this.flags.get(flagId);
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagsManager();

// React hook for using feature flags
export function useFeatureFlag(flagId: string, userId?: string, context?: Record<string, any>) {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkFlag = async () => {
      setLoading(true);
      try {
        const enabled = await featureFlags.isEnabled(flagId, userId, context);
        setIsEnabled(enabled);
      } catch (error) {
        logger.error('Error checking feature flag:', error);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFlag();
  }, [flagId, userId, context]);

  return { isEnabled, loading };
}

// Higher-order component for feature flags
export function withFeatureFlag<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  flagId: string,
  fallback?: React.ComponentType<P>
) {
  return function FeatureFlaggedComponent(props: P & { userId?: string }) {
    const { isEnabled, loading } = useFeatureFlag(flagId, props.userId);

    if (loading) {
      return React.createElement('div', null, 'Loading...');
    }

    if (!isEnabled) {
      return fallback ? React.createElement(fallback, props) : null;
    }

    return React.createElement(WrappedComponent, props);
  };
}

// Server-side feature flag checking
export async function checkFeatureFlag(flagId: string, userId?: string, context?: Record<string, any>): Promise<boolean> {
  return await featureFlags.isEnabled(flagId, userId, context);
}