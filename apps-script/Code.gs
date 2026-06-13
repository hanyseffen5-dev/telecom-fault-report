/**
 * تطبيق إبلاغ أعطال الخط الأرضي
 * Google Apps Script — ربط بـ Google Sheet
 */

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
  COMMENT: 10,
  DEVICE_FP: 11,
  RATING_DEVICE_FP: 12
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
  'تعليق العميل',
  'بصمة الجهاز',
  'بصمة جهاز التقييم'
];

const STATUS_NEW = 'جديد';
const STATUS_IN_PROGRESS = 'قيد المعالجة';
const STATUS_RESOLVED = 'تم الحل';
const STATUS_REOPENED = 'إعادة فتح';

const RESOLVED_STATUSES = [
  'تم الحل',
  'تم الاصلاح',
  'تم الإصلاح'
];

const REASONS = [
  'انقطاع الخدمة',
  'ضعف كفاءة الخط',
  'طلب صيانة للخط'
];

const DEFAULT_CENTRAL_PIN = '1234';
const CENTRAL_STATUSES = [
  STATUS_NEW,
  STATUS_IN_PROGRESS,
  STATUS_REOPENED,
  STATUS_RESOLVED
];

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    service: 'telecom-fault-report-api',
    version: 1,
    status: 'ok',
    usage: 'POST JSON: { "fn": "<functionName>", "payload": { ... } }'
  })).setMimeType(ContentService.MimeType.JSON);
}

function getCentralPin_() {
  return PropertiesService.getScriptProperties().getProperty('CENTRAL_PIN') || DEFAULT_CENTRAL_PIN;
}

function verifyCentralAuth_(pin) {
  if (String(pin || '') !== getCentralPin_()) {
    throw new Error('رمز الدخول غير صحيح');
  }
}

/**
 * تشغيل مرة واحدة لتغيير رمز دخول السنترال
 */
function setCentralPin(pin) {
  const value = String(pin || '').trim();
  if (value.length < 4) {
    throw new Error('الرمز يجب أن يكون 4 أحرف على الأقل');
  }
  PropertiesService.getScriptProperties().setProperty('CENTRAL_PIN', value);
  Logger.log('تم تحديث رمز السنترال');
}

function getSpreadsheet_() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active && active.getId() === SPREADSHEET_ID) {
      return active;
    }
  } catch (err) {
    // المشروع قد يكون standalone وليس مربوطاً بالشيت
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function isTargetSheet_(sheet) {
  if (!sheet) return false;
  if (sheet.getName() === SHEET_NAME) return true;
  return sheet.getSheetId() === SHEET_GID;
}

function getSheet_() {
  const ss = getSpreadsheet_();
  const byName = ss.getSheetByName(SHEET_NAME);
  if (byName) {
    return byName;
  }
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === SHEET_GID) {
      return sheets[i];
    }
  }
  throw new Error('لم يتم العثور على صفحة الشيت «' + SHEET_NAME + '»');
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const fn = body.fn;
    const payload = body.payload;
    let result;

    if (fn === 'submitReport') {
      result = submitReport(payload);
    } else if (fn === 'getStatus') {
      result = getStatus(payload);
    } else if (fn === 'submitRating') {
      result = submitRating(payload);
    } else if (fn === 'reopenTicket') {
      result = reopenTicket(payload);
    } else if (fn === 'submitNewComplaint') {
      result = submitNewComplaint(payload);
    } else if (fn === 'changeCustomerMobile') {
      result = changeCustomerMobile(payload);
    } else if (fn === 'centralListTickets') {
      result = centralListTickets(payload);
    } else if (fn === 'centralGetTicket') {
      result = centralGetTicket(payload);
    } else if (fn === 'centralUpdateTicket') {
      result = centralUpdateTicket(payload);
    } else if (fn === 'centralAddRepairedLandline') {
      result = centralAddRepairedLandline(payload);
    } else if (fn === 'centralListRatedTickets') {
      result = centralListRatedTickets(payload);
    } else {
      throw new Error('دالة غير معروفة');
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message || 'حدث خطأ' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureHeaders_() {
  const sheet = getSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    return;
  }
  const width = Math.max(sheet.getLastColumn(), HEADERS.length);
  const firstRow = sheet.getRange(1, 1, 1, width).getValues()[0];
  const needsHeaders = HEADERS.every(function (_header, index) {
    return !firstRow[index];
  });
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    return;
  }
  migrateHeaders_(sheet, firstRow);
}

