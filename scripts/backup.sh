#!/bin/bash
# 数据库自动备份脚本
# 定时任务: 0 3 * * * /workspace/scripts/backup.sh

set -e

BACKUP_DIR="/workspace/backups"
DATE=$(date +%Y%m%d)
TIME=$(date +%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}_${TIME}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========== 开始备份 =========="

if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
fi

if [ -n "$DB_PASSWORD" ]; then
    export MYSQL_PWD="$DB_PASSWORD"
fi

mysqldump -h "${DB_HOST:-localhost}" \
    -u "${DB_USER:-root}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    "${DB_NAME:-xiayi_restaurant}" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "备份成功: $BACKUP_FILE (${FILE_SIZE})"
    
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +${BACKUP_RETENTION_DAYS:-30} -delete
    log "清理旧备份完成"
    
    if [ -n "$CLOUD_STORAGE_URL" ]; then
        log "开始上传到云存储..."
        curl -T "$BACKUP_FILE" "$CLOUD_STORAGE_URL/backup_${DATE}_${TIME}.sql.gz"
        if [ $? -eq 0 ]; then
            log "云存储上传成功"
        else
            log "警告: 云存储上传失败"
        fi
    fi
else
    log "错误: 备份失败"
    exit 1
fi

log "========== 备份完成 =========="
