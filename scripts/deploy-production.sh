#!/bin/bash

# 生产环境部署脚本
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env.production"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 检查环境变量文件
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log "Creating production environment file..."
        cat > "$ENV_FILE" << 'EOF'
# 生产环境配置
NODE_ENV=production

# 数据库配置
POSTGRES_PASSWORD=your_secure_postgres_password
POSTGRES_REPLICATION_PASSWORD=your_secure_replication_password

# JWT密钥
JWT_SECRET=your_very_secure_jwt_secret_key_here

# Grafana密码
GRAFANA_PASSWORD=your_secure_grafana_password

# 域名配置
DOMAIN=cattle-management.com

# SSL证书类型 (self-signed 或 letsencrypt)
SSL_TYPE=self-signed

# 备份配置
BACKUP_RETENTION_DAYS=30
EOF
        log "Please edit $ENV_FILE with your production settings"
        exit 1
    fi
}

# 加载环境变量
load_env() {
    if [ -f "$ENV_FILE" ]; then
        export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    fi
}

# 系统依赖检查
check_dependencies() {
    log "Checking system dependencies..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        usermod -aG docker $USER
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    log "Dependencies check completed"
}

# 创建必要目录
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p "$PROJECT_DIR/logs/nginx"
    mkdir -p "$PROJECT_DIR/logs/backend-1"
    mkdir -p "$PROJECT_DIR/logs/backend-2"
    mkdir -p "$PROJECT_DIR/logs/frontend"
    mkdir -p "$PROJECT_DIR/database/backup"
    mkdir -p "$PROJECT_DIR/nginx/cache"
    mkdir -p "$PROJECT_DIR/nginx/ssl"
    
    # 设置权限
    chmod 755 "$PROJECT_DIR/logs"
    chmod 755 "$PROJECT_DIR/database/backup"
    chmod 755 "$PROJECT_DIR/nginx/cache"
    
    log "Directories created successfully"
}

# 生成SSL证书
generate_ssl_certificates() {
    log "Generating SSL certificates..."
    
    cd "$PROJECT_DIR"
    chmod +x scripts/generate-ssl.sh
    ./scripts/generate-ssl.sh "$DOMAIN" "$SSL_TYPE"
    
    log "SSL certificates generated"
}

# 构建和启动服务
deploy_services() {
    log "Building and starting production services..."
    
    cd "$PROJECT_DIR"
    
    # 停止现有服务
    docker-compose -f docker-compose.prod.yml down || true
    
    # 清理旧镜像
    docker system prune -f
    
    # 构建镜像
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # 启动服务
    docker-compose -f docker-compose.prod.yml up -d
    
    log "Services deployed successfully"
}

# 健康检查
health_check() {
    log "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts"
        
        # 检查数据库
        if docker-compose -f docker-compose.prod.yml exec -T postgres-master pg_isready -U cattle_user -d cattle_management; then
            log "✓ PostgreSQL master is healthy"
        else
            log "✗ PostgreSQL master is not ready"
            sleep 10
            ((attempt++))
            continue
        fi
        
        # 检查Redis
        if docker-compose -f docker-compose.prod.yml exec -T redis-master redis-cli ping | grep -q PONG; then
            log "✓ Redis master is healthy"
        else
            log "✗ Redis master is not ready"
            sleep 10
            ((attempt++))
            continue
        fi
        
        # 检查后端服务
        if curl -f http://localhost/api/v1/health > /dev/null 2>&1; then
            log "✓ Backend API is healthy"
        else
            log "✗ Backend API is not ready"
            sleep 10
            ((attempt++))
            continue
        fi
        
        # 检查前端服务
        if curl -f http://localhost/health > /dev/null 2>&1; then
            log "✓ Frontend is healthy"
        else
            log "✗ Frontend is not ready"
            sleep 10
            ((attempt++))
            continue
        fi
        
        log "All services are healthy!"
        return 0
    done
    
    log "Health check failed after $max_attempts attempts"
    return 1
}

# 设置监控
setup_monitoring() {
    log "Setting up monitoring..."
    
    # 启动监控服务
    docker-compose -f docker-compose.prod.yml up -d prometheus grafana filebeat
    
    log "Monitoring services started"
    log "Grafana dashboard: http://localhost:3001 (admin/\$GRAFANA_PASSWORD)"
    log "Prometheus: http://localhost:9090"
}

# 设置备份
setup_backup() {
    log "Setting up backup system..."
    
    # 设置备份脚本权限
    chmod +x "$PROJECT_DIR/scripts/backup.sh"
    
    # 启动备份服务
    docker-compose -f docker-compose.prod.yml up -d db-backup
    
    log "Backup system configured"
}

# 显示部署信息
show_deployment_info() {
    log "Deployment completed successfully!"
    echo ""
    echo "=== Deployment Information ==="
    echo "Domain: https://$DOMAIN"
    echo "Admin Panel: https://admin.$DOMAIN"
    echo "API Endpoint: https://api.$DOMAIN"
    echo ""
    echo "=== Monitoring ==="
    echo "Grafana: http://localhost:3001"
    echo "Prometheus: http://localhost:9090"
    echo ""
    echo "=== Management Commands ==="
    echo "View logs: docker-compose -f docker-compose.prod.yml logs -f [service]"
    echo "Restart service: docker-compose -f docker-compose.prod.yml restart [service]"
    echo "Scale backend: docker-compose -f docker-compose.prod.yml up -d --scale backend-1=2 --scale backend-2=2"
    echo ""
    echo "=== Backup ==="
    echo "Manual backup: docker-compose -f docker-compose.prod.yml exec db-backup /backup.sh"
    echo "Backup location: $PROJECT_DIR/database/backup"
    echo ""
}

# 主函数
main() {
    log "Starting production deployment..."
    
    check_env_file
    load_env
    check_dependencies
    create_directories
    generate_ssl_certificates
    deploy_services
    
    if health_check; then
        setup_monitoring
        setup_backup
        show_deployment_info
    else
        log "Deployment failed - services are not healthy"
        exit 1
    fi
}

# 显示帮助信息
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Production Deployment Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo "  --check       Perform health check only"
    echo "  --logs        Show service logs"
    echo "  --status      Show service status"
    echo ""
    exit 0
fi

# 处理命令行参数
case "$1" in
    "--check")
        load_env
        health_check
        ;;
    "--logs")
        docker-compose -f docker-compose.prod.yml logs -f "${2:-}"
        ;;
    "--status")
        docker-compose -f docker-compose.prod.yml ps
        ;;
    *)
        main
        ;;
esac