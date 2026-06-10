const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1T5agEVNB6lLNkkiqjaXSufoE3gF59bH1_wLhWC0h_0A';
const SHEET_GID = 80364727;
const SHEET_NAME = 'ابلاغ عميل';

const COL = {
  DATE: 1,
  LANDLINE: 2,
  REASON: 3,
  MOBILE: 4,
  STATUS: 5,
  NOTIFICATION: 6,
  LAST_UPDATE: 7,
  RATING_FAULT: 8,
  RATING_TECH: 9,
  COMMENT: 10
};

const HEADERS = [
  'تاريخ الإبلاغ',
  'رقم التليفون الأرضي',
  'سبب الإبلاغ',
  'رقم الموبايل',
  'حالة العطل',
  'إشعار السنترال',
  'تاريخ آخر تحديث',
  'تقييم إزالة العطل',
  'تقييم الفني',
  'تعليق العميل'
];

const STATUS_NEW = 'جديد';
const STATUS_IN_PROGRESS = 'قيد المعالجة';
const STATUS_RESOLVED = 'تم الحل';
const STATUS_REOPENED = 'إعادة فتح';
const DEFAULT_CENTRAL_PIN = '1234';

const CENTRAL_STATUSES = [
  STATUS_NEW,
  STATUS_IN_PROGRESS,
  STATUS_REOPENED,
  STATUS_RESOLVED
];

const RESOLVED_STATUSES = [
  'تم الحل',
  'تم الاصلاح',
  'تم الإصلاح'
];

function isResolvedStatus(status) {
  const normalized = String(status || '').trim().replace(/\s+/g, ' ');
  return RESOLVED_STATUSES.includes(normalized);
}

function isCustomerReopenMessage(text) {
  const t = String(text || '');
  return t.indexOf('العميل:') === 0 && (
    t.indexOf('إعادة فتح') !== -1 ||
    t.indexOf('المشكلة مازالت موجودة') !== -1
  );
}

function isCentralResolutionMessage(text) {
  const t = String(text || '');
  if (t.indexOf('إصلاح العطل') !== -1 || t.indexOf('تم إصلاح') !== -1) return true;
  if (t.indexOf('السنترال:') === 0 && t.indexOf('تم الحل') !== -1) return true;
  return false;
}

function canCentralSendNotification(status, notifications) {
  const s = String(status || '');
  if (s === STATUS_NEW || s === STATUS_IN_PROGRESS || s === STATUS_REOPENED) return true;
  if (!isResolvedStatus(s)) return true;

  const notifs = notifications || [];
  let lastResolutionIdx = -1;
  let lastReopenIdx = -1;
  notifs.forEach((n, i) => {
    const text = n.text || '';
    if (isCentralResolutionMessage(text)) lastResolutionIdx = i;
    if (isCustomerReopenMessage(text)) lastReopenIdx = i;
  });
  return lastReopenIdx > lastResolutionIdx;
}

function getTicketArchive(landline, mobile, excludeRow) {
  return getAllRows().then((data) => {
    const targetLandline = normalizeLandlineForMatch(landline);
    const targetMobile = normalizeMobileForMatch(mobile);
    const archive = [];

    for (let i = 1; i < data.length; i++) {
      const rowNumber = i + 1;
      if (rowNumber === excludeRow) continue;
      const row = data[i];
      if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;
      if (normalizeLandlineForMatch(row[COL.LANDLINE - 1]) !== targetLandline) continue;
      if (normalizeMobileForMatch(row[COL.MOBILE - 1]) !== targetMobile) continue;

      const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate(row[COL.LAST_UPDATE - 1]) : '';
      const notifications = parseNotifications(row[COL.NOTIFICATION - 1], lastUpdate);
      archive.push({
        row: rowNumber,
        date: row[COL.DATE - 1] ? formatDate(row[COL.DATE - 1]) : '',
        lastUpdate,
        reason: String(row[COL.REASON - 1] || ''),
        status: String(row[COL.STATUS - 1] || STATUS_NEW),
        notifications,
        lastNotification: notifications.length ? notifications[notifications.length - 1].text : ''
      });
    }
    archive.sort((a, b) => b.row - a.row);
    return archive;
  });
}

const REASONS = [
  'انقطاع الخدمة',
  'ضعف كفاءة الخط',
  'طلب صيانة للخط'
];

let sheetsClient = null;
let authClient = null;
let sheetTitleCache = null;

