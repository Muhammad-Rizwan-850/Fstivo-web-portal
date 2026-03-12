#!/bin/bash

# =====================================================
# FSTIVO Redis Monitoring Script
# Monitor cache performance and health
# =====================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Redis configuration (from environment)
REDIS_URL="${UPSTASH_REDIS_REST_URL}"
REDIS_TOKEN="${UPSTASH_REDIS_REST_TOKEN}"

if [ -z "$REDIS_URL" ] || [ -z "$REDIS_TOKEN" ]; then
    echo -e "${RED}Error: Redis credentials not set${NC}"
    echo "Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables"
    exit 1
fi

# =====================================================
# HELPER FUNCTIONS
# =====================================================

# Make authenticated request to Redis
redis_request() {
    local endpoint=$1
    curl -s -X GET \
        -H "Authorization: Bearer $REDIS_TOKEN" \
        "$REDIS_URL/$endpoint"
}

# Parse JSON value
get_json_value() {
    local json=$1
    local key=$2
    echo "$json" | grep -o "\"$key\":\"[^\"]*\"" | cut -d'"' -f4
}

# =====================================================
# MONITORING FUNCTIONS
# =====================================================

# Get Redis info
get_redis_info() {
    redis_request "info"
}

# Get memory usage
get_memory_usage() {
    local info=$(get_redis_info)
    local used_memory=$(get_json_value "$info" "used_memory")
    local max_memory=$(get_json_value "$info" "maxmemory")
    
    echo "Memory Usage:"
    echo "  Used: $used_memory bytes"
    echo "  Max: $max_memory bytes"
    
    if [ "$max_memory" != "0" ]; then
        local usage_percent=$((used_memory * 100 / max_memory))
        echo "  Usage: $usage_percent%"
        
        if [ $usage_percent -gt 90 ]; then
            echo -e "  ${RED}Status: CRITICAL - Memory usage above 90%${NC}"
        elif [ $usage_percent -gt 75 ]; then
            echo -e "  ${YELLOW}Status: WARNING - Memory usage above 75%${NC}"
        else
            echo -e "  ${GREEN}Status: OK${NC}"
        fi
    fi
}

# Get cache statistics
get_cache_stats() {
    local info=$(get_redis_info)
    local hits=$(get_json_value "$info" "keyspace_hits")
    local misses=$(get_json_value "$info" "keyspace_misses")
    
    local total=$((hits + misses))
    
    if [ $total -gt 0 ]; then
        local hit_rate=$((hits * 100 / total))
        echo "Cache Statistics:"
        echo "  Hits: $hits"
        echo "  Misses: $misses"
        echo "  Hit Rate: $hit_rate%"
        
        if [ $hit_rate -lt 80 ]; then
            echo -e "  ${RED}Status: WARNING - Hit rate below 80%${NC}"
        elif [ $hit_rate -lt 90 ]; then
            echo -e "  ${YELLOW}Status: INFO - Hit rate below 90%${NC}"
        else
            echo -e "  ${GREEN}Status: OK${NC}"
        fi
    else
        echo "Cache Statistics:"
        echo "  No cache activity yet"
    fi
}

# Get key count
get_key_count() {
    local info=$(get_redis_info)
    local keys=$(get_json_value "$info" "db0")
    echo "Total Keys: $keys"
}

# Get connection count
get_connection_count() {
    local info=$(get_redis_info)
    local connected_clients=$(get_json_value "$info" "connected_clients")
    echo "Active Connections: $connected_clients"
}

# Get slow log
get_slow_log() {
    echo "Slow Log:"
    redis_request "slowlog"
}

# Monitor cache keys by pattern
monitor_cache_pattern() {
    local pattern=$1
    echo "Monitoring keys matching: $pattern"
    
    local keys=$(redis_request "keys/$pattern")
    local count=$(echo "$keys" | grep -o "\"result\":\[.*\]" | grep -o "," | wc -l)
    
    echo "  Key count: $count"
}

# =====================================================
# MAIN MONITORING
# =====================================================

main() {
    echo -e "${GREEN}==================================================="
    echo "FSTIVO Redis Monitoring"
    echo "===================================================${NC}"
    echo
    
    # Check Redis connection
    echo "Checking Redis connection..."
    local pong=$(redis_request "ping")
    if echo "$pong" | grep -q "PONG"; then
        echo -e "${GREEN}✓ Redis connection OK${NC}"
    else
        echo -e "${RED}✗ Redis connection failed${NC}"
        exit 1
    fi
    echo
    
    # Get memory usage
    echo "Memory Usage:"
    get_memory_usage
    echo
    
    # Get cache statistics
    get_cache_stats
    echo
    
    # Get key count
    get_key_count
    echo
    
    # Get connection count
    get_connection_count
    echo
    
    # Monitor specific cache patterns
    echo "Cache Patterns:"
    monitor_cache_pattern "cache:event:*"
    monitor_cache_pattern "cache:user:*"
    monitor_cache_pattern "cache:analytics:*"
    echo
    
    echo -e "${GREEN}==================================================="
    echo "Monitoring complete"
    echo "===================================================${NC}"
}

# Run main function
main
