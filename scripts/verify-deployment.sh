#!/bin/bash

# Deployment Verification Script
# This script verifies that all services are running correctly after deployment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMEOUT=300

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if service is running
check_service_status() {
    local service_name="$1"
    local container_name="cattle-${service_name}-prod"
    
    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        log_success "$service_name is running"
        return 0
    else
        log_error "$service_name is not running"
        return 1
    fi
}

# Check service health
check_service_health() {
    local service_name="$1"
    local health_url="$2"
    local expected_status="${3:-200}"
    
    log_info "Checking $service_name health..."
    
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" || echo "000")
    
    if [ "$response_code" = "$expected_status" ]; then
        log_success "$service_name health check passed (HTTP $response_code)"
        return 0
    else
        log_error "$service_name health check failed (HTTP $response_code)"
        return 1
    fi
}

# Check database connectivity
check_database() {
    log_info "Checking database connectivity..."
    
    if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres-master \
       psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-cattle_management}" -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "Database connectivity check passed"
        return 0
    else
        log_error "Database connectivity check failed"
        return 1
    fi
}

# Check Redis connectivity
check_redis() {
    log_info "Checking Redis connectivity..."
    
    if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T redis-master \
       redis-cli ping | grep -q "PONG"; then
        log_success "Redis connectivity check passed"
        return 0
    else
        log_error "Redis connectivity check failed"
        return 1
    fi
}

# Check API endpoints
check_api_endpoints() {
    log_info "Checking API endpoints..."
    
    local endpoints=(
        "http://localhost/api/health:200"
        "http://localhost/api/auth/health:200"
        "http://localhost/:200"
    )
    
    local failed=0
    
    for endpoint_info in "${endpoints[@]}"; do
        local endpoint="${endpoint_info%:*}"
        local expected_status="${endpoint_info#*:}"
        
        if ! check_service_health "API Endpoint ($endpoint)" "$endpoint" "$expected_status"; then
            failed=$((failed + 1))
        fi
    done
    
    if [ $failed -eq 0 ]; then
        log_success "All API endpoints are healthy"
        return 0
    else
        log_error "$failed API endpoint(s) failed health checks"
        return 1
    fi
}

# Check monitoring services
check_monitoring() {
    log_info "Checking monitoring services..."
    
    local monitoring_endpoints=(
        "Prometheus:http://localhost:9090/-/healthy:200"
        "Grafana:http://localhost:3001/api/health:200"
        "Elasticsearch:http://localhost:9200/_cluster/health:200"
        "Kibana:http://localhost:5601/api/status:200"
    )
    
    local failed=0
    
    for endpoint_info in "${monitoring_endpoints[@]}"; do
        local service_name="${endpoint_info%%:*}"
        local endpoint="${endpoint_info#*:}"
        local expected_status="${endpoint##*:}"
        endpoint="${endpoint%:*}"
        
        if ! check_service_health "$service_name" "$endpoint" "$expected_status"; then
            failed=$((failed + 1))
        fi
    done
    
    if [ $failed -eq 0 ]; then
        log_success "All monitoring services are healthy"
        return 0
    else
        log_warning "$failed monitoring service(s) failed health checks"
        return 0  # Non-critical for deployment success
    fi
}

# Check SSL certificates
check_ssl_certificates() {
    log_info "Checking SSL certificates..."
    
    if [ -f "$PROJECT_ROOT/ssl/cert.pem" ] && [ -f "$PROJECT_ROOT/ssl/key.pem" ]; then
        # Check certificate expiration
        local expiry_date=$(openssl x509 -in "$PROJECT_ROOT/ssl/cert.pem" -noout -enddate | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ $days_until_expiry -gt 30 ]; then
            log_success "SSL certificate is valid (expires in $days_until_expiry days)"
        elif [ $days_until_expiry -gt 0 ]; then
            log_warning "SSL certificate expires in $days_until_expiry days"
        else
            log_error "SSL certificate has expired"
            return 1
        fi
    else
        log_warning "SSL certificates not found (HTTP only deployment)"
    fi
    
    return 0
}

# Check resource usage
check_resource_usage() {
    log_info "Checking system resource usage..."
    
    # Check memory usage
    local memory_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        log_warning "High memory usage: ${memory_usage}%"
    else
        log_success "Memory usage: ${memory_usage}%"
    fi
    
    # Check disk usage
    local disk_usage=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        log_warning "High disk usage: ${disk_usage}%"
    else
        log_success "Disk usage: ${disk_usage}%"
    fi
    
    # Check load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_count=$(nproc)
    if (( $(echo "$load_avg > $cpu_count" | bc -l) )); then
        log_warning "High system load: $load_avg (CPUs: $cpu_count)"
    else
        log_success "System load: $load_avg (CPUs: $cpu_count)"
    fi
}