function findCredentialsPath() {
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(__dirname, '..', 'credentials.json'),
    path.join(__dirname, 'credentials.json')
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function getAuth() {
  if (authClient) {
    return authClient;
  }

  const credentialsPath = findCredentialsPath();
  if (!credentialsPath) {
    throw new Error(
      'لم يتم العثور على credentials.json. ضع ملف حساب الخدمة في جذر المشروع أو عيّن APPS_SCRIPT_URL.'
    );
  }

  authClient = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return authClient;
}

function getSheets() {
  if (!sheetsClient) {
    sheetsClient = google.sheets({ version: 'v4', auth: getAuth() });
  }
  return sheetsClient;
}

async function resolveSheetTitle() {
  if (sheetTitleCache) {
    return sheetTitleCache;
  }

  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const tabs = meta.data.sheets || [];

  const byName = tabs.find((tab) => tab.properties.title === SHEET_NAME);
  if (byName) {
    sheetTitleCache = byName.properties.title;
    return sheetTitleCache;
  }

  const byGid = tabs.find((tab) => tab.properties.sheetId === SHEET_GID);
  if (byGid) {
    sheetTitleCache = byGid.properties.title;
    return sheetTitleCache;
  }

  throw new Error('لم يتم العثور على صفحة الشيت «ابلاغ عميل»');
}

function colLetter(index) {
  return String.fromCharCode(64 + index);
}

function digitsOnly(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function normalizePhone(phone) {
  let p = digitsOnly(phone);
  if (p.startsWith('20') && p.length > 10) {
    p = p.substring(2);
  }
  if (p.length > 0 && p.charAt(0) !== '0') {
    if (/^1\d{9}$/.test(p)) {
      p = '0' + p;
    } else if (/^[2-9]\d{7,9}$/.test(p)) {
      p = '0' + p;
    }
  }
  return p;
}

function normalizeLandlineForMatch(phone) {
  let p = normalizePhone(phone);
  if (p.startsWith('0')) {
    p = p.substring(1);
  }
  return p;
}

function normalizeMobileForMatch(phone) {
  return normalizePhone(phone);
}

function validateLandline(phone) {
  const p = normalizePhone(phone);
  if (!/^0[2-9]\d{7,9}$/.test(p)) {
    throw new Error('رقم التليفون الأرضي غير صحيح (مثال: 0223456789)');
  }
  return p;
}

function validateMobile(phone) {
  const p = normalizePhone(phone);
  if (!/^01[0125]\d{8}$/.test(p)) {
    throw new Error('رقم الموبايل غير صحيح (مثال: 01012345678)');
  }
  return p;
}

function formatDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(d);

  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

function nowFormatted() {
  return formatDate(new Date());
}

const NOTIF_TIMESTAMP_RE = /^\[(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\]\s*(.+)$/;

function formatNotificationLine(text, when) {
  return `[${formatDate(when || new Date())}] ${String(text || '').trim()}`;
}

function appendNotificationLine(existing, text, when) {
  const line = formatNotificationLine(text, when);
  const current = String(existing || '').trim();
  return current ? `${current}\n${line}` : line;
}

function parseNotifications(raw, fallbackDate) {
  const text = String(raw || '').trim();
  if (!text) return [];

  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const match = line.match(NOTIF_TIMESTAMP_RE);
    if (match) {
      return { date: match[1], text: match[2] };
    }
    return { date: fallbackDate || '', text: line };
  });
}

function rowToObject(row) {
  const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate(row[COL.LAST_UPDATE - 1]) : '';
  const notifications = parseNotifications(row[COL.NOTIFICATION - 1], lastUpdate);

  return {
    date: row[COL.DATE - 1] ? formatDate(row[COL.DATE - 1]) : '',
    landline: String(row[COL.LANDLINE - 1] || ''),
    reason: String(row[COL.REASON - 1] || ''),
    mobile: String(row[COL.MOBILE - 1] || ''),
    status: String(row[COL.STATUS - 1] || STATUS_NEW),
    notifications,
    notification: notifications.length ? notifications[notifications.length - 1].text : '',
    lastUpdate,
    ratingFault: row[COL.RATING_FAULT - 1] || '',
    ratingTech: row[COL.RATING_TECH - 1] || '',
    comment: String(row[COL.COMMENT - 1] || ''),
    isResolved: isResolvedStatus(row[COL.STATUS - 1]),
    canRate: isResolvedStatus(row[COL.STATUS - 1]) &&
      !row[COL.RATING_FAULT - 1] && !row[COL.RATING_TECH - 1],
    canReopen: isResolvedStatus(row[COL.STATUS - 1]) &&
      !row[COL.RATING_FAULT - 1] && !row[COL.RATING_TECH - 1],
    alreadyRated: !!(row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1]),
    canOpenNewComplaint: isResolvedStatus(row[COL.STATUS - 1]) &&
      !!(row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1]),
    canSendNotification: canCentralSendNotification(
      row[COL.STATUS - 1],
      parseNotifications(row[COL.NOTIFICATION - 1], lastUpdate)
    )
  };
}

