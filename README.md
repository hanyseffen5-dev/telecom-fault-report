# التواصل مع مسؤولي سنترال فرشوط

تطبيق ويب يتيح للعملاء **التواصل المباشر عبر محادثة (دردشة)** مع مسؤولي سنترال فرشوط، بدلاً من الاتصال التليفوني أو الواتساب أو الحضور إلى السنترال. مع لوحة للسنترال للرد على العملاء وتقييم الخدمة. البيانات تُحفظ في Google Sheet.

> ملاحظة: تم تحويل التطبيق من «إبلاغ أعطال» إلى «قناة تواصل/محادثة» لأن استقبال بلاغات الأعطال عبر الصفحة محظور وفق تعليمات المصرية للاتصالات.

## المميزات

- **صفحة ترحيب** بحركات ورسم متحرك تعرّف بخدمة التواصل مع سنترال فرشوط
- **محادثة مباشرة**: العميل يدخل برقم الأرضي + الموبايل ويرسل رسالته، ويرد عليه السنترال
- **تحديث تلقائي** كل 20 ثانية لعرض ردود السنترال
- **تغيير رقم الموبايل** المرتبط بالمحادثة
- **تقييم الخدمة** كنافذة منبثقة تُفتح عند إنهاء السنترال للمحادثة
- **لوحة السنترال** لاستقبال المحادثات والرد عليها على هيئة شات

## كيف تعمل المحادثة

1. يدخل العميل برقم التليفون الأرضي + رقم الموبايل (للتعرّف عليه وحفظ محادثته)
2. يكتب رسالته وتُحفظ في عمود «إشعار السنترال» مع بادئة `العميل:`
3. يرد السنترال من اللوحة، ويُحفظ الرد مع بادئة `السنترال:`
4. عند إنهاء المحادثة من السنترال (حالة «تم الحل») تُفتح للعميل نافذة تقييم تلقائياً

> لم تتغيّر بنية الـ Google Sheet — يُعاد استخدام نفس الأعمدة (سجل المحادثة في عمود الإشعارات).

## Google Sheet

الشيت المرتبط:  
https://docs.google.com/spreadsheets/d/1T5agEVNB6lLNkkiqjaXSufoE3gF59bH1_wLhWC0h_0A/edit?gid=80364727

---

## البنية (Frontend + API)

لإخفاء شريط «This application was created by a Google Apps Script user»، الواجهة تُستضاف خارج Apps Script:

```
┌─────────────────────┐      POST JSON       ┌──────────────────────┐
│  الواجهة (Frontend) │  ─────────────────►  │  Apps Script (API)   │
│  Render / GitHub    │  { fn, payload }   │  doPost → Google Sheet │
│  Pages / محلي       │  ◄─────────────────  │                      │
└─────────────────────┘      JSON            └──────────────────────┘
```

| المكوّن | الموقع | الدور |
|---------|--------|-------|
| `apps-script/Code.gs` | Google Apps Script | API فقط (JSON) — لا HTML |
| `apps-script/Index.html` | استضافة خارجية | واجهة العميل |
| `apps-script/Central.html` | استضافة خارجية | لوحة السنترال |
| `public/api-bridge.js` | مع الواجهة | يستبدل `google.script.run` بـ `fetch` |

---

## 1) نشر الـ API (Apps Script) — مرة واحدة

### أ) نسخ الكود

1. افتح [Google Sheet](https://docs.google.com/spreadsheets/d/1T5agEVNB6lLNkkiqjaXSufoE3gF59bH1_wLhWC0h_0A/edit?gid=80364727)
2. **Extensions → Apps Script**
3. انسخ محتوى `apps-script/Code.gs` (ملف HTML **غير مطلوب** في Apps Script بعد الفصل)

### ب) إعداد الشيت

1. اختر الدالة `setupSheet` واضغط **Run**
2. وافق على الصلاحيات

### ج) النشر كـ Web App (API)

1. **Deploy → New deployment → Web app**
2. **Execute as**: Me
3. **Who has access**: Anyone
4. **Deploy** وانسخ الرابط (ينتهي بـ `/exec`)

> عند فتح الرابط في المتصفح ترى JSON مثل `{ "service": "telecom-fault-report-api", ... }` — هذا طبيعي.

---

## 2) نشر الواجهة (Frontend)

### الخيار أ — Render (موصى به)

1. اربط المستودع بـ [Render](https://render.com)
2. استخدم `render.yaml` الموجود في المشروع (أو Web Service يدوي)
3. عيّن متغير البيئة:
   ```
   APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
   ```
4. بعد النشر:
   - صفحة العميل: `https://your-app.onrender.com/`
   - لوحة السنترال: `https://your-app.onrender.com/central`

### الخيار ب — GitHub Pages (استضافة ثابتة)

```bash
npm run build:static
```

1. عدّل `public/config.js` وضع رابط Web App:
   ```javascript
   window.APP_CONFIG = {
     appsScriptUrl: 'https://script.google.com/macros/s/XXXX/exec'
   };
   ```
2. ارفع محتويات مجلد `public/` إلى GitHub Pages
3. افتح `index.html` للعملاء و `central.html` للسنترال

### الخيار ج — التطوير المحلي

```bash
cp .env.example .env
# عدّل APPS_SCRIPT_URL في .env
npm install
npm run dev
```

- العميل: http://localhost:3000
- السنترال: http://localhost:3000/central

---

## هيكل المشروع

```
telecom-fault-report/
├── apps-script/
│   ├── Code.gs           ← API (Apps Script)
│   ├── Index.html        ← واجهة العميل (مصدر)
│   └── Central.html      ← لوحة السنترال (مصدر)
├── public/
│   ├── api-bridge.js     ← جسر fetch ↔ API
│   ├── config.js         ← رابط API (للاستضافة الثابتة)
│   └── config.example.js
├── dev/
│   ├── server.js         ← خادم Node للتطوير و Render
│   └── api.js            ← وسيط إلى Apps Script
├── scripts/
│   └── build-static.js   ← نسخ HTML إلى public/
└── render.yaml           ← إعداد Render
```

---

## عمل السنترال

1. افتح لوحة السنترال (`/central`) وأدخل رمز الدخول
2. اختر محادثة من القائمة — يظهر سجل الرسائل على هيئة شات
3. اكتب **ردّك على العميل** — يظهر له فور تحديث صفحته
4. عند الانتهاء: اختر **إنهاء المحادثة (وفتح التقييم)** = الحالة `تم الحل`

**مثال رد:**  
`تحية طيبة، تم استلام رسالتكم وجاري مراجعتها.`

---

## ملاحظات

- المحادثة تتطلب **رقم الأرضي + الموبايل** معاً للتعرّف على العميل
- نافذة التقييم تُفتح للعميل تلقائياً عندما يُنهي السنترال المحادثة (`تم الحل`)
- إذا أرسل العميل رسالة جديدة بعد الإنهاء، تُعاد فتح المحادثة تلقائياً
- بعد أي تعديل على `Code.gs`: **Deploy → Manage deployments → Edit → New version**