function migrateHeaders_(sheet, firstRow) {
  let changed = false;
  for (let i = 0; i < HEADERS.length; i++) {
    if (!firstRow[i] && HEADERS[i]) {
      sheet.getRange(1, i + 1).setValue(HEADERS[i]);
      changed = true;
    }
  }
  if (changed) {
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
}

function normalizeDeviceFp_(fp) {
  const value = String(fp || '').trim().toLowerCase();
  if (!/^[0-9a-f]{8,16}$/.test(value)) {
    throw new Error('بصمة الجهاز غير صالحة. أعد تحميل الصفحة وحاول مرة أخرى.');
  }
  return value;
}

function validateDeviceFp_(fp, required) {
  const value = String(fp || '').trim();
  if (!value) {
    if (required) {
      throw new Error('تعذّر التحقق من الجهاز. أعد تحميل الصفحة وحاول مرة أخرى.');
    }
    return '';
  }
  return normalizeDeviceFp_(fp);
}

function getStoredDeviceFp_(row) {
  return String(row[COL.DEVICE_FP - 1] || '').trim().toLowerCase();
}

function getRatingDeviceFp_(row) {
  return String(row[COL.RATING_DEVICE_FP - 1] || '').trim().toLowerCase();
}

function saveDeviceFp_(sheet, rowNumber, deviceFp) {
  const fp = validateDeviceFp_(deviceFp, true);
  sheet.getRange(rowNumber, COL.DEVICE_FP).setValue(fp);
  return fp;
}

function bindOrVerifyDeviceFp_(sheet, rowNumber, rowData, deviceFp) {
  const incoming = validateDeviceFp_(deviceFp, true);
  const stored = getStoredDeviceFp_(rowData);

  if (!stored) {
    saveDeviceFp_(sheet, rowNumber, incoming);
    return {
      deviceTrusted: true,
      deviceFpBound: true,
      deviceFp: incoming
    };
  }

  if (stored !== incoming) {
    return {
      deviceTrusted: false,
      deviceFpBound: false,
      deviceFp: stored
    };
  }

  return {
    deviceTrusted: true,
    deviceFpBound: false,
    deviceFp: stored
  };
}

function verifyDeviceFpOnly_(rowData, deviceFp) {
  const incoming = validateDeviceFp_(deviceFp, true);
  const stored = getStoredDeviceFp_(rowData);
  if (!stored) {
    throw new Error('لم يتم ربط جهاز بهذا البلاغ بعد. ادخل من الجهاز الذي سجّل رقم الموبايل أولاً.');
  }
  if (stored !== incoming) {
    throw new Error('لا يمكن إتمام هذا الإجراء — الجهاز الحالي لا يطابق الجهاز المسجّل عند تسجيل الموبايل.');
  }
  return incoming;
}

function digitsOnly_(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function normalizePhone_(phone) {
  let p = digitsOnly_(phone);
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

/** للمقارنة فقط — يتجاهل الصفر في بداية الخط الأرضي */
function normalizeLandlineForMatch_(phone) {
  let p = normalizePhone_(phone);
  if (p.startsWith('0')) {
    p = p.substring(1);
  }
  return p;
}

/** للمقارنة فقط — يوحّد صيغة الموبايل */
function normalizeMobileForMatch_(phone) {
  return normalizePhone_(phone);
}

function validateLandline_(phone) {
  const p = normalizePhone_(phone);
  if (!/^0[2-9]\d{7,9}$/.test(p)) {
    throw new Error('رقم التليفون الأرضي غير صحيح (مثال: 09624******)');
  }
  return p;
}

function validateMobile_(phone) {
  const p = normalizePhone_(phone);
  if (!/^01[0125]\d{8}$/.test(p)) {
    throw new Error('رقم الموبايل غير صحيح (مثال: 01*********)');
  }
  return p;
}

function isEmptyMobile_(value) {
  return !normalizeMobileForMatch_(value);
}

function findLatestByLandline_(landline) {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const targetLandline = normalizeLandlineForMatch_(landline);

  for (let i = data.length - 1; i >= 1; i--) {
    const rowLandline = normalizeLandlineForMatch_(data[i][COL.LANDLINE - 1]);
    if (rowLandline !== targetLandline) continue;
    return {
      sheet: sheet,
      data: data,
      row: i + 1,
      index: i
    };
  }

  return { sheet: sheet, data: data, row: -1, index: -1 };
}

function findLatestRowForCustomer_(landline, mobile) {
  const targetMobile = normalizeMobileForMatch_(mobile);
  const latest = findLatestByLandline_(landline);

  if (latest.row === -1) {
    return {
      sheet: latest.sheet,
      data: latest.data,
      row: -1,
      index: -1,
      needsMobileRegistration: false
    };
  }

  const storedMobile = normalizeMobileForMatch_(latest.data[latest.index][COL.MOBILE - 1]);

  if (isEmptyMobile_(latest.data[latest.index][COL.MOBILE - 1])) {
    return {
      sheet: latest.sheet,
      data: latest.data,
      row: latest.row,
      index: latest.index,
      needsMobileRegistration: true
    };
  }

  if (storedMobile === targetMobile) {
    return {
      sheet: latest.sheet,
      data: latest.data,
      row: latest.row,
      index: latest.index,
      needsMobileRegistration: false
    };
  }

  return {
    sheet: latest.sheet,
    data: latest.data,
    row: -1,
    index: -1,
    needsMobileRegistration: false
  };
}

function getCustomerAccessError_(landline, mobile) {
  const latest = findLatestByLandline_(landline);

  if (latest.row === -1) {
    return 'لم يتم العثور على بلاغ بهذا الرقم الأرضي. تأكد من رقم التليفون الأرضي.';
  }

  const storedMobile = normalizeMobileForMatch_(latest.data[latest.index][COL.MOBILE - 1]);
  const targetMobile = normalizeMobileForMatch_(mobile);

  if (storedMobile && storedMobile !== targetMobile) {
    return 'رقم الموبايل المُدخل مختلف عن الرقم المسجّل مسبقاً لهذا الخط. استخدم الرقم الصحيح أو «تغيير رقم الموبايل» أدناه.';
  }

  return 'لم يتم العثور على بلاغ بهذا الرقم. تأكد من البيانات المدخلة.';
}

function registerCustomerMobile_(sheet, rowNumber, mobile, deviceFp) {
  const validated = validateMobile_(mobile);
  const now = new Date();
  sheet.getRange(rowNumber, COL.MOBILE).setValue(validated);
  sheet.getRange(rowNumber, COL.LAST_UPDATE).setValue(now);
  if (deviceFp) {
    const fp = saveDeviceFp_(sheet, rowNumber, deviceFp);
    return { mobile: validated, deviceFp: fp };
  }
  return { mobile: validated, deviceFp: '' };
}

function resolveCustomerTicket_(landline, mobile, deviceFp) {
  const normalizedLandline = validateLandline_(landline);
  const normalizedMobile = validateMobile_(mobile);
  let result = findLatestRowForCustomer_(normalizedLandline, normalizedMobile);

  if (result.row === -1) {
    throw new Error(getCustomerAccessError_(normalizedLandline, normalizedMobile));
  }

  if (result.needsMobileRegistration) {
    const registered = registerCustomerMobile_(result.sheet, result.row, normalizedMobile, deviceFp);
    result.data[result.index][COL.MOBILE - 1] = registered.mobile;
    if (registered.deviceFp) {
      result.data[result.index][COL.DEVICE_FP - 1] = registered.deviceFp;
    }
    result.mobileJustRegistered = true;
    result.deviceFpBound = !!registered.deviceFp;
  }

  return result;
}

const NOTIF_TIMESTAMP_RE_ = /^\[(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\]\s*(.+)$/;

function parseNotifications_(raw, fallbackDate) {
  const text = String(raw || '').trim();
  if (!text) return [];

  return text.split(/\r?\n/).map(function (line) {
    return line.trim();
  }).filter(Boolean).map(function (line) {
    const match = line.match(NOTIF_TIMESTAMP_RE_);
    if (match) {
      return { date: match[1], text: match[2] };
    }
    return { date: fallbackDate || '', text: line };
  });
}

function isResolvedStatus_(status) {
  const normalized = String(status || '').trim().replace(/\s+/g, ' ');
  return RESOLVED_STATUSES.indexOf(normalized) !== -1;
}

function isCustomerReopenMessage_(text) {
  const t = String(text || '');
  return t.indexOf('العميل:') === 0 && (
    t.indexOf('إعادة فتح') !== -1 ||
    t.indexOf('المشكلة مازالت موجودة') !== -1
  );
}

function isCentralResolutionMessage_(text) {
  const t = String(text || '');
  if (t.indexOf('إصلاح العطل') !== -1 || t.indexOf('تم إصلاح') !== -1) return true;
  if (t.indexOf('السنترال:') === 0 && t.indexOf('تم الحل') !== -1) return true;
  return false;
}

function canCentralSendNotification_(status, notifications) {
  const s = String(status || '');

  if (s === STATUS_NEW || s === STATUS_IN_PROGRESS || s === STATUS_REOPENED) {
    return true;
  }

  if (!isResolvedStatus_(s)) {
    return true;
  }

  const notifs = notifications || [];
  let lastResolutionIdx = -1;
  let lastReopenIdx = -1;

  for (let i = 0; i < notifs.length; i++) {
    const text = notifs[i].text || '';
    if (isCentralResolutionMessage_(text)) {
      lastResolutionIdx = i;
    }
    if (isCustomerReopenMessage_(text)) {
      lastReopenIdx = i;
    }
  }

  return lastReopenIdx > lastResolutionIdx;
}

function getLineKey_(landline) {
  return normalizeLandlineForMatch_(landline);
}

/** أحدث صف لكل خط أرضي — للعرض في لوحة السنترال فقط */
function getLatestRowByLine_(data) {
  const latest = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;
    latest[getLineKey_(row[COL.LANDLINE - 1])] = i + 1;
  }
  return latest;
}

function isLatestTicketForLine_(rowNumber, row, latestByLine) {
  const key = getLineKey_(row[COL.LANDLINE - 1]);
  return latestByLine[key] === rowNumber;
}

function getTicketArchive_(landline, mobile, excludeRow) {
  const data = getSheet_().getDataRange().getValues();
  const targetLandline = normalizeLandlineForMatch_(landline);
  const archive = [];

  for (let i = 1; i < data.length; i++) {
    const rowNumber = i + 1;
    if (rowNumber === excludeRow) continue;

    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;

    const rowLandline = normalizeLandlineForMatch_(row[COL.LANDLINE - 1]);
    if (rowLandline !== targetLandline) continue;

    const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate_(row[COL.LAST_UPDATE - 1]) : '';
    const notifications = parseNotifications_(row[COL.NOTIFICATION - 1], lastUpdate);

    archive.push({
      row: rowNumber,
      date: row[COL.DATE - 1] ? formatDate_(row[COL.DATE - 1]) : '',
      lastUpdate: lastUpdate,
      reason: String(row[COL.REASON - 1] || ''),
      status: String(row[COL.STATUS - 1] || STATUS_NEW),
      notifications: notifications,
      lastNotification: notifications.length ? notifications[notifications.length - 1].text : ''
    });
  }

  archive.sort(function (a, b) {
    return b.row - a.row;
  });

  return archive;
}

function formatNotificationLine_(text, when) {
  return '[' + formatDate_(when || new Date()) + '] ' + String(text || '').trim();
}

function appendNotificationLine_(existing, text, when) {
  const line = formatNotificationLine_(text, when);
  const current = String(existing || '').trim();
  return current ? current + '\n' + line : line;
}

function normalizeNotificationCell_(value) {
  const lines = String(value || '').split(/\r?\n/);
  let changed = false;
  const formatted = [];

  lines.forEach(function (line) {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (NOTIF_TIMESTAMP_RE_.test(trimmed)) {
      formatted.push(trimmed);
      return;
    }
    changed = true;
    formatted.push(formatNotificationLine_(trimmed));
  });

  return { value: formatted.join('\n'), changed: changed };
}

function rowToObject_(row, rowNumber) {
  const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate_(row[COL.LAST_UPDATE - 1]) : '';
  const notifications = parseNotifications_(row[COL.NOTIFICATION - 1], lastUpdate);
  const status = String(row[COL.STATUS - 1] || STATUS_NEW);

  return {
    row: rowNumber || 0,
    date: row[COL.DATE - 1] ? formatDate_(row[COL.DATE - 1]) : '',
    landline: String(row[COL.LANDLINE - 1] || ''),
    reason: String(row[COL.REASON - 1] || ''),
    mobile: String(row[COL.MOBILE - 1] || ''),
    status: status,
    notifications: notifications,
    notification: notifications.length ? notifications[notifications.length - 1].text : '',
    lastUpdate: lastUpdate,
    ratingFault: row[COL.RATING_FAULT - 1] || '',
    ratingTech: row[COL.RATING_TECH - 1] || '',
    comment: String(row[COL.COMMENT - 1] || ''),
    deviceFp: getStoredDeviceFp_(row),
    ratingDeviceFp: getRatingDeviceFp_(row),
    hasDeviceFp: !!getStoredDeviceFp_(row),
    deviceFpMismatch: !!(getStoredDeviceFp_(row) && getRatingDeviceFp_(row) &&
      getStoredDeviceFp_(row) !== getRatingDeviceFp_(row)),
    isResolved: isResolvedStatus_(status),
    ratingEligible: isRatingEligibleRow_(row),
    canRate: isResolvedStatus_(status) &&
      isRatingEligibleRow_(row) &&
      !row[COL.RATING_FAULT - 1] && !row[COL.RATING_TECH - 1],
    canReopen: isResolvedStatus_(status) &&
      isRatingEligibleRow_(row) &&
      !row[COL.RATING_FAULT - 1] && !row[COL.RATING_TECH - 1],
    alreadyRated: !!(row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1]),
    canOpenNewComplaint: isResolvedStatus_(status) &&
      !!(row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1]),
    canSendNotification: canCentralSendNotification_(status, notifications),
    mobileRegistered: !isEmptyMobile_(row[COL.MOBILE - 1])
  };
}

function ticketMatchesFilter_(status, filter) {
  if (!filter || filter === 'all') return true;
  if (filter === 'active') return !isResolvedStatus_(status);
  if (filter === 'resolved') return isResolvedStatus_(status);
  return status === filter;
}

function ticketMatchesSearch_(row, query) {
  if (!query) return true;

  const qRaw = String(query).trim().toLowerCase();
  const reason = String(row[COL.REASON - 1] || '').toLowerCase();
  if (reason.indexOf(qRaw) !== -1) return true;

  const landline = normalizeLandlineForMatch_(row[COL.LANDLINE - 1]);
  const mobile = normalizeMobileForMatch_(row[COL.MOBILE - 1]);
  const qLandline = normalizeLandlineForMatch_(query);
  const qMobile = normalizeMobileForMatch_(query);

  if (qLandline && landline.indexOf(qLandline) !== -1) return true;
  if (qMobile && mobile.indexOf(qMobile) !== -1) return true;

  const qDigits = digitsOnly_(query).replace(/^0+/, '');
  if (qDigits) {
    const landDigits = digitsOnly_(row[COL.LANDLINE - 1]).replace(/^0+/, '');
    const mobDigits = digitsOnly_(row[COL.MOBILE - 1]).replace(/^0+/, '');
    if (landDigits.indexOf(qDigits) !== -1) return true;
    if (mobDigits.indexOf(qDigits) !== -1) return true;
  }

  const rawLandline = String(row[COL.LANDLINE - 1] || '').toLowerCase();
  const rawMobile = String(row[COL.MOBILE - 1] || '').toLowerCase();
  return rawLandline.indexOf(qRaw) !== -1 || rawMobile.indexOf(qRaw) !== -1;
}

function getTicketRow_(rowNumber) {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (rowNumber < 2 || rowNumber > lastRow) {
    throw new Error('رقم البلاغ غير صحيح');
  }
  const row = sheet.getRange(rowNumber, 1, 1, HEADERS.length).getValues()[0];
  return { sheet: sheet, rowNumber: rowNumber, row: row };
}

function isTicketRated_(row) {
  return !!(row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1]);
}

