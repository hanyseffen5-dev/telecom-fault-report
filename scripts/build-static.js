const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');

const copies = [
  ['apps-script/Index.html', 'public/index.html'],
  ['apps-script/Central.html', 'public/central.html']
];

copies.forEach(function ([src, dest]) {
  const from = path.join(root, src);
  const to = path.join(root, dest);
  fs.copyFileSync(from, to);
  console.log('نسخ:', dest);
});

const appsScriptUrl = (process.env.APPS_SCRIPT_URL || '').trim();
const configJs = [
  'window.APP_CONFIG = {',
  "  appsScriptUrl: '" + appsScriptUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'",
  '};',
  ''
].join('\n');

fs.writeFileSync(path.join(publicDir, 'config.js'), configJs, 'utf8');
console.log('إنشاء: public/config.js');

console.log('');
console.log('جاهز للنشر الثابت من مجلد public/');
if (!appsScriptUrl) {
  console.log('تنبيه: APPS_SCRIPT_URL غير مضبوط — عيّنه في GitHub Secrets أو public/config.js');
}
