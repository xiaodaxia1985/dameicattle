#!/bin/bash

# 部署验证脚本
set -e

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 检查Docker服务
check_docker() {
    log "Checking Docker services..."
    
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log "✓ Docker services are running"
    else
        log "✗ Docker services are not running properly"
        return 1
    fi
}

# 检查数据库连接
check_database() {
    log "Checking database connectivity..."
    
    if docker-compose -f docker-compose.prod.yml exec -T postgres-master pg_isready -U cattle_user -d cattle_management; then
        log "✓ PostgreSQL master is accessible"
    else
        log "✗ PostgreSQL master is not accessible"
        return 1
    fi
    
    if docker-compose -f docker-compose.prod.yml exec -T postgres-slave pg_isready -U cattle_user; then
        log "✓ PostgreSQL slave is accessible"
    else
        log "✗ PostgreSQL slave is not accessible"
        return 1
    fi
}

# 检查Redis连接
check_redis() {
    log "Checking Redis connectivity..."
    
    if docker-compose -f docker-compose.prod.yml exec -T redis-master redis-cli ping | grep -q PONG; then
        log "✓ Redis master is accessible"
    else
        log "✗ Redis master is not accessible"
        return 1
    fi
    
    if docker-compose -f docker-compose.prod.yml exec -T redis-slave redis-cli ping | grep -q PONG; then
        log "✓ Redis slave is accessible"
    else
        log "✗ Redis slave is not accessible"
        return 1
    fi
}

# 检查API服务
check_api() {
    log "Checking API services..."
    
    if curl -f -s http://localhost/api/v1/health > /dev/null; then
        log "✓ API service is responding"
    else
        log "✗ API service is not responding"
        return 1
    fi
}

# 检查前端服务
check_frontend() {
    log "Checking frontend service..."
    
    if curl -f -s http://localhost/health > /dev/null; then
        log "✓ Frontend service is responding"
    else
        log "✗ Frontend service is not responding"
        return 1
    fi
}

# 检查SSL证书
check_ssl() {
    log "Checking SSL certificates..."
    
    if [ -f "nginx/ssl/cattle-management.com.crt" ] && [ -f "nginx/ssl/cattle-management.com.key" ]; then
        log "✓ SSL certificates are present"
        
        # 检查证书有效期
        if openssl x509 -in nginx/ssl/cattle-management.com.crt -checkend 86400 -noout; then
            log "✓ SSL certificate is valid"
        else
            log "⚠ SSL certificate will expire soon"
        fi
    else
        log "✗ SSL certificates are missing"
        return 1
    fi
}

# 检查备份系统
check_backup() {
    log "Checking backup system..."
    
    if [ -d "database/backup" ]; then
        log "✓ Backup directory exists"
    else
        log "✗ Backup directory is missing"
        return 1
    fi
    
    if docker-compose -f docker-compose.prod.yml ps db-backup | grep -q "Up"; then
        log "✓ Backup service is running"
    else
        log "✗ Backup service is not running"
        return 1
    fi
}

# 检查监控系统
check_monitoring() {
    log "Checking monitoring system..."
    
    if curl -f -s http://localhost:9090/-/healthy > /dev/null; then
        log "✓ Prometheus is healthy"
    else
        log "✗ Prometheus is not accessible"
        return 1
    fi
    
    if curl -f -s http://localhost:3001/api/health > /dev/null; then
        log "✓ Grafana is healthy"
    else
        log "✗ Grafana is not accessible"
        return 1
    fi
}

# 主验证函数
main() {
    log "Starting deployment verification..."
    
    local failed=0
    
    check_docker || failed=1
    check_database || failed=1
    check_redis || failed=1
    check_api || failed=1
    check_frontend || failed=1
    check_ssl || failed=1
    check_backup || failed=1
    check_monitoring || failed=1
    
    if [ $failed -eq 0 ]; then
        log "✅ All deployment verification checks passed!"
        log "System is ready for production use."
    else
        log "❌ Some verification checks failed."
        log "Please review the issues above before proceeding."
        exit 1
    fi
}

main "$@"