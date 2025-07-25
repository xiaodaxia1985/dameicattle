#!/bin/bash

# Development Environment Health Check and Troubleshooting Script
# Validates all components and provides troubleshooting guidance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="cattle-management-system"
BACKEND_PORT=3000
FRONTEND_PORT=5173
DB_PORT=5432
REDIS_PORT=6379
ADMINER_PORT=8080

# Health check results
HEALTH_RESULTS=()

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    HEALTH_RESULTS+=("✅ $1")
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    HEALTH_RESULTS+=("⚠️  $1")
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    HEALTH_RESULTS+=("❌ $1")
}

# Check if port is in use
check_port() {
    local port=$1
    local service=$2
    
    if lsof -i :$port >/dev/null 2>&1; then
        local process=$(lsof -i :$port | tail -n 1 | awk '{print $1}')
        log_success "$service is running on port $port (process: $process)"
        return 0
    else
        log_error "$service is not running on port $port"
        return 1
    fi
}

# Check service health endpoint
check_health_endpoint() {
    local url=$1
    local service=$2
    local timeout=${3:-5}
    
    if curl -s --max-time $timeout "$url" >/dev/null 2>&1; then
        log_success "$service health endpoint is responding"
        return 0
    else
        log_error "$service health endpoint is not responding"
        return 1
    fi
}

# Check Docker service
check_docker_service() {
    local service=$1
    
    if docker-compose ps $service | grep -q "Up"; then
        log_success "Docker service '$service' is running"
        return 0
    else
        log_error "Docker service '$service' is not running"
        return 1
    fi
}

# Check file permissions
check_file_permissions() {
    local path=$1
    local required_perm=$2
    
    if [[ -d "$path" ]]; then
        local current_perm=$(stat -c "%a" "$path" 2>/dev/null || stat -f "%A" "$path" 2>/dev/null)
        if [[ "$current_perm" -ge "$required_perm" ]]; then
            log_success "Directory $path has correct permissions ($current_perm)"
            return 0
        else
            log_warning "Directory $path has insufficient permissions ($current_perm, need $required_perm)"
            return 1
        fi
    else
        log_error "Directory $path does not exist"
        return 1
    fi
}

# Check environment variables
check_environment_variables() {
    local env_file=$1
    local service=$2
    
    if [[ -f "$env_file" ]]; then
        log_success "$service environment file exists"
        
        # Check for required variables (basic check)
        local required_vars=()
        case $service in
            "Backend")
                required_vars=("DB_HOST" "DB_PORT" "DB_NAME" "JWT_SECRET")
                ;;
            "Frontend")
                required_vars=("VITE_API_BASE_URL")
                ;;
        esac
        
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" "$env_file"; then
                log_success "$service has $var configured"
            else
                log_warning "$service missing $var in environment file"
            fi
        done
        return 0
    else
        log_error "$service environment file not found: $env_file"
        return 1
    fi
}

# Check database connectivity
check_database_connectivity() {
    log_info "Checking database connectivity..."
    
    # Check if PostgreSQL is running
    if check_docker_service "postgres"; then
        # Test database connection
        if docker-compose exec -T postgres pg_isready -U cattle_user -d cattle_management >/dev/null 2>&1; then
            log_success "Database connection is working"
        else
            log_error "Database connection failed"
            log_info "Try: docker-compose restart postgres"
        fi
    else
        log_error "PostgreSQL container is not running"
        log_info "Try: docker-compose up -d postgres"
    fi
}

# Check Redis connectivity
check_redis_connectivity() {
    log_info "Checking Redis connectivity..."
    
    if check_docker_service "redis"; then
        # Test Redis connection
        if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
            log_success "Redis connection is working"
        else
            log_error "Redis connection failed"
            log_info "Try: docker-compose restart redis"
        fi
    else
        log_error "Redis container is not running"
        log_info "Try: docker-compose up -d redis"
    fi
}

