/**
 * FSTIVO Database Monitoring
 * Monitor query performance, index usage, and table sizes
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface SlowQuery {
  schemaname: string;
  tablename: string;
  indexname: string;
  index_scans: number;
  tuples_read: number;
  tuples_fetched: number;
  table_size: string;
}

export interface IndexUsage {
  schemaname: string;
  tablename: string;
  indexname: string;
  scans: number;
  tuples_read: number;
  tuples_fetched: number;
  usage_level: 'UNUSED' | 'LOW USAGE' | 'MEDIUM USAGE' | 'HIGH USAGE';
}

export interface TableSize {
  schemaname: string;
  tablename: string;
  total_size: string;
  table_size: string;
  indexes_size: string;
}

export interface DatabaseHealthMetrics {
  slow_queries: SlowQuery[];
  unused_indexes: IndexUsage[];
  large_tables: TableSize[];
  cache_hit_ratio: number;
  active_connections: number;
}

// =====================================================
// MONITORING FUNCTIONS
// =====================================================

/**
 * Get slow queries from monitoring view
 */
export async function getSlowQueries(limit: number = 20): Promise<SlowQuery[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_slow_queries', { limit_count: limit })
    .select('*')
    .order('index_scans', { ascending: true });

  if (error) {
    logger.error('Failed to get slow queries:', error);
    return [];
  }

  return data || [];
}

/**
 * Get index usage statistics
 */
export async function getIndexUsage(): Promise<IndexUsage[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('index_usage')
    .select('*')
    .order('scans', { ascending: true });

  if (error) {
    logger.error('Failed to get index usage:', error);
    return [];
  }

  return data || [];
}

/**
 * Get unused indexes (candidates for removal)
 */
export async function getUnusedIndexes(): Promise<IndexUsage[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('index_usage')
    .select('*')
    .eq('usage_level', 'UNUSED')
    .order('scans', { ascending: true });

  if (error) {
    logger.error('Failed to get unused indexes:', error);
    return [];
  }

  return data || [];
}

/**
 * Get table sizes
 */
export async function getTableSizes(): Promise<TableSize[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('table_sizes')
    .select('*')
    .order('total_size', { ascending: false })
    .limit(20);

  if (error) {
    logger.error('Failed to get table sizes:', error);
    return [];
  }

  return data || [];
}

/**
 * Get cache hit ratio
 */
export async function getCacheHitRatio(): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_cache_hit_ratio');

  if (error) {
    logger.error('Failed to get cache hit ratio:', error);
    return 0;
  }

  return data || 0;
}

/**
 * Get database health metrics
 */
export async function getDatabaseHealth(): Promise<DatabaseHealthMetrics> {
  const [slowQueries, unusedIndexes, largeTables, cacheHitRatio] = await Promise.all([
    getSlowQueries(10),
    getUnusedIndexes(),
    getTableSizes(),
    getCacheHitRatio(),
  ]);

  return {
    slow_queries: slowQueries,
    unused_indexes: unusedIndexes,
    large_tables: largeTables,
    cache_hit_ratio: cacheHitRatio,
    active_connections: 0,
  };
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    const supabase = createClient();
    const { error } = await supabase.from('events').select('id').limit(1);

    const latency = Date.now() - start;

    if (error) {
      return {
        healthy: false,
        latency,
        error: error.message,
      };
    }

    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate performance alerts
 */
export async function generatePerformanceAlerts(): Promise<Array<{
  type: string;
  severity: string;
  message: string;
  details: any;
}>> {
  const alerts: Array<any> = [];

  const health = await getDatabaseHealth();

  // Check for slow queries
  if (health.slow_queries.length > 0) {
    alerts.push({
      type: 'slow_query',
      severity: 'warning',
      message: 'Found ' + health.slow_queries.length + ' slow queries',
      details: health.slow_queries.slice(0, 5),
    });
  }

  // Check for unused indexes
  if (health.unused_indexes.length > 5) {
    alerts.push({
      type: 'unused_index',
      severity: 'info',
      message: 'Found ' + health.unused_indexes.length + ' potentially unused indexes',
      details: health.unused_indexes,
    });
  }

  // Check cache hit ratio
  if (health.cache_hit_ratio < 95) {
    alerts.push({
      type: 'low_cache_hit',
      severity: health.cache_hit_ratio < 90 ? 'critical' : 'warning',
      message: 'Cache hit ratio is ' + health.cache_hit_ratio.toFixed(2) + '%',
      details: { ratio: health.cache_hit_ratio },
    });
  }

  return alerts;
}

// =====================================================
// EXPORTS
// =====================================================

export default {
  getSlowQueries,
  getIndexUsage,
  getUnusedIndexes,
  getTableSizes,
  getCacheHitRatio,
  getDatabaseHealth,
  checkDatabaseHealth,
  generatePerformanceAlerts,
};
