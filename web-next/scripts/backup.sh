#!/usr/bin/env sh
# Sao lưu Postgres (VPS, chạy cạnh docker-compose.prod.yml). Mỗi lần tạo 1 file nén, giữ lại KEEP bản mới nhất.
#   ./scripts/backup.sh                      # dùng mặc định
#   BACKUP_DIR=/srv/backup KEEP=30 ./scripts/backup.sh
# Crontab (3 giờ sáng mỗi ngày):
#   0 3 * * * cd /opt/lingyu/web-next && ./scripts/backup.sh >> /var/log/lingyu-backup.log 2>&1
set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP="${KEEP:-14}"
COMPOSE="${COMPOSE:-docker compose -f docker-compose.prod.yml}"
DB_USER="${POSTGRES_USER:-lingyu}"
DB_NAME="${POSTGRES_DB:-lingyu}"

mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/lingyu-$(date +%Y%m%d-%H%M%S).dump"

# Định dạng custom (-Fc): nén sẵn, khôi phục bằng pg_restore. Ảnh nằm trong DB nên cũng được sao lưu.
$COMPOSE exec -T postgres pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc --no-owner > "$FILE.tmp"
mv "$FILE.tmp" "$FILE"
echo "$(date '+%F %T') Đã sao lưu: $FILE ($(du -h "$FILE" | cut -f1))"

# Xoá bản cũ, chỉ giữ KEEP bản mới nhất.
ls -1t "$BACKUP_DIR"/lingyu-*.dump 2>/dev/null | tail -n +"$((KEEP + 1))" | while read -r old; do
  rm -f "$old" && echo "Đã xoá bản cũ: $old"
done