async function getAllRows() {
  const title = await resolveSheetTitle();
  const sheets = getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title}'!A:J`
  });
  return response.data.values || [];
}

async function ensureHeaders() {
  const title = await resolveSheetTitle();
  const sheets = getSheets();
  const rows = await getAllRows();

  if (rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${title}'!A1:J1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] }
    });
    return;
  }

  const firstRow = rows[0];
  const needsHeaders = HEADERS.every((_header, index) => !firstRow[index]);
  if (needsHeaders) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${title}'!A1:J1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] }
    });
  }
}

function findLatestRow(data, landline, mobile) {
  const targetLandline = normalizeLandlineForMatch(landline);
  const targetMobile = normalizeMobileForMatch(mobile);

  for (let i = data.length - 1; i >= 1; i--) {
    const rowLandline = normalizeLandlineForMatch(data[i][COL.LANDLINE - 1]);
    const rowMobile = normalizeMobileForMatch(data[i][COL.MOBILE - 1]);
    if (rowLandline === targetLandline && rowMobile === targetMobile) {
      return { rowNumber: i + 1, index: i, row: data[i] };
    }
  }
  return { rowNumber: -1, index: -1, row: null };
}

async function submitReport(payload) {
  await ensureHeaders();

  const landline = validateLandline(payload.landline);
  const mobile = validateMobile(payload.mobile);
  const reason = String(payload.reason || '').trim();

  if (!REASONS.includes(reason)) {
    throw new Error('يرجى اختيار سبب الإبلاغ');
  }

  const title = await resolveSheetTitle();
  const sheets = getSheets();
  const now = nowFormatted();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title}'!A:J`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[now, landline, reason, mobile, STATUS_NEW, '', now, '', '', '']]
    }
  });

  return {
    success: true,
    message: 'تم إرسال البلاغ بنجاح. يمكنك متابعة التحديثات من قسم المتابعة.',
    landline,
    mobile
  };
}

async function getStatus(landline, mobile) {
  await ensureHeaders();

  const normalizedLandline = validateLandline(landline);
  const normalizedMobile = validateMobile(mobile);
  const data = await getAllRows();
  const result = findLatestRow(data, normalizedLandline, normalizedMobile);

  if (result.rowNumber === -1) {
    throw new Error('لم يتم العثور على بلاغ بهذا الرقم. تأكد من رقم التليفون الأرضي ورقم الموبايل.');
  }

  return rowToObject(result.row);
}

async function submitRating(payload) {
  await ensureHeaders();

  const landline = validateLandline(payload.landline);
  const mobile = validateMobile(payload.mobile);
  const ratingFault = Number(payload.ratingFault);
  const ratingTech = Number(payload.ratingTech);
  const comment = String(payload.comment || '').trim();

  if (!ratingFault || ratingFault < 1 || ratingFault > 5) {
    throw new Error('يرجى تقييم إزالة العطل من 1 إلى 5');
  }
  if (!ratingTech || ratingTech < 1 || ratingTech > 5) {
    throw new Error('يرجى تقييم الفني من 1 إلى 5');
  }

  const data = await getAllRows();
  const result = findLatestRow(data, landline, mobile);
  if (result.rowNumber === -1) {
    throw new Error('لم يتم العثور على البلاغ');
  }

  const status = String(result.row[COL.STATUS - 1]);
  if (!isResolvedStatus(status)) {
    throw new Error('التقييم متاح فقط بعد إغلاق العطل من السنترال (تم الحل)');
  }
  if (result.row[COL.RATING_FAULT - 1] || result.row[COL.RATING_TECH - 1]) {
    throw new Error('تم إرسال التقييم مسبقاً لهذا البلاغ');
  }

  const title = await resolveSheetTitle();
  const sheets = getSheets();
  const now = nowFormatted();
  const row = result.rowNumber;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `'${title}'!${colLetter(COL.RATING_FAULT)}${row}`, values: [[ratingFault]] },
        { range: `'${title}'!${colLetter(COL.RATING_TECH)}${row}`, values: [[ratingTech]] },
        { range: `'${title}'!${colLetter(COL.COMMENT)}${row}`, values: [[comment]] },
        { range: `'${title}'!${colLetter(COL.LAST_UPDATE)}${row}`, values: [[now]] }
      ]
    }
  });

  return {
    success: true,
    message: 'شكراً لتقييمك. تم حفظ التقييم بنجاح.'
  };
}

