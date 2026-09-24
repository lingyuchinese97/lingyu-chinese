#!/bin/sh
# Chạy migration trước, rồi mới khởi động app (spec mục 3.3).
set -e
node /app/migrate.mjs
exec node /app/server.js
