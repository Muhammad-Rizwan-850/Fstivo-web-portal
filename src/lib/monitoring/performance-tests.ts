'use server';

/**
 * FSTIVO Performance Testing Utilities
 * Test API response times, cache performance, and database queries
 */

import { cache } from '@/lib/cache/redis';
import { createClient } from '@/lib/supabase/server';

// =====================================================
// TYPES
// =====================================================

export interface PerformanceTestResult {
  name: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface CacheTestResult {
  key: string;
  write_duration: number;
  read_duration: number;
  delete_duration: number;
  success: boolean;
}

export interface DatabaseTestResult {
  query: string;
  duration: number;
  rows: number;
  success: boolean;
}

export interface BenchmarkResults {
  api_response_times: PerformanceTestResult[];
  cache_performance: CacheTestResult[];
  database_queries: DatabaseTestResult[];
  overall_score: number;
}

// =====================================================
// API PERFORMANCE TESTS
// =====================================================

/**
 * Test API endpoint response time
 */
export async function testApiEndpoint(
  url: string,
  method: string = 'GET',
  body?: any
): Promise<PerformanceTestResult> {
  const start = Date.now();

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const duration = Date.now() - start;

    return {
      name: `API: ${method} ${url}`,
      duration,
      success: response.ok,
      metadata: {
        status: response.status,
      },
    };
  } catch (error) {
    return {
      name: `API: ${method} ${url}`,
      duration: Date.now() - start,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test multiple API endpoints
 */
export async function testApiEndpoints(): Promise<PerformanceTestResult[]> {
  const endpoints = [
    { url: '/api/events', method: 'GET' },
    { url: '/api/users', method: 'GET' },
    { url: '/api/analytics', method: 'GET' },
  ];

  const results = await Promise.all(
    endpoints.map((endpoint) =>
      testApiEndpoint(endpoint.url, endpoint.method)
    )
  );

  return results;
}

// =====================================================
// CACHE PERFORMANCE TESTS
// =====================================================

/**
 * Test cache read/write performance
 */
export async function testCachePerformance(): Promise<CacheTestResult[]> {
  const testKey = 'test:performance:' + Date.now();
  const testValue = { data: 'test', timestamp: Date.now() };

  const results: CacheTestResult[] = [];

  // Test write
  const writeStart = Date.now();
  const writeSuccess = await cache.set(testKey, testValue, 60);
  const writeDuration = Date.now() - writeStart;

  // Test read
  const readStart = Date.now();
  const readValue = await cache.get(testKey);
  const readDuration = Date.now() - readStart;

  // Test delete
  const deleteStart = Date.now();
  const deleteSuccess = await cache.del(testKey);
  const deleteDuration = Date.now() - deleteStart;

  results.push({
    key: testKey,
    write_duration: writeDuration,
    read_duration: readDuration,
    delete_duration: deleteDuration,
    success: writeSuccess && readValue !== null && deleteSuccess,
  });

  return results;
}

/**
 * Benchmark cache with multiple operations
 */
export async function benchmarkCache(
  operationCount: number = 100
): Promise<{
  avg_write_time: number;
  avg_read_time: number;
  total_duration: number;
}> {
  const start = Date.now();
  let totalWriteTime = 0;
  let totalReadTime = 0;

  // Write operations
  for (let i = 0; i < operationCount; i++) {
    const key = `bench:write:${i}`;
    const value = { index: i, data: 'test' };

    const writeStart = Date.now();
    await cache.set(key, value, 60);
    totalWriteTime += Date.now() - writeStart;
  }

  // Read operations
  for (let i = 0; i < operationCount; i++) {
    const key = `bench:write:${i}`;

    const readStart = Date.now();
    await cache.get(key);
    totalReadTime += Date.now() - readStart;
  }

  // Cleanup
  await cache.mdel('bench:write:*');

  const totalDuration = Date.now() - start;

  return {
    avg_write_time: totalWriteTime / operationCount,
    avg_read_time: totalReadTime / operationCount,
    total_duration: totalDuration,
  };
}

// =====================================================
// DATABASE PERFORMANCE TESTS
// =====================================================

/**
 * Test database query performance
 */
export async function testDatabaseQuery(
  query: string,
  params: any[] = []
): Promise<DatabaseTestResult> {
  const supabase = createClient();
  const start = Date.now();

  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: query,
      parameters: params,
    });

    const duration = Date.now() - start;

    return {
      query,
      duration,
      rows: Array.isArray(data) ? data.length : 0,
      success: !error,
    };
  } catch (error) {
    return {
      query,
      duration: Date.now() - start,
      rows: 0,
      success: false,
    };
  }
}

/**
 * Test common database queries
 */