async function reopenTicket(payload) {
  await ensureHeaders();

  const landline = validateLandline(payload.landline);
  const mobile = validateMobile(payload.mobile);
  const note = String(payload.note || '').trim();

  const data = await getAllRows();
  const result = findLatestRow(data, landline, mobile);
  if (result.rowNumber === -1) {
    throw new Error('لم يتم العثور على البلاغ');
  }

  const status = String(result.row[COL.STATUS - 1]);
  if (!isResolvedStatus(status)) {
    throw new Error('إعادة الفتح متاحة فقط بعد تسجيل السنترال لـ «تم الحل»');
  }
  if (result.row[COL.RATING_FAULT - 1] || result.row[COL.RATING_TECH - 1]) {
    throw new Error('لا يمكن إعادة فتح بلاغ تم تقييمه');
  }

  const now = new Date();
  let customerMessage = 'العميل: المشكلة مازالت موجودة — طلب إعادة فتح البلاغ';
  if (note) {
    customerMessage += ` — ${note}`;
  }

  const updatedNotifications = appendNotificationLine(
    result.row[COL.NOTIFICATION - 1],
    customerMessage,
    now
  );

  const title = await resolveSheetTitle();
  const sheets = getSheets();
  const row = result.rowNumber;
  const nowFormattedValue = nowFormatted();

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `'${title}'!${colLetter(COL.STATUS)}${row}`, values: [[STATUS_REOPENED]] },
        { range: `'${title}'!${colLetter(COL.NOTIFICATION)}${row}`, values: [[updatedNotifications]] },
        { range: `'${title}'!${colLetter(COL.LAST_UPDATE)}${row}`, values: [[nowFormattedValue]] }
      ]
    }
  });

  return {
    success: true,
    message: 'تم إعادة فتح البلاغ وإبلاغ السنترال. سيتم متابعة المشكلة مرة أخرى.'
  };
}

async function submitNewComplaint(payload) {
  await ensureHeaders();

  const landline = validateLandline(payload.landline);
  const mobile = validateMobile(payload.mobile);
  const reason = String(payload.reason || '').trim();

  if (!REASONS.includes(reason)) {
    throw new Error('يرجى اختيار سبب الشكوى');
  }

  const data = await getAllRows();
  const result = findLatestRow(data, landline, mobile);
  if (result.rowNumber === -1) {
    throw new Error('لم يتم العثور على بلاغ سابق بهذا الرقم');
  }

  const status = String(result.row[COL.STATUS - 1]);
  if (!isResolvedStatus(status)) {
    throw new Error('يمكن فتح شكوى جديدة فقط بعد إغلاق البلاغ السابق (تم الحل)');
  }
  if (!result.row[COL.RATING_FAULT - 1] && !result.row[COL.RATING_TECH - 1]) {
    throw new Error('يرجى تقييم البلاغ السابق قبل فتح شكوى جديدة');
  }

  const title = await resolveSheetTitle();
  const sheets = getSheets();
  const now = nowFormatted();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title}'!A:J`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[now, landline, reason, mobile, STATUS_NEW, '', now, '', '', '']]
    }
  });

  return {
    success: true,
    message: 'تم فتح شكوى جديدة على نفس الخط. سيتم متابعتها من السنترال.',
    landline,
    mobile
  };
}

function getCentralPin() {
  return process.env.CENTRAL_PIN || DEFAULT_CENTRAL_PIN;
}

function verifyCentralAuth(pin) {
  if (String(pin || '') !== getCentralPin()) {
    throw new Error('رمز الدخول غير صحيح');
  }
}

function ticketMatchesFilter(status, filter) {
  if (!filter || filter === 'all') return true;
  if (filter === 'resolved') return isResolvedStatus(status);
  return status === filter;
}

function ticketMatchesSearch(row, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const landline = normalizeLandlineForMatch(row[COL.LANDLINE - 1]);
  const mobile = normalizeMobileForMatch(row[COL.MOBILE - 1]);
  const reason = String(row[COL.REASON - 1] || '').toLowerCase();
  return landline.includes(q) || mobile.includes(q) || reason.includes(q) ||
    String(row[COL.LANDLINE - 1] || '').includes(q) ||
    String(row[COL.MOBILE - 1] || '').includes(q);
}

function rowToCentralObject(row, rowNumber) {
  const base = rowToObject(row);
  return { ...base, row: rowNumber };
}