function countRatedTickets_(data) {
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;
    const status = String(row[COL.STATUS - 1] || STATUS_NEW);
    if (!isResolvedStatus_(status) || !isTicketRated_(row)) continue;
    if (!isRatingEligibleRow_(row)) continue;
    count++;
  }
  return count;
}

function centralListRatedTickets(payload) {
  verifyCentralAuth_(payload.pin);
  ensureHeaders_();

  const search = String(payload.search || '').trim().toLowerCase();
  const data = getSheet_().getDataRange().getValues();
  const tickets = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;

    const status = String(row[COL.STATUS - 1] || STATUS_NEW);
    if (!isResolvedStatus_(status) || !isTicketRated_(row)) continue;
    if (!isRatingEligibleRow_(row)) continue;
    if (!ticketMatchesSearch_(row, search)) continue;

    const rowNumber = i + 1;
    const landline = String(row[COL.LANDLINE - 1] || '');
    const mobile = String(row[COL.MOBILE - 1] || '');
    const archive = getTicketArchive_(landline, mobile, rowNumber);

    tickets.push({
      row: rowNumber,
      date: row[COL.DATE - 1] ? formatDate_(row[COL.DATE - 1]) : '',
      landline: landline,
      mobile: mobile,
      reason: String(row[COL.REASON - 1] || ''),
      status: status,
      lastUpdate: row[COL.LAST_UPDATE - 1] ? formatDate_(row[COL.LAST_UPDATE - 1]) : '',
      ratingFault: row[COL.RATING_FAULT - 1] || '',
      ratingTech: row[COL.RATING_TECH - 1] || '',
      comment: String(row[COL.COMMENT - 1] || ''),
      archiveCount: archive.length,
      archive: archive
    });
  }

  tickets.sort(function (a, b) {
    return b.row - a.row;
  });

  return { tickets: tickets, total: tickets.length };
}