export async function testCommonQueries(): Promise<DatabaseTestResult[]> {
  const queries = [
    'SELECT * FROM events WHERE status = \'published\' LIMIT 10',
    'SELECT * FROM users ORDER BY created_at DESC LIMIT 10',
    'SELECT COUNT(*) FROM tickets',
    'SELECT * FROM orders WHERE status = \'completed\' LIMIT 10',
  ];

  const results = await Promise.all(
    queries.map((query) => testDatabaseQuery(query))
  );

  return results;
}

// =====================================================
// COMPREHENSIVE BENCHMARK
// =====================================================

/**
 * Run comprehensive performance benchmark
 */
export async function runPerformanceBenchmark(): Promise<BenchmarkResults> {
  const [apiResults, cacheResults, dbResults] = await Promise.all([
    testApiEndpoints(),
    testCachePerformance(),
    testCommonQueries(),
  ]);

  // Calculate overall score
  const avgApiTime = apiResults.reduce((sum, r) => sum + r.duration, 0) / apiResults.length;
  const avgCacheTime = cacheResults.reduce((sum, r) => sum + r.write_duration + r.read_duration, 0) / cacheResults.length;
  const avgDbTime = dbResults.reduce((sum, r) => sum + r.duration, 0) / dbResults.length;

  // Score calculation (0-100)
  // API: <100ms = 100, >1000ms = 0
  const apiScore = Math.max(0, 100 - (avgApiTime - 100) / 10);
  // Cache: <10ms = 100, >100ms = 0
  const cacheScore = Math.max(0, 100 - (avgCacheTime - 10) / 1);
  // DB: <50ms = 100, >500ms = 0
  const dbScore = Math.max(0, 100 - (avgDbTime - 50) / 5);

  const overallScore = Math.round((apiScore + cacheScore + dbScore) / 3);

  return {
    api_response_times: apiResults,
    cache_performance: cacheResults,
    database_queries: dbResults,
    overall_score: overallScore,
  };
}

// =====================================================
// PERFORMANCE THRESHOLD CHECKS
// =====================================================

export interface ThresholdCheck {
  category: string;
  metric: string;
  value: number;
  threshold: number;
  status: 'pass' | 'warning' | 'fail';
}

/**
 * Check performance against thresholds
 */
export async function checkPerformanceThresholds(): Promise<ThresholdCheck[]> {
  const results = await runPerformanceBenchmark();
  const checks: ThresholdCheck[] = [];

  // API response time checks
  const avgApiTime = results.api_response_times.reduce((sum, r) => sum + r.duration, 0) / results.api_response_times.length;
  checks.push({
    category: 'API',
    metric: 'Average Response Time',
    value: avgApiTime,
    threshold: 500,
    status: avgApiTime < 200 ? 'pass' : avgApiTime < 500 ? 'warning' : 'fail',
  });

  // Cache performance checks
  const avgCacheWriteTime = results.cache_performance.reduce((sum, r) => sum + r.write_duration, 0) / results.cache_performance.length;
  checks.push({
    category: 'Cache',
    metric: 'Average Write Time',
    value: avgCacheWriteTime,
    threshold: 50,
    status: avgCacheWriteTime < 10 ? 'pass' : avgCacheWriteTime < 50 ? 'warning' : 'fail',
  });

  // Database query checks
  const avgDbTime = results.database_queries.reduce((sum, r) => sum + r.duration, 0) / results.database_queries.length;
  checks.push({
    category: 'Database',
    metric: 'Average Query Time',
    value: avgDbTime,
    threshold: 200,
    status: avgDbTime < 100 ? 'pass' : avgDbTime < 200 ? 'warning' : 'fail',
  });

  return checks;
}

// =====================================================
// STRESS TESTING
// =====================================================

/**
 * Stress test cache with concurrent operations
 */
export async function stressTestCache(
  concurrentOperations: number = 50
): Promise<{
  success_count: number;
  failure_count: number;
  avg_duration: number;
}> {
  const operations = [];

  for (let i = 0; i < concurrentOperations; i++) {
    operations.push(
      (async () => {
        const start = Date.now();
        const key = `stress:test:${i}`;
        const success = await cache.set(key, { index: i }, 10);
        await cache.del(key);
        return {
          success,
          duration: Date.now() - start,
        };
      })()
    );
  }

  const results = await Promise.all(operations);

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  return {
    success_count: successCount,
    failure_count: failureCount,
    avg_duration: avgDuration,
  };
}

// =====================================================
// EXPORTS
// =====================================================

export default {
  testApiEndpoint,
  testApiEndpoints,
  testCachePerformance,
  benchmarkCache,
  testDatabaseQuery,
  testCommonQueries,
  runPerformanceBenchmark,
  checkPerformanceThresholds,
  stressTestCache,
};