# Check Node.js dependencies
check_node_dependencies() {
    local component=$1
    local path=$2
    
    log_info "Checking $component dependencies..."
    
    if [[ -f "$path/package.json" ]]; then
        if [[ -d "$path/node_modules" ]]; then
            local package_count=$(find "$path/node_modules" -maxdepth 1 -type d | wc -l)
            if [[ $package_count -gt 10 ]]; then
                log_success "$component dependencies are installed ($package_count packages)"
            else
                log_warning "$component has few dependencies installed"
                log_info "Try: cd $path && npm install"
            fi
        else
            log_error "$component dependencies are not installed"
            log_info "Try: cd $path && npm install"
        fi
    else
        log_error "$component package.json not found"
    fi
}

# Check build artifacts
check_build_artifacts() {
    local component=$1
    local build_path=$2
    
    if [[ -d "$build_path" ]]; then
        local file_count=$(find "$build_path" -type f | wc -l)
        if [[ $file_count -gt 0 ]]; then
            log_success "$component build artifacts exist ($file_count files)"
        else
            log_warning "$component build directory is empty"
        fi
    else
        log_info "$component has not been built yet"
    fi
}

# System resource check
check_system_resources() {
    log_info "Checking system resources..."
    
    # Check memory usage
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}' 2>/dev/null || echo "unknown")
    if [[ "$memory_usage" != "unknown" ]]; then
        if (( $(echo "$memory_usage > 80" | bc -l) )); then
            log_warning "High memory usage: ${memory_usage}%"
        else
            log_success "Memory usage is normal: ${memory_usage}%"
        fi
    fi
    
    # Check disk space
    local disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 90 ]]; then
        log_warning "High disk usage: ${disk_usage}%"
    else
        log_success "Disk usage is normal: ${disk_usage}%"
    fi
    
    # Check CPU load (Linux only)
    if command -v uptime >/dev/null; then
        local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
        log_info "System load average: $load_avg"
    fi
}

# Network connectivity check
check_network_connectivity() {
    log_info "Checking network connectivity..."
    
    # Check internet connectivity
    if curl -s --max-time 5 https://www.google.com >/dev/null 2>&1; then
        log_success "Internet connectivity is working"
    else
        log_warning "Internet connectivity issues detected"
    fi
    
    # Check localhost connectivity
    if curl -s --max-time 2 http://localhost >/dev/null 2>&1; then
        log_success "Localhost connectivity is working"
    else
        log_info "Localhost not responding (normal if no web server running)"
    fi
}

# Docker health check
check_docker_health() {
    log_info "Checking Docker health..."
    
    if command -v docker >/dev/null; then
        if docker info >/dev/null 2>&1; then
            log_success "Docker daemon is running"
            
            # Check Docker Compose
            if command -v docker-compose >/dev/null; then
                log_success "Docker Compose is available"
            elif docker compose version >/dev/null 2>&1; then
                log_success "Docker Compose (plugin) is available"
            else
                log_error "Docker Compose is not available"
            fi
            
            # Check running containers
            local container_count=$(docker ps -q | wc -l)
            log_info "Running containers: $container_count"
            
        else
            log_error "Docker daemon is not running"
            log_info "Try: Start Docker Desktop or run 'sudo systemctl start docker'"
        fi
    else
        log_error "Docker is not installed"
    fi
}