function centralListTickets(payload) {
  verifyCentralAuth_(payload.pin);
  ensureHeaders_();

  const filter = String(payload.filter || 'active');
  const search = String(payload.search || '').trim().toLowerCase();
  const data = getSheet_().getDataRange().getValues();
  const latestByLine = getLatestRowByLine_(data);
  const tickets = [];
  const counts = {
    all: 0,
    active: 0,
    [STATUS_NEW]: 0,
    [STATUS_IN_PROGRESS]: 0,
    [STATUS_REOPENED]: 0,
    resolved: 0,
    rated: countRatedTickets_(data)
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;

    const rowNumber = i + 1;
    if (!isLatestTicketForLine_(rowNumber, row, latestByLine)) continue;

    const status = String(row[COL.STATUS - 1] || STATUS_NEW);
    const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate_(row[COL.LAST_UPDATE - 1]) : '';
    const notifications = parseNotifications_(row[COL.NOTIFICATION - 1], lastUpdate);

    counts.all++;
    if (!isResolvedStatus_(status)) counts.active++;
    if (counts[status] !== undefined) counts[status]++;
    if (isResolvedStatus_(status)) counts.resolved++;

    if (!ticketMatchesFilter_(status, filter)) continue;
    if (!ticketMatchesSearch_(row, search)) continue;

    tickets.push({
      row: rowNumber,
      date: row[COL.DATE - 1] ? formatDate_(row[COL.DATE - 1]) : '',
      landline: String(row[COL.LANDLINE - 1] || ''),
      mobile: String(row[COL.MOBILE - 1] || ''),
      reason: String(row[COL.REASON - 1] || ''),
      status: status,
      lastUpdate: lastUpdate,
      lastNotification: notifications.length ? notifications[notifications.length - 1].text : '',
      alreadyRated: !!(row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1])
    });
  }

  tickets.sort(function (a, b) {
    return b.row - a.row;
  });

  return { tickets: tickets, counts: counts };
}

