#!/usr/bin/env bash
# سكربت نشر تطبيق التواصل مع سنترال فرشوط على الخادم
# الاستخدام: bash deploy.sh
set -e

APP_NAME="telecom-app"
PROJECT_DIR="/root/telecom-fault-report"

echo "==> الانتقال إلى مجلد المشروع"
cd "$PROJECT_DIR"

echo "==> إلغاء أي تعديلات يدوية على الكود ومزامنة آخر إصدار"
git fetch origin
git reset --hard origin/master

echo "==> تثبيت الاعتماديات"
npm install --omit=dev || npm install

echo "==> التحقق من ملف .env"
if [ ! -f .env ]; then
  echo "تحذير: ملف .env غير موجود — أنشئه ويحتوي APPS_SCRIPT_URL"
fi

echo "==> إعادة تشغيل التطبيق عبر PM2 (PORT=4000)"
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  PORT=4000 pm2 restart "$APP_NAME" --update-env
else
  PORT=4000 pm2 start dev/server.js --name "$APP_NAME"
fi
pm2 save

echo ""
echo "==> آخر إصدار:"
git log -1 --oneline
echo ""
echo "==> تأكيد مسار الملفات الثابتة (يجب أن يظهر publicDir مع index:false):"
grep -n "express.static" dev/server.js
echo ""
echo "==> حالة PM2:"
pm2 list
echo ""
echo "==> الاستماع على المنفذ 4000:"
ss -ltnp | grep 4000 || echo "تحذير: لا أحد يستمع على 4000!"
echo ""
echo "تم النشر. افتح: https://telecom.hanylabs.com/"
