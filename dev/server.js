const express = require('express');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(function (line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  });
}

loadEnv();

const api = require('./api');

const app = express();
const PORT = process.env.PORT || 3000;
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const indexPath = path.join(rootDir, 'apps-script', 'Index.html');
const centralPath = path.join(rootDir, 'apps-script', 'Central.html');

app.use(express.json());

app.get('/config.js', function (_req, res) {
  res.set('Cache-Control', 'no-store');
  res.type('application/javascript').send(
    "window.APP_CONFIG = { appsScriptUrl: '' };\n"
  );
});

app.use(express.static(publicDir));

function serveHtml(filePath, res) {
  res.type('html').send(fs.readFileSync(filePath, 'utf8'));
}

app.get('/', function (_req, res) {
  serveHtml(indexPath, res);
});

app.get('/central', function (_req, res) {
  serveHtml(centralPath, res);
});

async function handleApi(fnName, req, res) {
  try {
    const fn = api[fnName];
    if (!fn) {
      res.status(404).json({ error: 'الدالة غير موجودة' });
      return;
    }

    const result = await fn(req.body || {});
    res.json(result);
  } catch (err) {
    res.json({ error: err.message || 'حدث خطأ' });
  }
}

const apiRoutes = [
  'submitReport',
  'getStatus',
  'submitRating',
  'reopenTicket',
  'submitNewComplaint',
  'changeCustomerMobile',
  'centralListTickets',
  'centralGetTicket',
  'centralUpdateTicket',
  'centralAddRepairedLandline'
];

apiRoutes.forEach(function (route) {
  app.post('/api/' + route, function (req, res) {
    handleApi(route, req, res);
  });
});

app.listen(PORT, async function () {
  const mode = api.getBackendMode();
  console.log('تطبيق العميل:  http://localhost:' + PORT);
  console.log('لوحة السنترال: http://localhost:' + PORT + '/central');

  if (mode === 'apps-script') {
    console.log('الحفظ عبر: Apps Script Web App');
    console.log('الرابط:', process.env.APPS_SCRIPT_URL);
    return;
  }

  if (mode === 'google-sheets') {
    try {
      const sheets = require('./sheets');
      const title = await sheets.resolveSheetTitle();
      console.log('الحفظ مباشرة في Google Sheet:', title);
      console.log('الشيت: https://docs.google.com/spreadsheets/d/1T5agEVNB6lLNkkiqjaXSufoE3gF59bH1_wLhWC0h_0A/edit?gid=80364727');
    } catch (err) {
      console.error('تعذر الاتصال بالشيت:', err.message);
    }
    return;
  }

  console.error('');
  console.error('⚠️  لم يتم ضبط الاتصال بـ Google Sheet بعد.');
  console.error('   الخيار 1 (الأسهل): انشر Apps Script ثم عيّن APPS_SCRIPT_URL');
  console.error('   الخيار 2: ضع credentials.json في جذر المشروع');
  console.error('');
});