function centralGetTicket(payload) {
  verifyCentralAuth_(payload.pin);
  ensureHeaders_();

  const rowNumber = Number(payload.row);
  const result = getTicketRow_(rowNumber);
  const ticket = rowToObject_(result.row, result.rowNumber);
  ticket.archive = getTicketArchive_(ticket.landline, ticket.mobile, rowNumber);
  return ticket;
}

function centralUpdateTicket(payload) {
  verifyCentralAuth_(payload.pin);
  ensureHeaders_();

  const rowNumber = Number(payload.row);
  const status = String(payload.status || '').trim();
  const message = String(payload.message || '').trim();
  const result = getTicketRow_(rowNumber);
  const currentStatus = String(result.row[COL.STATUS - 1] || STATUS_NEW);
  const lastUpdate = result.row[COL.LAST_UPDATE - 1] ? formatDate_(result.row[COL.LAST_UPDATE - 1]) : '';
  const currentNotifications = parseNotifications_(result.row[COL.NOTIFICATION - 1], lastUpdate);
  const now = new Date();

  if (!canCentralSendNotification_(currentStatus, currentNotifications)) {
    throw new Error('لا يمكن إرسال إشعار — البلاغ مغلق (تم الحل). ينتظر إعادة فتح من العميل.');
  }

  if (status) {
    if (CENTRAL_STATUSES.indexOf(status) === -1 && !isResolvedStatus_(status)) {
      throw new Error('حالة العطل غير صحيحة');
    }
    result.sheet.getRange(rowNumber, COL.STATUS).setValue(status);
  }

  if (message) {
    const prefix = 'السنترال: ';
    const existing = result.row[COL.NOTIFICATION - 1];
    const updated = appendNotificationLine_(existing, prefix + message, now);
    result.sheet.getRange(rowNumber, COL.NOTIFICATION).setValue(updated);
  }

  if (!status && !message) {
    throw new Error('لا يوجد شيء لحفظه');
  }

  result.sheet.getRange(rowNumber, COL.LAST_UPDATE).setValue(now);

  const updatedTicket = rowToObject_(
    result.sheet.getRange(rowNumber, 1, 1, HEADERS.length).getValues()[0],
    rowNumber
  );
  updatedTicket.archive = getTicketArchive_(updatedTicket.landline, updatedTicket.mobile, rowNumber);

  return {
    success: true,
    message: 'تم حفظ التحديث وإرساله للعميل',
    ticket: updatedTicket
  };
}

