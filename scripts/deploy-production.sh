#!/bin/bash

# Production Deployment Script for Cattle Management System
# This script handles zero-downtime deployment with health checks and rollback capabilities

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
BACKUP_BEFORE_DEPLOY="${BACKUP_BEFORE_DEPLOY:-true}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Error handling
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Deployment failed with exit code $exit_code"
        if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
            log_info "Initiating rollback..."
            rollback_deployment
        fi
    fi
    exit $exit_code
}

trap cleanup EXIT

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check if required environment files exist
    if [ ! -f "$PROJECT_ROOT/.env.production" ]; then
        log_error "Production environment file not found: .env.production"
        exit 1
    fi

    # Check Docker and Docker Compose
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    # Check if ports are available
    local required_ports=(80 443 5432 6379 9090 3001 9200 5601)
    for port in "${required_ports[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            log_warning "Port $port is already in use"
        fi
    done

    # Check disk space
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=5000000 # 5GB in KB
    if [ "$available_space" -lt "$required_space" ]; then
        log_error "Insufficient disk space. Required: 5GB, Available: $(($available_space/1024/1024))GB"
        exit 1
    fi

    # Check memory
    local available_memory=$(free -m | awk 'NR==2{print $7}')
    local required_memory=4096 # 4GB in MB
    if [ "$available_memory" -lt "$required_memory" ]; then
        log_error "Insufficient memory. Required: 4GB, Available: ${available_memory}MB"
        exit 1
    fi

    log_success "Pre-deployment checks passed"
}

# Backup current deployment
backup_current_deployment() {
    if [ "$BACKUP_BEFORE_DEPLOY" != "true" ]; then
        log_info "Skipping backup (BACKUP_BEFORE_DEPLOY=false)"
        return
    fi

    log_info "Creating backup of current deployment..."

    local backup_dir="$PROJECT_ROOT/backups/deployment-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"

    # Backup database
    log_info "Backing up database..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres-master \
        pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "$backup_dir/database.sql.gz"

    # Backup uploads
    log_info "Backing up uploaded files..."
    if [ -d "$PROJECT_ROOT/uploads" ]; then
        tar -czf "$backup_dir/uploads.tar.gz" -C "$PROJECT_ROOT" uploads/
    fi

    # Backup configuration
    log_info "Backing up configuration..."
    cp "$PROJECT_ROOT/.env.production" "$backup_dir/"
    cp "$PROJECT_ROOT/docker-compose.prod.yml" "$backup_dir/"

    # Store backup metadata
    cat > "$backup_dir/metadata.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
    "deployment_env": "$DEPLOYMENT_ENV"
}
EOF

    log_success "Backup created at $backup_dir"
    echo "$backup_dir" > "$PROJECT_ROOT/.last_backup"
}

# Build and prepare images
build_images() {
    log_info "Building production images..."

    cd "$PROJECT_ROOT"

    # Load environment variables
    set -a
    source .env.production
    set +a

    # Build backend image
    log_info "Building backend image..."
    docker build -t cattle-backend:latest -f backend/Dockerfile backend/

    # Build frontend image
    log_info "Building frontend image..."
    docker build -t cattle-frontend:latest -f frontend/Dockerfile frontend/

    # Tag images with version
    local version=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    docker tag cattle-backend:latest "cattle-backend:$version"
    docker tag cattle-frontend:latest "cattle-frontend:$version"

    log_success "Images built successfully"
}

# Deploy services with zero downtime
deploy_services() {
    log_info "Deploying services..."

    cd "$PROJECT_ROOT"

    # Load environment variables
    set -a
    source .env.production
    set +a

    # Start infrastructure services first
    log_info "Starting infrastructure services..."
    docker-compose -f docker-compose.prod.yml up -d \
        postgres-master postgres-slave redis-master redis-slave \
        elasticsearch prometheus grafana

    # Wait for infrastructure to be ready
    wait_for_service "postgres-master" "5432" "PostgreSQL Master"
    wait_for_service "redis-master" "6379" "Redis Master"
    wait_for_service "elasticsearch" "9200" "Elasticsearch"

    # Deploy backend with rolling update
    log_info "Deploying backend services..."
    docker-compose -f docker-compose.prod.yml up -d --scale backend=2 backend

    # Wait for backend to be healthy
    wait_for_health_check "http://localhost/api/health" "Backend API"

    # Deploy frontend
    log_info "Deploying frontend services..."
    docker-compose -f docker-compose.prod.yml up -d --scale frontend=2 frontend

    # Start reverse proxy
    log_info "Starting reverse proxy..."
    docker-compose -f docker-compose.prod.yml up -d nginx

    # Start monitoring and logging services
    log_info "Starting monitoring services..."
    docker-compose -f docker-compose.prod.yml up -d \
        logstash kibana node-exporter cadvisor backup

    log_success "Services deployed successfully"
}

# Wait for service to be available
wait_for_service() {
    local service_name="$1"
    local port="$2"
    local display_name="$3"
    local timeout=60
    local count=0

    log_info "Waiting for $display_name to be ready..."

    while [ $count -lt $timeout ]; do
        if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" \
           exec -T "$service_name" sh -c "nc -z localhost $port" 2>/dev/null; then
            log_success "$display_name is ready"
            return 0
        fi
        sleep 2
        count=$((count + 2))
    done

    log_error "$display_name failed to start within ${timeout}s"
    return 1
}