# Check container logs for errors
check_container_logs() {
    log_info "Checking container logs for errors..."
    
    local services=("backend" "frontend" "postgres-master" "redis-master")
    local error_count=0
    
    for service in "${services[@]}"; do
        local container_name="cattle-${service}-prod"
        local recent_errors=$(docker logs --since=10m "$container_name" 2>&1 | grep -i "error\|exception\|fatal" | wc -l)
        
        if [ "$recent_errors" -gt 0 ]; then
            log_warning "$service has $recent_errors recent error(s) in logs"
            error_count=$((error_count + recent_errors))
        else
            log_success "$service logs are clean"
        fi
    done
    
    if [ $error_count -gt 10 ]; then
        log_error "High number of errors in logs: $error_count"
        return 1
    elif [ $error_count -gt 0 ]; then
        log_warning "Some errors found in logs: $error_count"
    fi
    
    return 0
}

# Performance test
run_performance_test() {
    log_info "Running basic performance test..."
    
    local test_url="http://localhost/api/health"
    local requests=10
    local concurrency=2
    
    if command -v ab &> /dev/null; then
        local ab_result=$(ab -n $requests -c $concurrency "$test_url" 2>/dev/null | grep "Requests per second" | awk '{print $4}')
        if [ -n "$ab_result" ]; then
            log_success "Performance test: $ab_result requests/second"
        else
            log_warning "Performance test completed but no results"
        fi
    else
        log_warning "Apache Bench (ab) not available, skipping performance test"
    fi
}

# Generate verification report
generate_verification_report() {
    log_info "Generating verification report..."
    
    local report_file="$PROJECT_ROOT/logs/verification-$(date +%Y%m%d-%H%M%S).log"
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
# Deployment Verification Report

**Date:** $(date -Iseconds)
**Verification Status:** $1

## Service Status
$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps)

## System Resources
**Memory:**
$(free -h)

**Disk:**
$(df -h /)

**Load Average:**
$(uptime)

## Container Health
$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")

## Recent Logs Summary
$(for service in backend frontend postgres-master redis-master; do
    echo "### $service"
    docker logs --tail=5 "cattle-${service}-prod" 2>&1 | head -5
    echo ""
done)

## Network Connectivity
$(curl -s -o /dev/null -w "API Health Check: %{http_code} (Response Time: %{time_total}s)\n" http://localhost/api/health)

EOF

    log_success "Verification report saved to $report_file"
}

# Main verification function
main() {
    log_info "Starting deployment verification..."
    log_info "Timestamp: $(date -Iseconds)"
    
    local failed_checks=0
    
    # Core service checks
    if ! check_service_status "nginx"; then failed_checks=$((failed_checks + 1)); fi
    if ! check_service_status "backend"; then failed_checks=$((failed_checks + 1)); fi
    if ! check_service_status "frontend"; then failed_checks=$((failed_checks + 1)); fi
    if ! check_service_status "postgres-master"; then failed_checks=$((failed_checks + 1)); fi
    if ! check_service_status "redis-master"; then failed_checks=$((failed_checks + 1)); fi
    
    # Connectivity checks
    if ! check_database; then failed_checks=$((failed_checks + 1)); fi
    if ! check_redis; then failed_checks=$((failed_checks + 1)); fi
    
    # API checks
    if ! check_api_endpoints; then failed_checks=$((failed_checks + 1)); fi
    
    # Monitoring checks (non-critical)
    check_monitoring
    
    # Security checks
    check_ssl_certificates
    
    # System checks
    check_resource_usage
    check_container_logs
    
    # Performance test
    run_performance_test
    
    # Generate report
    if [ $failed_checks -eq 0 ]; then
        generate_verification_report "PASSED"
        log_success "Deployment verification completed successfully!"
        log_info "All critical services are healthy and operational"
        exit 0
    else
        generate_verification_report "FAILED"
        log_error "Deployment verification failed!"
        log_error "$failed_checks critical check(s) failed"
        exit 1
    fi
}

# Handle command line arguments
case "${1:-verify}" in
    "verify")
        main
        ;;
    "services")
        check_service_status "nginx"
        check_service_status "backend"
        check_service_status "frontend"
        check_service_status "postgres-master"
        check_service_status "redis-master"
        ;;
    "health")
        check_api_endpoints
        ;;
    "monitoring")
        check_monitoring
        ;;
    "resources")
        check_resource_usage
        ;;
    "logs")
        check_container_logs
        ;;
    "performance")
        run_performance_test
        ;;
    *)
        echo "Usage: $0 {verify|services|health|monitoring|resources|logs|performance}"
        exit 1
        ;;
esac