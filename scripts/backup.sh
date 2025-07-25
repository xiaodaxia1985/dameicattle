#!/bin/bash

# Automated Backup Script for Cattle Management System
# This script creates comprehensive backups of database, files, and configuration

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="cattle-backup-$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# S3 Configuration (optional)
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

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

# Create backup directory
create_backup_directory() {
    log_info "Creating backup directory: $BACKUP_PATH"
    mkdir -p "$BACKUP_PATH"
}

# Backup database
backup_database() {
    log_info "Backing up PostgreSQL database..."
    
    local db_backup_file="$BACKUP_PATH/database.sql"
    local db_backup_compressed="$BACKUP_PATH/database.sql.gz"
    
    # Load environment variables
    set -a
    source "$PROJECT_ROOT/.env.production" 2>/dev/null || {
        log_warning "Could not load .env.production, using defaults"
        DB_NAME="${DB_NAME:-cattle_management}"
        DB_USER="${DB_USER:-postgres}"
        DB_PASSWORD="${DB_PASSWORD:-postgres}"
    }
    set +a
    
    # Create database dump
    if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres-master \
       pg_dump -U "$DB_USER" -h localhost "$DB_NAME" > "$db_backup_file"; then
        
        # Compress the backup
        gzip "$db_backup_file"
        
        local backup_size=$(du -h "$db_backup_compressed" | cut -f1)
        log_success "Database backup completed: $backup_size"
    else
        log_error "Database backup failed"
        return 1
    fi
}

# Backup uploaded files
backup_uploads() {
    log_info "Backing up uploaded files..."
    
    local uploads_dir="$PROJECT_ROOT/uploads"
    local uploads_backup="$BACKUP_PATH/uploads.tar.gz"
    
    if [ -d "$uploads_dir" ] && [ "$(ls -A "$uploads_dir")" ]; then
        if tar -czf "$uploads_backup" -C "$PROJECT_ROOT" uploads/; then
            local backup_size=$(du -h "$uploads_backup" | cut -f1)
            log_success "Uploads backup completed: $backup_size"
        else
            log_error "Uploads backup failed"
            return 1
        fi
    else
        log_warning "No uploads directory found or directory is empty"
        touch "$uploads_backup.empty"
    fi
}