function formatDate_(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
}

function parseDateInput_(value, label) {
  const str = String(value || '').trim();
  if (!str) {
    throw new Error('يرجى اختيار ' + label);
  }

  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 10, 0, 0);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  throw new Error(label + ' غير صالح');
}

const CENTRAL_REPAIRED_REASON = 'عطل';
const RATING_ENABLED_MARKER = '[تقييم متاح]';
const CENTRAL_REPAIRED_NOTIFICATION = RATING_ENABLED_MARKER + ' تم إصلاح العطل بنجاح';

function isRatingEligibleRow_(row) {
  const notification = String(row[COL.NOTIFICATION - 1] || '');
  return notification.indexOf(RATING_ENABLED_MARKER) !== -1;
}

function centralAddRepairedLandline(payload) {
  verifyCentralAuth_(payload.pin);
  ensureHeaders_();

  const landline = validateLandline_(payload.landline);
  const complaintDate = parseDateInput_(payload.complaintDate, 'تاريخ الشكوى');
  const lastUpdateDate = parseDateInput_(payload.lastUpdateDate, 'تاريخ آخر تحديث');

  if (lastUpdateDate.getTime() < complaintDate.getTime()) {
    throw new Error('تاريخ آخر تحديث يجب أن يكون بعد أو يساوي تاريخ الشكوى');
  }

  const latest = findLatestByLandline_(landline);
  if (latest.row !== -1) {
    const status = String(latest.data[latest.index][COL.STATUS - 1] || '');
    if (!isResolvedStatus_(status)) {
      throw new Error('يوجد بلاغ مفتوح لهذا الخط. أغلقه أولاً أو حدّثه من القائمة.');
    }
    if (isRatingEligibleRow_(latest.data[latest.index])) {
      const rated = latest.data[latest.index][COL.RATING_FAULT - 1] ||
        latest.data[latest.index][COL.RATING_TECH - 1];
      if (!rated) {
        throw new Error('يوجد بلاغ سابق بانتظار تقييم العميل لهذا الخط.');
      }
    }
  }

  const sheet = getSheet_();
  const notification = appendNotificationLine_('', CENTRAL_REPAIRED_NOTIFICATION, lastUpdateDate);

  sheet.appendRow([
    complaintDate,
    landline,
    CENTRAL_REPAIRED_REASON,
    '',
    STATUS_RESOLVED,
    notification,
    lastUpdateDate,
    '',
    '',
    '',
    '',
    ''
  ]);

  return {
    success: true,
    message: 'تمت إضافة الخط المُصلح. يمكن للعميل البحث بالرقم الأرضي وتسجيل الموبايل للتقييم.',
    landline: landline
  };
}

function findLatestRow_(landline, mobile) {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  let foundRow = -1;
  let foundIndex = -1;

  const targetLandline = normalizeLandlineForMatch_(landline);
  const targetMobile = normalizeMobileForMatch_(mobile);

  for (let i = data.length - 1; i >= 1; i--) {
    const rowLandline = normalizeLandlineForMatch_(data[i][COL.LANDLINE - 1]);
    const rowMobile = normalizeMobileForMatch_(data[i][COL.MOBILE - 1]);
    if (rowLandline === targetLandline && rowMobile === targetMobile) {
      foundRow = i + 1;
      foundIndex = i;
      break;
    }
  }

  return { sheet: sheet, data: data, row: foundRow, index: foundIndex };
}

function submitReport(payload) {
  ensureHeaders_();

  const landline = validateLandline_(payload.landline);
  const mobile = validateMobile_(payload.mobile);
  const deviceFp = validateDeviceFp_(payload.deviceFp, true);
  const reason = String(payload.reason || '').trim();

  if (REASONS.indexOf(reason) === -1) {
    throw new Error('يرجى اختيار سبب الإبلاغ');
  }

  const sheet = getSheet_();
  const now = new Date();

  sheet.appendRow([
    now,
    landline,
    reason,
    mobile,
    STATUS_NEW,
    '',
    now,
    '',
    '',
    '',
    deviceFp,
    ''
  ]);

  return {
    success: true,
    message: 'تم إرسال البلاغ بنجاح. يمكنك متابعة التحديثات من قسم المتابعة.',
    landline: landline,
    mobile: mobile
  };
}