# Wait for health check to pass
wait_for_health_check() {
    local url="$1"
    local service_name="$2"
    local timeout="$HEALTH_CHECK_TIMEOUT"
    local count=0

    log_info "Waiting for $service_name health check..."

    while [ $count -lt $timeout ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log_success "$service_name health check passed"
            return 0
        fi
        sleep 5
        count=$((count + 5))
    done

    log_error "$service_name health check failed within ${timeout}s"
    return 1
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."

    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T backend \
        npm run migrate:prod

    log_success "Database migrations completed"
}

# Post-deployment verification
post_deployment_verification() {
    log_info "Running post-deployment verification..."

    # Check all services are running
    local services=(
        "nginx" "backend" "frontend" "postgres-master" "redis-master"
        "prometheus" "grafana" "elasticsearch" "kibana"
    )

    for service in "${services[@]}"; do
        if ! docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps "$service" | grep -q "Up"; then
            log_error "Service $service is not running"
            return 1
        fi
    done

    # Test API endpoints
    local endpoints=(
        "http://localhost/api/health"
        "http://localhost/api/auth/health"
        "http://localhost/"
    )

    for endpoint in "${endpoints[@]}"; do
        if ! curl -f -s "$endpoint" > /dev/null; then
            log_error "Endpoint $endpoint is not responding"
            return 1
        fi
    done

    # Check monitoring endpoints
    local monitoring_endpoints=(
        "http://localhost:9090/-/healthy"  # Prometheus
        "http://localhost:3001/api/health" # Grafana
        "http://localhost:9200/_cluster/health" # Elasticsearch
    )

    for endpoint in "${monitoring_endpoints[@]}"; do
        if ! curl -f -s "$endpoint" > /dev/null; then
            log_warning "Monitoring endpoint $endpoint is not responding"
        fi
    done

    log_success "Post-deployment verification completed"
}

# Rollback deployment
rollback_deployment() {
    log_warning "Rolling back deployment..."

    if [ ! -f "$PROJECT_ROOT/.last_backup" ]; then
        log_error "No backup found for rollback"
        return 1
    fi

    local backup_dir=$(cat "$PROJECT_ROOT/.last_backup")
    if [ ! -d "$backup_dir" ]; then
        log_error "Backup directory not found: $backup_dir"
        return 1
    fi

    # Stop current services
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" down

    # Restore configuration
    cp "$backup_dir/.env.production" "$PROJECT_ROOT/"
    cp "$backup_dir/docker-compose.prod.yml" "$PROJECT_ROOT/"

    # Restore database
    if [ -f "$backup_dir/database.sql.gz" ]; then
        log_info "Restoring database..."
        gunzip -c "$backup_dir/database.sql.gz" | \
            docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres-master \
            psql -U "${DB_USER}" "${DB_NAME}"
    fi

    # Restore uploads
    if [ -f "$backup_dir/uploads.tar.gz" ]; then
        log_info "Restoring uploaded files..."
        tar -xzf "$backup_dir/uploads.tar.gz" -C "$PROJECT_ROOT"
    fi

    # Restart services
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" up -d

    log_success "Rollback completed"
}

# Cleanup old backups and images
cleanup_old_resources() {
    log_info "Cleaning up old resources..."

    # Remove old backups (keep last 7 days)
    find "$PROJECT_ROOT/backups" -type d -name "deployment-*" -mtime +7 -exec rm -rf {} + 2>/dev/null || true

    # Remove unused Docker images
    docker image prune -f

    # Remove unused volumes
    docker volume prune -f

    log_success "Cleanup completed"
}

# Generate deployment report
generate_deployment_report() {
    log_info "Generating deployment report..."

    local report_file="$PROJECT_ROOT/logs/deployment-$(date +%Y%m%d-%H%M%S).log"
    mkdir -p "$(dirname "$report_file")"

    cat > "$report_file" << EOF
# Deployment Report

**Date:** $(date -Iseconds)
**Environment:** $DEPLOYMENT_ENV
**Git Commit:** $(git rev-parse HEAD 2>/dev/null || echo 'unknown')
**Git Branch:** $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')

## Services Status
$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps)

## System Resources
**Memory Usage:**
$(free -h)

**Disk Usage:**
$(df -h)

**Docker Images:**
$(docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}")

## Health Checks
$(curl -s http://localhost/api/health | jq . 2>/dev/null || echo "API health check failed")

## Deployment Completed Successfully
EOF

    log_success "Deployment report saved to $report_file"
}

# Main deployment function
main() {
    log_info "Starting production deployment..."
    log_info "Environment: $DEPLOYMENT_ENV"
    log_info "Timestamp: $(date -Iseconds)"

    pre_deployment_checks
    backup_current_deployment
    build_images
    deploy_services
    run_migrations
    post_deployment_verification
    cleanup_old_resources
    generate_deployment_report

    log_success "Production deployment completed successfully!"
    log_info "Application is available at: http://localhost"
    log_info "Monitoring dashboard: http://localhost:3001"
    log_info "Logs dashboard: http://localhost:5601"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback_deployment
        ;;
    "backup")
        backup_current_deployment
        ;;
    "health-check")
        post_deployment_verification
        ;;
    "cleanup")
        cleanup_old_resources
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|backup|health-check|cleanup}"
        exit 1
        ;;
esac