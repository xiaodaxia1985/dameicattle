#!/bin/bash

# SSL证书生成脚本
set -e

DOMAIN="${1:-cattle-management.com}"
SSL_DIR="./nginx/ssl"
COUNTRY="CN"
STATE="Beijing"
CITY="Beijing"
ORGANIZATION="Cattle Management System"
ORGANIZATIONAL_UNIT="IT Department"
EMAIL="admin@cattle-management.com"

# 创建SSL目录
mkdir -p "$SSL_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 生成自签名证书 (开发/测试环境)
generate_self_signed() {
    log "Generating self-signed certificate for $DOMAIN..."
    
    # 生成私钥
    openssl genrsa -out "$SSL_DIR/$DOMAIN.key" 2048
    
    # 生成证书签名请求
    openssl req -new -key "$SSL_DIR/$DOMAIN.key" -out "$SSL_DIR/$DOMAIN.csr" -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=$DOMAIN/emailAddress=$EMAIL"
    
    # 生成自签名证书
    openssl x509 -req -days 365 -in "$SSL_DIR/$DOMAIN.csr" -signkey "$SSL_DIR/$DOMAIN.key" -out "$SSL_DIR/$DOMAIN.crt"
    
    # 创建证书链文件
    cp "$SSL_DIR/$DOMAIN.crt" "$SSL_DIR/$DOMAIN.chain.crt"
    
    # 设置权限
    chmod 600 "$SSL_DIR/$DOMAIN.key"
    chmod 644 "$SSL_DIR/$DOMAIN.crt"
    chmod 644 "$SSL_DIR/$DOMAIN.chain.crt"
    
    log "Self-signed certificate generated successfully"
}

# 生成Let's Encrypt证书 (生产环境)
generate_letsencrypt() {
    log "Generating Let's Encrypt certificate for $DOMAIN..."
    
    # 检查certbot是否安装
    if ! command -v certbot &> /dev/null; then
        log "Installing certbot..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    fi
    
    # 生成证书
    certbot certonly --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        -d "api.$DOMAIN" \
        -d "admin.$DOMAIN"
    
    # 复制证书到nginx目录
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/$DOMAIN.crt"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/$DOMAIN.key"
    cp "/etc/letsencrypt/live/$DOMAIN/chain.pem" "$SSL_DIR/$DOMAIN.chain.crt"
    
    # 设置权限
    chmod 600 "$SSL_DIR/$DOMAIN.key"
    chmod 644 "$SSL_DIR/$DOMAIN.crt"
    chmod 644 "$SSL_DIR/$DOMAIN.chain.crt"
    
    log "Let's Encrypt certificate generated successfully"
}

# 设置证书自动续期
setup_auto_renewal() {
    log "Setting up automatic certificate renewal..."
    
    # 创建续期脚本
    cat > /usr/local/bin/renew-ssl.sh << 'EOF'
#!/bin/bash
certbot renew --quiet --post-hook "docker-compose -f /opt/cattle-management/docker-compose.prod.yml restart nginx"
EOF
    
    chmod +x /usr/local/bin/renew-ssl.sh
    
    # 添加到crontab
    (crontab -l 2>/dev/null; echo "0 2 * * 0 /usr/local/bin/renew-ssl.sh") | crontab -
    
    log "Automatic certificate renewal configured"
}

# 主函数
main() {
    case "${2:-self-signed}" in
        "letsencrypt")
            generate_letsencrypt
            setup_auto_renewal
            ;;
        "self-signed"|*)
            generate_self_signed
            ;;
    esac
    
    log "SSL certificate setup completed for $DOMAIN"
    log "Certificate files:"
    log "  Private key: $SSL_DIR/$DOMAIN.key"
    log "  Certificate: $SSL_DIR/$DOMAIN.crt"
    log "  Chain: $SSL_DIR/$DOMAIN.chain.crt"
}

# 显示帮助信息
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 <domain> [certificate-type]"
    echo ""
    echo "Arguments:"
    echo "  domain           Domain name (default: cattle-management.com)"
    echo "  certificate-type Certificate type: self-signed or letsencrypt (default: self-signed)"
    echo ""
    echo "Examples:"
    echo "  $0 cattle-management.com self-signed"
    echo "  $0 cattle-management.com letsencrypt"
    exit 0
fi

main "$@"