function getStatus(payload) {
  ensureHeaders_();

  const landline = payload && payload.landline;
  const mobile = payload && payload.mobile;
  const deviceFp = payload && payload.deviceFp;
  const result = resolveCustomerTicket_(landline, mobile, deviceFp);
  const ticket = rowToObject_(result.data[result.index], result.row);
  ticket.mobileJustRegistered = !!result.mobileJustRegistered;

  if (deviceFp) {
    const deviceInfo = bindOrVerifyDeviceFp_(
      result.sheet,
      result.row,
      result.data[result.index],
      deviceFp
    );
    ticket.deviceTrusted = deviceInfo.deviceTrusted;
    ticket.deviceFpBound = !!result.deviceFpBound || deviceInfo.deviceFpBound;
    ticket.deviceFp = deviceInfo.deviceFp || ticket.deviceFp;
  } else {
    ticket.deviceTrusted = !ticket.hasDeviceFp;
    ticket.deviceFpBound = !!result.deviceFpBound;
  }

  return ticket;
}

function changeCustomerMobile(payload) {
  ensureHeaders_();

  const landline = validateLandline_(payload.landline);
  const oldMobile = validateMobile_(payload.oldMobile);
  const newMobile = validateMobile_(payload.newMobile);

  if (normalizeMobileForMatch_(oldMobile) === normalizeMobileForMatch_(newMobile)) {
    throw new Error('الرقم الجديد يجب أن يكون مختلفاً عن الرقم القديم');
  }

  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const targetLandline = normalizeLandlineForMatch_(landline);
  const targetOld = normalizeMobileForMatch_(oldMobile);
  const now = new Date();
  let updated = 0;
  let foundLandline = false;

  for (let i = 1; i < data.length; i++) {
    const rowLandline = normalizeLandlineForMatch_(data[i][COL.LANDLINE - 1]);
    if (rowLandline !== targetLandline) continue;

    foundLandline = true;
    const rowMobile = normalizeMobileForMatch_(data[i][COL.MOBILE - 1]);
    if (rowMobile === targetOld) {
      sheet.getRange(i + 1, COL.MOBILE).setValue(newMobile);
      sheet.getRange(i + 1, COL.LAST_UPDATE).setValue(now);
      if (payload.deviceFp) {
        saveDeviceFp_(sheet, i + 1, payload.deviceFp);
      }
      updated++;
    }
  }

  if (!foundLandline) {
    throw new Error('لم يتم العثور على بلاغ بهذا الرقم الأرضي');
  }
  if (updated === 0) {
    throw new Error('رقم الموبايل القديم غير صحيح لهذا الخط');
  }

  return {
    success: true,
    message: 'تم تحديث رقم الموبايل بنجاح. استخدم الرقم الجديد في المتابعة.',
    landline: landline,
    mobile: newMobile
  };
}

function submitRating(payload) {
  ensureHeaders_();

  const result = resolveCustomerTicket_(payload.landline, payload.mobile, payload.deviceFp);
  if (result.row === -1) {
    throw new Error('لم يتم العثور على البلاغ');
  }

  verifyDeviceFpOnly_(result.data[result.index], payload.deviceFp);

  const ratingFault = Number(payload.ratingFault);
  const ratingTech = Number(payload.ratingTech);
  const comment = String(payload.comment || '').trim();
  const ratingDeviceFp = validateDeviceFp_(payload.deviceFp, true);

  if (!ratingFault || ratingFault < 1 || ratingFault > 5) {
    throw new Error('يرجى تقييم إزالة العطل من 1 إلى 5');
  }
  if (!ratingTech || ratingTech < 1 || ratingTech > 5) {
    throw new Error('يرجى تقييم الفني من 1 إلى 5');
  }

  const status = String(result.data[result.index][COL.STATUS - 1]);
  if (!isResolvedStatus_(status)) {
    throw new Error('التقييم متاح فقط بعد إغلاق العطل من السنترال (تم الحل)');
  }

  if (!isRatingEligibleRow_(result.data[result.index])) {
    throw new Error('التقييم غير متاح لهذا البلاغ');
  }

  if (result.data[result.index][COL.RATING_FAULT - 1] || result.data[result.index][COL.RATING_TECH - 1]) {
    throw new Error('تم إرسال التقييم مسبقاً لهذا البلاغ');
  }

  result.sheet.getRange(result.row, COL.RATING_FAULT).setValue(ratingFault);
  result.sheet.getRange(result.row, COL.RATING_TECH).setValue(ratingTech);
  result.sheet.getRange(result.row, COL.COMMENT).setValue(comment);
  result.sheet.getRange(result.row, COL.RATING_DEVICE_FP).setValue(ratingDeviceFp);
  result.sheet.getRange(result.row, COL.LAST_UPDATE).setValue(new Date());

  return {
    success: true,
    message: 'شكراً لتقييمك. تم حفظ التقييم بنجاح.'
  };
}