# Backup configuration files
backup_configuration() {
    log_info "Backing up configuration files..."
    
    local config_backup="$BACKUP_PATH/configuration.tar.gz"
    local config_files=(
        ".env.production"
        "docker-compose.prod.yml"
        "nginx/nginx.prod.conf"
        "nginx/conf.d"
        "monitoring/prometheus.yml"
        "monitoring/grafana"
        "ssl"
    )
    
    local existing_files=()
    for file in "${config_files[@]}"; do
        if [ -e "$PROJECT_ROOT/$file" ]; then
            existing_files+=("$file")
        fi
    done
    
    if [ ${#existing_files[@]} -gt 0 ]; then
        if tar -czf "$config_backup" -C "$PROJECT_ROOT" "${existing_files[@]}"; then
            local backup_size=$(du -h "$config_backup" | cut -f1)
            log_success "Configuration backup completed: $backup_size"
        else
            log_error "Configuration backup failed"
            return 1
        fi
    else
        log_warning "No configuration files found"
    fi
}

# Backup Docker volumes
backup_volumes() {
    log_info "Backing up Docker volumes..."
    
    local volumes_backup="$BACKUP_PATH/volumes.tar.gz"
    local volume_names=(
        "postgres_master_data"
        "redis_master_data"
        "prometheus_data"
        "grafana_data"
        "elasticsearch_data"
    )
    
    local temp_dir=$(mktemp -d)
    local backed_up_volumes=()
    
    for volume in "${volume_names[@]}"; do
        local volume_full_name="${PROJECT_ROOT##*/}_${volume}"
        
        if docker volume inspect "$volume_full_name" >/dev/null 2>&1; then
            log_info "Backing up volume: $volume"
            
            # Create a temporary container to access the volume
            docker run --rm -v "$volume_full_name:/volume" -v "$temp_dir:/backup" \
                alpine tar -czf "/backup/$volume.tar.gz" -C /volume .
            
            backed_up_volumes+=("$volume")
        else
            log_warning "Volume $volume_full_name not found"
        fi
    done
    
    if [ ${#backed_up_volumes[@]} -gt 0 ]; then
        # Combine all volume backups
        tar -czf "$volumes_backup" -C "$temp_dir" .
        
        local backup_size=$(du -h "$volumes_backup" | cut -f1)
        log_success "Volumes backup completed: $backup_size"
    else
        log_warning "No volumes found to backup"
    fi
    
    # Cleanup temporary directory
    rm -rf "$temp_dir"
}

# Create backup metadata
create_metadata() {
    log_info "Creating backup metadata..."
    
    local metadata_file="$BACKUP_PATH/metadata.json"
    
    cat > "$metadata_file" << EOF
{
    "backup_name": "$BACKUP_NAME",
    "timestamp": "$(date -Iseconds)",
    "hostname": "$(hostname)",
    "system_info": {
        "os": "$(uname -s)",
        "kernel": "$(uname -r)",
        "architecture": "$(uname -m)"
    },
    "git_info": {
        "commit": "$(git -C "$PROJECT_ROOT" rev-parse HEAD 2>/dev/null || echo 'unknown')",
        "branch": "$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
        "tag": "$(git -C "$PROJECT_ROOT" describe --tags --exact-match 2>/dev/null || echo 'none')"
    },
    "docker_info": {
        "version": "$(docker --version)",
        "compose_version": "$(docker-compose --version)"
    },
    "services_status": $(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps --format json 2>/dev/null || echo '[]'),
    "backup_size": "$(du -sh "$BACKUP_PATH" | cut -f1)",
    "retention_policy": {
        "retention_days": $RETENTION_DAYS,
        "cleanup_enabled": true
    }
}
EOF
    
    log_success "Metadata created"
}

# Verify backup integrity
verify_backup() {
    log_info "Verifying backup integrity..."
    
    local verification_passed=true
    
    # Check database backup
    if [ -f "$BACKUP_PATH/database.sql.gz" ]; then
        if gzip -t "$BACKUP_PATH/database.sql.gz"; then
            log_success "Database backup integrity verified"
        else
            log_error "Database backup is corrupted"
            verification_passed=false
        fi
    fi
    
    # Check uploads backup
    if [ -f "$BACKUP_PATH/uploads.tar.gz" ]; then
        if tar -tzf "$BACKUP_PATH/uploads.tar.gz" >/dev/null; then
            log_success "Uploads backup integrity verified"
        else
            log_error "Uploads backup is corrupted"
            verification_passed=false
        fi
    fi
    
    # Check configuration backup
    if [ -f "$BACKUP_PATH/configuration.tar.gz" ]; then
        if tar -tzf "$BACKUP_PATH/configuration.tar.gz" >/dev/null; then
            log_success "Configuration backup integrity verified"
        else
            log_error "Configuration backup is corrupted"
            verification_passed=false
        fi
    fi
    
    # Check volumes backup
    if [ -f "$BACKUP_PATH/volumes.tar.gz" ]; then
        if tar -tzf "$BACKUP_PATH/volumes.tar.gz" >/dev/null; then
            log_success "Volumes backup integrity verified"
        else
            log_error "Volumes backup is corrupted"
            verification_passed=false
        fi
    fi
    
    if [ "$verification_passed" = true ]; then
        log_success "All backup files verified successfully"
        return 0
    else
        log_error "Backup verification failed"
        return 1
    fi
}

# Upload to S3 (optional)
upload_to_s3() {
    if [ -z "$S3_BUCKET" ]; then
        log_info "S3 upload skipped (no bucket configured)"
        return 0
    fi
    
    log_info "Uploading backup to S3: s3://$S3_BUCKET/"
    
    if command -v aws &> /dev/null; then
        local s3_path="s3://$S3_BUCKET/cattle-management-backups/$BACKUP_NAME.tar.gz"
        
        # Create compressed archive of entire backup
        local archive_path="$BACKUP_DIR/$BACKUP_NAME.tar.gz"
        tar -czf "$archive_path" -C "$BACKUP_DIR" "$BACKUP_NAME"
        
        # Upload to S3
        if aws s3 cp "$archive_path" "$s3_path" --region "$AWS_REGION"; then
            log_success "Backup uploaded to S3: $s3_path"
            
            # Remove local archive after successful upload
            rm -f "$archive_path"
        else
            log_error "Failed to upload backup to S3"
            return 1
        fi
    else
        log_error "AWS CLI not found, cannot upload to S3"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    
    # Local cleanup
    if [ -d "$BACKUP_DIR" ]; then
        while IFS= read -r -d '' backup_path; do
            rm -rf "$backup_path"
            deleted_count=$((deleted_count + 1))
            log_info "Deleted old backup: $(basename "$backup_path")"
        done < <(find "$BACKUP_DIR" -maxdepth 1 -type d -name "cattle-backup-*" -mtime +$RETENTION_DAYS -print0)
    fi
    
    # S3 cleanup
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        
        aws s3 ls "s3://$S3_BUCKET/cattle-management-backups/" --region "$AWS_REGION" | \
        while read -r line; do
            local file_date=$(echo "$line" | awk '{print $1}')
            local file_name=$(echo "$line" | awk '{print $4}')
            
            if [[ "$file_date" < "$cutoff_date" ]]; then
                aws s3 rm "s3://$S3_BUCKET/cattle-management-backups/$file_name" --region "$AWS_REGION"
                log_info "Deleted old S3 backup: $file_name"
                deleted_count=$((deleted_count + 1))
            fi
        done
    fi
    
    if [ $deleted_count -gt 0 ]; then
        log_success "Cleaned up $deleted_count old backup(s)"
    else
        log_info "No old backups to clean up"
    fi
}

# Generate backup report
generate_report() {
    log_info "Generating backup report..."
    
    local report_file="$BACKUP_PATH/backup-report.txt"
    local total_size=$(du -sh "$BACKUP_PATH" | cut -f1)
    
    cat > "$report_file" << EOF
# Backup Report

**Backup Name:** $BACKUP_NAME
**Date:** $(date -Iseconds)
**Total Size:** $total_size
**Location:** $BACKUP_PATH

## Backup Contents

$(ls -la "$BACKUP_PATH")

## System Information

**Hostname:** $(hostname)
**OS:** $(uname -s) $(uname -r)
**Docker Version:** $(docker --version)
**Available Disk Space:** $(df -h "$BACKUP_DIR" | awk 'NR==2 {print $4}')

## Services Status at Backup Time

$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps 2>/dev/null || echo "Could not retrieve service status")

## Backup Verification

$(if verify_backup >/dev/null 2>&1; then echo "✅ All backup files verified successfully"; else echo "❌ Backup verification failed"; fi)

---
Generated by automated backup script
EOF
    
    log_success "Backup report generated: $report_file"
}

# Send notification (optional)
send_notification() {
    local status="$1"
    local message="$2"
    
    # Webhook notification (if configured)
    if [ -n "${BACKUP_WEBHOOK_URL:-}" ]; then
        curl -X POST "$BACKUP_WEBHOOK_URL" \
             -H "Content-Type: application/json" \
             -d "{\"status\":\"$status\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\"}" \
             >/dev/null 2>&1 || log_warning "Failed to send webhook notification"
    fi
    
    # Email notification (if configured)
    if [ -n "${BACKUP_EMAIL:-}" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "Cattle Management Backup - $status" "$BACKUP_EMAIL" || \
            log_warning "Failed to send email notification"
    fi
}

# Main backup function
main() {
    log_info "Starting backup process..."
    log_info "Backup name: $BACKUP_NAME"
    log_info "Backup path: $BACKUP_PATH"
    
    local start_time=$(date +%s)
    
    # Create backup directory
    create_backup_directory
    
    # Perform backups
    backup_database
    backup_uploads
    backup_configuration
    backup_volumes
    
    # Create metadata and verify
    create_metadata
    verify_backup
    
    # Upload to S3 if configured
    upload_to_s3
    
    # Generate report
    generate_report
    
    # Cleanup old backups
    cleanup_old_backups
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local total_size=$(du -sh "$BACKUP_PATH" | cut -f1)
    
    local success_message="Backup completed successfully in ${duration}s (Size: $total_size)"
    log_success "$success_message"
    
    # Send success notification
    send_notification "SUCCESS" "$success_message"
    
    # Output backup information
    echo ""
    echo "📋 Backup Summary:"
    echo "   Name: $BACKUP_NAME"
    echo "   Size: $total_size"
    echo "   Duration: ${duration}s"
    echo "   Location: $BACKUP_PATH"
    if [ -n "$S3_BUCKET" ]; then
        echo "   S3 Location: s3://$S3_BUCKET/cattle-management-backups/$BACKUP_NAME.tar.gz"
    fi
}

# Error handling
error_handler() {
    local exit_code=$?
    local error_message="Backup failed with exit code $exit_code"
    
    log_error "$error_message"
    send_notification "FAILED" "$error_message"
    
    # Cleanup incomplete backup
    if [ -d "$BACKUP_PATH" ]; then
        log_info "Cleaning up incomplete backup..."
        rm -rf "$BACKUP_PATH"
    fi
    
    exit $exit_code
}

trap error_handler ERR

# Handle command line arguments
case "${1:-backup}" in
    "backup")
        main
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "verify")
        if [ -n "${2:-}" ] && [ -d "$BACKUP_DIR/$2" ]; then
            BACKUP_PATH="$BACKUP_DIR/$2"
            verify_backup
        else
            log_error "Please specify a valid backup name"
            exit 1
        fi
        ;;
    "list")
        log_info "Available backups:"
        ls -la "$BACKUP_DIR" | grep "cattle-backup-" || log_info "No backups found"
        ;;
    *)
        echo "Usage: $0 {backup|cleanup|verify <backup_name>|list}"
        exit 1
        ;;
esac