# Generate troubleshooting report
generate_troubleshooting_report() {
    local report_file="health-check-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# Development Environment Health Check Report

Generated: $(date)

## Health Check Results

$(printf '%s\n' "${HEALTH_RESULTS[@]}")

## Common Issues and Solutions

### Port Conflicts
If services can't start due to port conflicts:
\`\`\`bash
# Find what's using the port
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill the process if needed
kill -9 <PID>
\`\`\`

### Database Issues
\`\`\`bash
# Restart database
docker-compose restart postgres

# Reset database
npm run db:reset

# Check database logs
docker-compose logs postgres

# Connect to database manually
docker-compose exec postgres psql -U cattle_user -d cattle_management
\`\`\`

### Redis Issues
\`\`\`bash
# Restart Redis
docker-compose restart redis

# Check Redis logs
docker-compose logs redis

# Connect to Redis manually
docker-compose exec redis redis-cli
\`\`\`

### Node.js Issues
\`\`\`bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version
npm --version
\`\`\`

### Docker Issues
\`\`\`bash
# Restart Docker services
docker-compose down
docker-compose up -d

# Clean Docker system
docker system prune -f

# Rebuild containers
docker-compose up --build
\`\`\`

### Permission Issues
\`\`\`bash
# Fix file permissions
chmod +x scripts/*.sh
chmod 755 backend/uploads
chmod 755 logs

# Fix ownership (if needed)
sudo chown -R \$USER:$USER .
\`\`\`

### Environment Issues
\`\`\`bash
# Check environment files
ls -la backend/.env
ls -la frontend/.env
ls -la .env

# Recreate environment files
cp backend/.env.development backend/.env
\`\`\`

## Service URLs for Testing

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Backend Health: http://localhost:3000/health
- Database Admin: http://localhost:8080
- API Documentation: http://localhost:3000/api/docs

## Next Steps

1. Address any ❌ errors shown above
2. Restart services after fixing issues
3. Run this health check again to verify fixes
4. If issues persist, check the logs: \`docker-compose logs\`

## Getting Help

- Check DEVELOPMENT_GUIDE.md for detailed setup instructions
- Review Docker logs: \`docker-compose logs [service]\`
- Check application logs in the logs/ directory
- Ensure all environment variables are properly configured

EOF

    log_success "Troubleshooting report generated: $report_file"
}

# Main health check function
main() {
    echo "🏥 Development Environment Health Check for $PROJECT_NAME"
    echo "============================================================"
    
    # System checks
    check_system_resources
    check_network_connectivity
    check_docker_health
    
    echo ""
    log_info "Checking project structure..."
    
    # Project structure checks
    check_file_permissions "backend/uploads" 755
    check_file_permissions "logs" 755
    check_environment_variables "backend/.env" "Backend"
    check_environment_variables "frontend/.env" "Frontend"
    
    echo ""
    log_info "Checking dependencies..."
    
    # Dependencies checks
    check_node_dependencies "Root" "."
    check_node_dependencies "Backend" "backend"
    check_node_dependencies "Frontend" "frontend"
    check_node_dependencies "Miniprogram" "miniprogram"
    
    echo ""
    log_info "Checking services..."
    
    # Service checks
    check_database_connectivity
    check_redis_connectivity
    
    # Port checks
    if check_port $BACKEND_PORT "Backend API"; then
        check_health_endpoint "http://localhost:$BACKEND_PORT/health" "Backend API"
    fi
    
    if check_port $FRONTEND_PORT "Frontend"; then
        check_health_endpoint "http://localhost:$FRONTEND_PORT" "Frontend"
    fi
    
    check_port $DB_PORT "PostgreSQL"
    check_port $REDIS_PORT "Redis"
    check_port $ADMINER_PORT "Adminer"
    
    echo ""
    log_info "Checking build artifacts..."
    
    # Build artifacts
    check_build_artifacts "Backend" "backend/dist"
    check_build_artifacts "Frontend" "frontend/dist"
    check_build_artifacts "Miniprogram" "miniprogram/dist"
    
    echo ""
    echo "============================================================"
    
    # Count results
    local success_count=$(printf '%s\n' "${HEALTH_RESULTS[@]}" | grep -c "✅" || echo 0)
    local warning_count=$(printf '%s\n' "${HEALTH_RESULTS[@]}" | grep -c "⚠️" || echo 0)
    local error_count=$(printf '%s\n' "${HEALTH_RESULTS[@]}" | grep -c "❌" || echo 0)
    
    echo "Health Check Summary:"
    echo "  ✅ Passed: $success_count"
    echo "  ⚠️  Warnings: $warning_count"
    echo "  ❌ Errors: $error_count"
    
    if [[ $error_count -eq 0 && $warning_count -eq 0 ]]; then
        log_success "All health checks passed! Your development environment is ready."
    elif [[ $error_count -eq 0 ]]; then
        log_warning "Health check completed with warnings. Environment should work but may have minor issues."
    else
        log_error "Health check found errors. Please address the issues above."
    fi
    
    echo ""
    generate_troubleshooting_report
    
    echo ""
    log_info "Quick fixes:"
    echo "  - Restart all services: docker-compose restart"
    echo "  - Reinstall dependencies: npm run clean:all && npm install"
    echo "  - Reset database: npm run db:reset"
    echo "  - Full reset: ./scripts/dev-setup-enhanced.sh"
}

# Run main function
main "$@"