function reopenTicket(payload) {
  ensureHeaders_();

  const result = resolveCustomerTicket_(payload.landline, payload.mobile, payload.deviceFp);
  if (result.row === -1) {
    throw new Error('لم يتم العثور على البلاغ');
  }

  verifyDeviceFpOnly_(result.data[result.index], payload.deviceFp);

  const note = String(payload.note || '').trim();

  const status = String(result.data[result.index][COL.STATUS - 1]);
  if (!isResolvedStatus_(status)) {
    throw new Error('إعادة الفتح متاحة فقط بعد تسجيل السنترال لـ «تم الحل»');
  }

  if (!isRatingEligibleRow_(result.data[result.index])) {
    throw new Error('إعادة الفتح غير متاحة لهذا البلاغ');
  }

  if (result.data[result.index][COL.RATING_FAULT - 1] || result.data[result.index][COL.RATING_TECH - 1]) {
    throw new Error('لا يمكن إعادة فتح بلاغ تم تقييمه');
  }

  const now = new Date();
  let customerMessage = 'العميل: المشكلة مازالت موجودة — طلب إعادة فتح البلاغ';
  if (note) {
    customerMessage += ' — ' + note;
  }

  const existingNotifications = result.data[result.index][COL.NOTIFICATION - 1];
  const updatedNotifications = appendNotificationLine_(existingNotifications, customerMessage, now);

  result.sheet.getRange(result.row, COL.STATUS).setValue(STATUS_REOPENED);
  result.sheet.getRange(result.row, COL.NOTIFICATION).setValue(updatedNotifications);
  result.sheet.getRange(result.row, COL.LAST_UPDATE).setValue(now);

  return {
    success: true,
    message: 'تم إعادة فتح البلاغ وإبلاغ السنترال. سيتم متابعة المشكلة مرة أخرى.'
  };
}

function submitNewComplaint(payload) {
  ensureHeaders_();

  const reason = String(payload.reason || '').trim();

  if (REASONS.indexOf(reason) === -1) {
    throw new Error('يرجى اختيار سبب الشكوى');
  }

  const result = resolveCustomerTicket_(payload.landline, payload.mobile, payload.deviceFp);
  if (result.row === -1) {
    throw new Error('لم يتم العثور على بلاغ سابق بهذا الرقم');
  }

  verifyDeviceFpOnly_(result.data[result.index], payload.deviceFp);

  const landline = validateLandline_(payload.landline);
  const mobile = normalizeMobileForMatch_(result.data[result.index][COL.MOBILE - 1]) ||
    validateMobile_(payload.mobile);
  const deviceFp = validateDeviceFp_(payload.deviceFp, true);

  const row = result.data[result.index];
  const status = String(row[COL.STATUS - 1]);

  if (!isResolvedStatus_(status)) {
    throw new Error('يمكن فتح شكوى جديدة فقط بعد إغلاق البلاغ السابق (تم الحل)');
  }

  if (isRatingEligibleRow_(row) && !row[COL.RATING_FAULT - 1] && !row[COL.RATING_TECH - 1]) {
    throw new Error('يرجى تقييم البلاغ السابق قبل فتح شكوى جديدة');
  }

  const sheet = getSheet_();
  const now = new Date();

  sheet.appendRow([
    now,
    landline,
    reason,
    mobile,
    STATUS_NEW,
    '',
    now,
    '',
    '',
    '',
    deviceFp,
    ''
  ]);

  return {
    success: true,
    message: 'تم فتح شكوى جديدة على نفس الخط. سيتم متابعتها من السنترال.',
    landline: landline,
    mobile: mobile
  };
}

/**
 * عند إضافة إشعار جديد في عمود F يُضاف التاريخ والوقت تلقائياً لكل سطر جديد.
 * يعمل فقط على صفحة «ابلاغ عميل» وبعد منح الصلاحيات للسكربت.
 */
function onEdit(e) {
  try {
    handleNotificationEdit_(e);
  } catch (err) {
    Logger.log('onEdit: ' + (err.message || err));
  }
}

function handleNotificationEdit_(e) {
  if (!e || !e.range) return;
  if (e.authMode === ScriptApp.AuthMode.NONE) return;

  const sheet = e.range.getSheet();
  const col = e.range.getColumn();
  const row = e.range.getRow();
  if (row < 2 || col !== COL.NOTIFICATION || !isTargetSheet_(sheet)) return;

  const value = String(e.range.getValue() || '');
  if (!value.trim()) return;

  const normalized = normalizeNotificationCell_(value);
  if (!normalized.changed || normalized.value === value) return;

  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(3000)) return;

  try {
    sheet.getRange(row, COL.NOTIFICATION).setValue(normalized.value);
    sheet.getRange(row, COL.LAST_UPDATE).setValue(new Date());
  } finally {
    lock.releaseLock();
  }
}

/**
 * تشغيل مرة واحدة من المحرر لمنح الصلاحيات وإعداد عناوين الأعمدة.
 * اختر هذه الدالة من القائمة ثم Run.
 */
function setupSheet() {
  try {
    const ss = getSpreadsheet_();
    Logger.log('تم الاتصال بالشيت: ' + ss.getName());
    ensureHeaders_();
    const sheet = getSheet_();
    Logger.log('تم إعداد صفحة: ' + sheet.getName());
    Logger.log('تم إعداد الشيت بنجاح');
  } catch (err) {
    Logger.log('خطأ: ' + (err.message || err));
    throw err;
  }
}
