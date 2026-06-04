#!/usr/bin/env bash
# Deploy frontend Teknik: tarik kode terbaru, build, sajikan via PM2 (static SPA).
# Jalankan di server dari dalam folder repo: ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

echo "==> git pull"
git pull --ff-only

echo "==> npm ci + build"
npm ci
npm run build   # .env.production → VITE_API_BASE kosong (pakai /api relatif)

echo "==> (re)serve PM2: teknik-fe (port 8090)"
# pm2 serve menyajikan folder dist sebagai SPA; rebuild langsung kebaca dari disk.
pm2 restart teknik-fe 2>/dev/null || pm2 serve dist 8090 --spa --name teknik-fe
pm2 save
echo "==> selesai. status:"
pm2 status teknik-fe