async function centralListTickets(payload) {
  verifyCentralAuth(payload.pin);
  await ensureHeaders();

  const filter = String(payload.filter || 'all');
  const search = String(payload.search || '').trim().toLowerCase();
  const data = await getAllRows();
  const tickets = [];
  const counts = {
    all: 0,
    [STATUS_NEW]: 0,
    [STATUS_IN_PROGRESS]: 0,
    [STATUS_REOPENED]: 0,
    resolved: 0
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;

    const status = String(row[COL.STATUS - 1] || STATUS_NEW);
    const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate(row[COL.LAST_UPDATE - 1]) : '';
    const notifications = parseNotifications(row[COL.NOTIFICATION - 1], lastUpdate);

    counts.all++;
    if (counts[status] !== undefined) counts[status]++;
    if (isResolvedStatus(status)) counts.resolved++;

    if (!ticketMatchesFilter(status, filter)) continue;
    if (!ticketMatchesSearch(row, search)) continue;

    tickets.push({
      row: i + 1,
      date: row[COL.DATE - 1] ? formatDate(row[COL.DATE - 1]) : '',
      landline: String(row[COL.LANDLINE - 1] || ''),
      mobile: String(row[COL.MOBILE - 1] || ''),
      reason: String(row[COL.REASON - 1] || ''),
      status,
      lastUpdate,
      lastNotification: notifications.length ? notifications[notifications.length - 1].text : '',
      alreadyRated: !!(row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1])
    });
  }

  tickets.sort((a, b) => b.row - a.row);
  return { tickets, counts };
}

async function centralGetTicket(payload) {
  verifyCentralAuth(payload.pin);
  await ensureHeaders();

  const rowNumber = Number(payload.row);
  const data = await getAllRows();
  if (rowNumber < 2 || rowNumber > data.length) {
    throw new Error('رقم البلاغ غير صحيح');
  }
  const ticket = rowToCentralObject(data[rowNumber - 1], rowNumber);
  ticket.archive = await getTicketArchive(ticket.landline, ticket.mobile, rowNumber);
  return ticket;
}

async function centralUpdateTicket(payload) {
  verifyCentralAuth(payload.pin);
  await ensureHeaders();

  const rowNumber = Number(payload.row);
  const status = String(payload.status || '').trim();
  const message = String(payload.message || '').trim();
  const data = await getAllRows();

  if (rowNumber < 2 || rowNumber > data.length) {
    throw new Error('رقم البلاغ غير صحيح');
  }

  const row = data[rowNumber - 1];
  const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate(row[COL.LAST_UPDATE - 1]) : '';
  const currentNotifications = parseNotifications(row[COL.NOTIFICATION - 1], lastUpdate);
  const currentStatus = String(row[COL.STATUS - 1] || STATUS_NEW);

  if (!canCentralSendNotification(currentStatus, currentNotifications)) {
    throw new Error('لا يمكن إرسال إشعار — البلاغ مغلق (تم الحل). ينتظر إعادة فتح من العميل.');
  }

  const now = new Date();
  const title = await resolveSheetTitle();
  const sheets = getSheets();
  const updates = [];

  if (status) {
    if (!CENTRAL_STATUSES.includes(status) && !isResolvedStatus(status)) {
      throw new Error('حالة العطل غير صحيحة');
    }
    updates.push({
      range: `'${title}'!${colLetter(COL.STATUS)}${rowNumber}`,
      values: [[status]]
    });
  }

  if (message) {
    const updated = appendNotificationLine(
      row[COL.NOTIFICATION - 1],
      'السنترال: ' + message,
      now
    );
    updates.push({
      range: `'${title}'!${colLetter(COL.NOTIFICATION)}${rowNumber}`,
      values: [[updated]]
    });
  }

  if (!updates.length) {
    throw new Error('لا يوجد شيء لحفظه');
  }

  updates.push({
    range: `'${title}'!${colLetter(COL.LAST_UPDATE)}${rowNumber}`,
    values: [[nowFormatted()]]
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { valueInputOption: 'USER_ENTERED', data: updates }
  });

  const freshData = await getAllRows();
  const ticket = rowToCentralObject(freshData[rowNumber - 1], rowNumber);
  ticket.archive = await getTicketArchive(ticket.landline, ticket.mobile, rowNumber);
  return {
    success: true,
    message: 'تم حفظ التحديث وإرساله للعميل',
    ticket
  };
}

function hasCredentials() {
  return Boolean(findCredentialsPath());
}

module.exports = {
  submitReport,
  getStatus,
  submitRating,
  reopenTicket,
  submitNewComplaint,
  centralListTickets,
  centralGetTicket,
  centralUpdateTicket,
  hasCredentials,
  resolveSheetTitle
};
