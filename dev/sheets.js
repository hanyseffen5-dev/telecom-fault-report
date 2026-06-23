const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1T5agEVNB6lLNkkiqjaXSufoE3gF59bH1_wLhWC0h_0A';
const SHEET_GID = 80364727;
const SHEET_NAME = 'ابلاغ عميل';

const FARSHOOT_DATA_SPREADSHEET_ID = '1xNfavCbGCTSVfw440gIszwF9ejJL1UUGKxpNiHKYbdI';
const FARSHOOT_DATA_SHEET_NAME = 'بيانات';
const FARSHOOT_DATA_SHEET_GID = 289885306;
const FARSHOOT_PREVIEW_SHEET_NAME = 'تعذر معاينة';
const FARSHOOT_PREVIEW_SHEET_GID = 393999157;
const PREVIEW_DRIVE_ROOT_NAME = 'مرفقات_تعذر_معاينة_فرشوط';

const PREVIEW_INSPECTION_RESULTS = [
  'تعذر بكس معطل',
  'تعذر بكس ممتلىء',
  'تعذر كابينة معطلة',
  'تعذر لا يوجد شبكة',
  'فك تعذر'
];

const PREVIEW_SHEET_HEADERS = [
  'التاريخ والوقت',
  'رقم المسلسل',
  'الفني',
  'المحمول',
  'اسم العميل',
  'العنوان',
  'كابينة MSAN',
  'رقم الكابل',
  'رقم الكابينة',
  'رقم البكس',
  'الملاحظات',
  'الإجراء المتخذ',
  'رابط الموقع',
  'رابط الصورة'
];

const TECH_NOTES_SHEET_NAME = 'ملاحظات الفنيين';
const TECH_NOTES_SHEET_GID = 1001187135;
const TECH_NOTES_DRIVE_ROOT_NAME = 'مرفقات_ملاحظات_الفنيين';

const TECH_NOTE_REPORT_TYPES = [
  'عطل ارضى',
  'تعذر تركيب',
  'اعمال صيانة'
];

const TECH_NOTE_ACTIONS = [
  'تحويل للشبكات',
  'تحويل لمراقب الشؤون الخارجية',
  'تم الإصلاح',
  'قيد المعالجة'
];

const TECH_NOTE_CONNECTION_TYPES = [
  'msan',
  'ftth'
];

const TECH_NOTES_SHEET_HEADERS = [
  'التاريخ والوقت',
  'رقم التليفون',
  'الفني',
  'نوع البلاغ',
  'الملاحظة',
  'النوع',
  'رقم الكابل',
  'رقم الكابينة',
  'رقم البكس',
  'الموقع',
  'الصورة',
  'الإجراء المتخذ'
];

const NETWORK_INSPECTION_SHEET_NAME = 'فحص الشبكات';
const NETWORK_INSPECTION_SHEET_GID = 107583306;
const NETWORK_ARCHIVE_SHEET_NAME = 'ارشيف الشبكات';
const NETWORK_ARCHIVE_SHEET_GID = 268424427;
const NETWORK_INSPECTION_DRIVE_ROOT_NAME = 'مرفقات_فحص_الشبكات';

const NETWORK_WORK_CLASSIFICATIONS = [
  'رفع كفاءة',
  'سرقات وإتلافات',
  'صيانة علاجية',
  'فك تعذرات'
];

const NETWORK_REPAIR_STATUSES = [
  'إصلاح مؤقت',
  'إصلاح دائم',
  'جاري الإصلاح',
  'يصعب الإصلاح'
];

const NETWORK_INSPECTION_SHEET_HEADERS = [
  'التاريخ والوقت',
  'رقم التذكرة',
  'الفني الأصلي',
  'اللحام القائم بالفحص',
  'العامل المرافق',
  'تصنيف الأعمال',
  'نوع الأعمال',
  'المهمات المستخدمة/المطلوبة',
  'حالة الإصلاح',
  'ملاحظات الفحص',
  'ملاحظات أخرى',
  'رقم الكابل',
  'رقم الكابينة',
  'رقم البكس',
  'رابط الموقع',
  'رابط الصورة',
  'تاريخ بلاغ العطل'
];

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
  RATING_DEVICE_FP: 12,
  RATING_FLAG: 13,
  ASSIGNED_TECH: 14,
  CUST_TECH_CHANNEL: 15,
  DRIVE_FOLDER: 16
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
  'بصمة جهاز التقييم',
  'تقييم متاح',
  'الفني المسؤول',
  'قناة عميل-فني',
  'مجلد Drive'
];

const TECH_SHEET_NAME = 'الفنيين';
const TECH_HEADERS = ['tech_id', 'الاسم', 'رقم التليفون', 'PIN', 'الحالة'];
const TECH_COL = { ID: 1, NAME: 2, PHONE: 3, PIN: 4, STATUS: 5 };

const MSG_SHEET_NAME = 'الرسائل';
const MSG_HEADERS = ['msg_id', 'ticket_row', 'sender_type', 'sender_id', 'recipient_id', 'النص', 'رابط_المرفق', 'التاريخ'];
const MSG_COL = { ID: 1, TICKET_ROW: 2, SENDER_TYPE: 3, SENDER_ID: 4, RECIPIENT_ID: 5, TEXT: 6, ATTACHMENT: 7, DATE: 8 };

const SENDER_CENTRAL = 'إدارة';
const SENDER_TECH = 'فني';
const RECIPIENT_CENTRAL = 'central';

const TECH_STATUS_AVAILABLE = 'متاح';
const TECH_STATUS_INACTIVE = 'غير نشط';
const TECH_STATUSES = ['متاح', 'مشغول', 'غير نشط'];
const CHANNEL_CLOSED = 'مغلقة';

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

function getLandlineKey(landline) {
  return normalizeLandlineForMatch(landline);
}

function isTechInspectionRow(row) {
  return String(row[COL.REASON - 1] || '').trim() === TECH_INSPECTION_REASON;
}

function extractTechInspectionNote(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  const m = text.match(/\[فحص فني\]\s*(.+)/);
  if (m) return m[1].split('\n')[0].trim();
  return text.split('\n')[0].trim();
}

/** أحدث صف لكل خط أرضي — للعرض في لوحة السنترال فقط */
function getLatestRowByLandline(data) {
  const latest = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;
    if (isTechInspectionRow(row)) continue;
    latest[getLandlineKey(row[COL.LANDLINE - 1])] = i + 1;
  }
  return latest;
}

function isLatestTicketForLandline(rowNumber, row, latestByLandline) {
  return latestByLandline[getLandlineKey(row[COL.LANDLINE - 1])] === rowNumber;
}

async function getTicketArchive(landline, mobile, excludeRow) {
  const data = await getAllRows();
  const targetLandline = normalizeLandlineForMatch(landline);
  const archive = [];

  for (let i = 1; i < data.length; i++) {
    const rowNumber = i + 1;
    if (rowNumber === excludeRow) continue;
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;
    if (normalizeLandlineForMatch(row[COL.LANDLINE - 1]) !== targetLandline) continue;
    if (isTechInspectionRow(row)) continue;

    const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate(row[COL.LAST_UPDATE - 1]) : '';
    const notifications = parseNotifications(row[COL.NOTIFICATION - 1], lastUpdate);
    archive.push({
      row: rowNumber,
      date: row[COL.DATE - 1] ? formatDate(row[COL.DATE - 1]) : '',
      lastUpdate,
      reason: String(row[COL.REASON - 1] || ''),
      status: String(row[COL.STATUS - 1] || STATUS_NEW),
      notifications,
      techMessages: await getMessagesForTicket(rowNumber),
      lastNotification: notifications.length ? notifications[notifications.length - 1].text : ''
    });
  }
  archive.sort((a, b) => b.row - a.row);
  return archive;
}

/** أرشيف الخط لصفحة مهام الفحص — يشمل الشكاوى السابقة ومهام الفحص بدون محادثة الفني */
async function getInspectionPageArchive(landline, excludeRow) {
  const data = await getAllRows();
  const targetLandline = normalizeLandlineForMatch(landline);
  const archive = [];

  for (let i = 1; i < data.length; i++) {
    const rowNumber = i + 1;
    if (rowNumber === excludeRow) continue;
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;
    if (normalizeLandlineForMatch(row[COL.LANDLINE - 1]) !== targetLandline) continue;

    const isInspection = isTechInspectionRow(row);
    const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate(row[COL.LAST_UPDATE - 1]) : '';
    const notifications = parseNotifications(row[COL.NOTIFICATION - 1], lastUpdate);
    archive.push({
      row: rowNumber,
      date: row[COL.DATE - 1] ? formatDate(row[COL.DATE - 1]) : '',
      lastUpdate,
      reason: String(row[COL.REASON - 1] || ''),
      status: String(row[COL.STATUS - 1] || STATUS_NEW),
      notifications,
      techMessages: isInspection ? [] : await getMessagesForTicket(rowNumber),
      lastNotification: notifications.length ? notifications[notifications.length - 1].text : '',
      isInspection,
      inspectionNote: isInspection ? extractTechInspectionNote(row[COL.NOTIFICATION - 1]) : ''
    });
  }
  archive.sort((a, b) => b.row - a.row);
  return archive;
}

async function countTicketArchive(landline, excludeRow) {
  const data = await getAllRows();
  const targetLandline = normalizeLandlineForMatch(landline);
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const rowNumber = i + 1;
    if (rowNumber === excludeRow) continue;
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;
    if (normalizeLandlineForMatch(row[COL.LANDLINE - 1]) !== targetLandline) continue;
    count++;
  }
  return count;
}

const REASONS = [
  'انقطاع الخدمة',
  'ضعف كفاءة الخط',
  'طلب صيانة للخط'
];

const CHAT_REASON = 'تواصل مع السنترال';
const TECH_INSPECTION_REASON = 'فحص فني — سنترال';
const MAX_MESSAGE_LENGTH = 1000;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const TECH_DRIVE_ROOT_NAME = 'مرفقات_فني_فرشوط';
const CUSTOMER_MSG_PREFIX = 'العميل: ';
const COMPLAINT_REOPEN_DAYS = 5;
const CUSTOMER_PHOTO_TAG = '[صورة]';

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
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ]
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

function parseDateInput(value, label) {
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
const RATING_FLAG_YES = 'نعم';
const RATING_FLAG_NO = 'لا';
const RATING_ENABLED_MARKER = '[تقييم متاح]';
const CENTRAL_REPAIRED_NOTIFICATION = 'تم إصلاح العطل بنجاح';

function isRatingEligibleRow(row) {
  const flag = String(row[COL.RATING_FLAG - 1] || '').trim();
  if (flag === RATING_FLAG_YES) return true;
  if (flag === RATING_FLAG_NO) return false;
  const notification = String(row[COL.NOTIFICATION - 1] || '');
  return notification.includes(RATING_ENABLED_MARKER);
}

function isCentralResolutionMessage(text) {
  const t = String(text || '');
  if (t.includes('إصلاح العطل') || t.includes('تم إصلاح')) return true;
  if (t.startsWith('السنترال:') && t.includes('تم الحل')) return true;
  return false;
}

function parseNotificationDate(dateStr) {
  const m = String(dateStr || '').match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]));
  return isNaN(d.getTime()) ? null : d;
}

function findCentralCompletionNotification(notifications) {
  let lastMatch = null;
  (notifications || []).forEach((n) => {
    const text = String(n.text || '');
    if (!text.startsWith('السنترال:')) return;
    const body = text.replace(/^السنترال:\s*/, '');
    if (body.includes('تم الانتهاء من طلبكم') || body.includes('تم الحل') || isCentralResolutionMessage(text)) {
      lastMatch = n;
    }
  });
  return lastMatch;
}

function getCompletionDateFromRow(row) {
  const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate(row[COL.LAST_UPDATE - 1]) : '';
  const notifications = parseNotifications(row[COL.NOTIFICATION - 1], lastUpdate);
  const completion = findCentralCompletionNotification(notifications);
  if (completion && completion.date) {
    const parsed = parseNotificationDate(completion.date);
    if (parsed) return parsed;
  }
  if (row[COL.LAST_UPDATE - 1]) {
    const d = row[COL.LAST_UPDATE - 1] instanceof Date
      ? row[COL.LAST_UPDATE - 1]
      : new Date(row[COL.LAST_UPDATE - 1]);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function isWithinReopenWindow(row) {
  if (!isResolvedStatus(String(row[COL.STATUS - 1] || ''))) return true;
  const completionDate = getCompletionDateFromRow(row);
  if (!completionDate) return true;
  const diffDays = (Date.now() - completionDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= COMPLAINT_REOPEN_DAYS;
}

function getReopenWindowInfo(row) {
  const complaintDate = row[COL.DATE - 1] ? formatDate(row[COL.DATE - 1]) : '';
  let resolutionDate = '';
  let reopenDeadline = '';
  let reopenWindowExpired = false;

  if (isResolvedStatus(String(row[COL.STATUS - 1] || ''))) {
    const completionDate = getCompletionDateFromRow(row);
    if (completionDate) {
      resolutionDate = formatDate(completionDate);
      const deadline = new Date(completionDate.getTime());
      deadline.setDate(deadline.getDate() + COMPLAINT_REOPEN_DAYS);
      reopenDeadline = formatDate(deadline);
      reopenWindowExpired = !isWithinReopenWindow(row);
    }
  }

  return { complaintDate, resolutionDate, reopenDeadline, reopenWindowExpired };
}

function canSendCustomerMessage(row) {
  if (isTechInspectionRow(row)) return false;
  const status = String(row[COL.STATUS - 1] || STATUS_NEW);
  if (!isResolvedStatus(status)) return true;
  if (row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1]) return false;
  return isWithinReopenWindow(row);
}

function canReopenRow(row) {
  const status = String(row[COL.STATUS - 1] || STATUS_NEW);
  if (!isResolvedStatus(status)) return false;
  if (row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1]) return false;
  if (!isRatingEligibleRow(row)) return false;
  return isWithinReopenWindow(row);
}

function isArchiveComplaintRow(row) {
  return isResolvedStatus(String(row[COL.STATUS - 1] || '')) && !isRatingEligibleRow(row);
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
  const windowInfo = getReopenWindowInfo(row);

  return {
    date: windowInfo.complaintDate,
    landline: String(row[COL.LANDLINE - 1] || ''),
    reason: String(row[COL.REASON - 1] || ''),
    mobile: String(row[COL.MOBILE - 1] || ''),
    status: String(row[COL.STATUS - 1] || STATUS_NEW),
    notifications,
    notification: notifications.length ? notifications[notifications.length - 1].text : '',
    lastUpdate,
    resolutionDate: windowInfo.resolutionDate,
    reopenDeadline: windowInfo.reopenDeadline,
    reopenWindowExpired: windowInfo.reopenWindowExpired,
    ratingFault: row[COL.RATING_FAULT - 1] || '',
    ratingTech: row[COL.RATING_TECH - 1] || '',
    comment: String(row[COL.COMMENT - 1] || ''),
    isResolved: isResolvedStatus(row[COL.STATUS - 1]),
    ratingEligible: isRatingEligibleRow(row),
    canRate: isResolvedStatus(row[COL.STATUS - 1]) &&
      isRatingEligibleRow(row) &&
      !row[COL.RATING_FAULT - 1] && !row[COL.RATING_TECH - 1],
    canReopen: canReopenRow(row),
    canSendMessage: canSendCustomerMessage(row),
    isArchiveComplaint: isArchiveComplaintRow(row),
    alreadyRated: !!(row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1]),
    canOpenNewComplaint: isResolvedStatus(row[COL.STATUS - 1]) && (
      !!(row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1]) ||
      isArchiveComplaintRow(row)
    ),
    canSendNotification: canCentralSendNotification(
      row[COL.STATUS - 1],
      parseNotifications(row[COL.NOTIFICATION - 1], lastUpdate)
    ),
    assignedTech: String(row[COL.ASSIGNED_TECH - 1] || ''),
    custTechChannel: String(row[COL.CUST_TECH_CHANNEL - 1] || CHANNEL_CLOSED),
    driveFolder: String(row[COL.DRIVE_FOLDER - 1] || ''),
    isTechInspection: isTechInspectionRow(row),
    inspectionNote: isTechInspectionRow(row) ? extractTechInspectionNote(row[COL.NOTIFICATION - 1]) : ''
  };
}

function shouldShowFreshChatView(row) {
  const status = String(row[COL.STATUS - 1] || STATUS_NEW);
  return isResolvedStatus(status) && isTicketRated(row);
}

function buildFreshChatView(ticket) {
  ticket.isNewConversation = true;
  ticket.status = STATUS_NEW;
  ticket.notifications = [];
  ticket.notification = '';
  ticket.isResolved = false;
  ticket.canRate = false;
  ticket.alreadyRated = false;
  ticket.canReopen = false;
  ticket.canSendMessage = true;
  ticket.canOpenNewComplaint = false;
  ticket.reopenWindowExpired = false;
  ticket.canSendNotification = true;
  ticket.ratingFault = '';
  ticket.ratingTech = '';
  ticket.comment = '';
  return ticket;
}

async function getAllRows() {
  const title = await resolveSheetTitle();
  const sheets = getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title}'!A:P`
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
      range: `'${title}'!A1:P1`,
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
      range: `'${title}'!A1:P1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] }
    });
    return;
  }

  const updates = [];
  for (let i = 0; i < HEADERS.length; i++) {
    if (!firstRow[i] && HEADERS[i]) {
      updates.push({
        range: `'${title}'!${colLetter(i + 1)}1`,
        values: [[HEADERS[i]]]
      });
    }
  }
  if (updates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: updates }
    });
  }
}

function isEmptyMobile(value) {
  return !normalizeMobileForMatch(value);
}

function findLatestByLandline(data, landline) {
  const targetLandline = normalizeLandlineForMatch(landline);

  for (let i = data.length - 1; i >= 1; i--) {
    const rowLandline = normalizeLandlineForMatch(data[i][COL.LANDLINE - 1]);
    if (rowLandline === targetLandline) {
      return { rowNumber: i + 1, index: i, row: data[i] };
    }
  }
  return { rowNumber: -1, index: -1, row: null };
}

function findLatestCustomerRowByLandline(data, landline) {
  const targetLandline = normalizeLandlineForMatch(landline);

  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    if (isTechInspectionRow(row)) continue;
    const rowLandline = normalizeLandlineForMatch(row[COL.LANDLINE - 1]);
    if (rowLandline === targetLandline) {
      return { rowNumber: i + 1, index: i, row: row };
    }
  }
  return { rowNumber: -1, index: -1, row: null };
}

function findLatestRowForCustomer(data, landline, mobile) {
  const targetMobile = normalizeMobileForMatch(mobile);
  const latest = findLatestCustomerRowByLandline(data, landline);

  if (latest.rowNumber === -1) {
    return { rowNumber: -1, index: -1, row: null, needsMobileRegistration: false };
  }

  const storedMobile = normalizeMobileForMatch(latest.row[COL.MOBILE - 1]);

  if (isEmptyMobile(latest.row[COL.MOBILE - 1])) {
    return { ...latest, needsMobileRegistration: true };
  }

  if (storedMobile === targetMobile) {
    return { ...latest, needsMobileRegistration: false };
  }

  return { rowNumber: -1, index: -1, row: null, needsMobileRegistration: false };
}

function getCustomerAccessError(data, landline, mobile) {
  const latest = findLatestCustomerRowByLandline(data, landline);

  if (latest.rowNumber === -1) {
    return 'لم يتم العثور على اى تواصل لهذا الرقم الأرضي. تأكد من رقم التليفون الأرضي.';
  }

  const storedMobile = normalizeMobileForMatch(latest.row[COL.MOBILE - 1]);
  const targetMobile = normalizeMobileForMatch(mobile);

  if (storedMobile && storedMobile !== targetMobile) {
    return 'رقم الموبايل المُدخل مختلف عن الرقم المسجّل مسبقاً لهذا الخط. استخدم الرقم الصحيح أو «تغيير رقم الموبايل» أدناه.';
  }

  return 'لم يتم العثور على بلاغ بهذا الرقم. تأكد من البيانات المدخلة.';
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
    range: `'${title}'!A:P`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[now, landline, reason, mobile, STATUS_NEW, '', now, '', '', '', String(payload.deviceFp || ''), '', '']]
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
  const result = findLatestRowForCustomer(data, normalizedLandline, normalizedMobile);

  if (result.rowNumber === -1) {
    throw new Error(getCustomerAccessError(data, normalizedLandline, normalizedMobile));
  }

  if (result.needsMobileRegistration) {
    const title = await resolveSheetTitle();
    const sheets = getSheets();
    const now = nowFormatted();

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: `'${title}'!${colLetter(COL.MOBILE)}${result.rowNumber}`, values: [[normalizedMobile]] },
          { range: `'${title}'!${colLetter(COL.LAST_UPDATE)}${result.rowNumber}`, values: [[now]] }
        ]
      }
    });

    result.row[COL.MOBILE - 1] = normalizedMobile;
    result.row[COL.LAST_UPDATE - 1] = now;
  }

  const ticket = rowToObject(result.row);
  if (result.needsMobileRegistration) {
    ticket.mobileJustRegistered = true;
  }
  return ticket;
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
  if (!isRatingEligibleRow(result.row)) {
    throw new Error('التقييم غير متاح لهذا البلاغ');
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
  if (!canReopenRow(result.row)) {
    if (!isWithinReopenWindow(result.row)) {
      throw new Error('انتهت مدة إعادة فتح الشكوى (5 أيام من تاريخ إنهاء السنترال للطلب)');
    }
    throw new Error('إعادة الفتح غير متاحة لهذا البلاغ');
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
  if (isRatingEligibleRow(result.row) && !result.row[COL.RATING_FAULT - 1] && !result.row[COL.RATING_TECH - 1]) {
    throw new Error('يرجى تقييم البلاغ السابق قبل فتح شكوى جديدة');
  }

  const title = await resolveSheetTitle();
  const sheets = getSheets();
  const now = nowFormatted();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title}'!A:P`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[now, landline, reason, mobile, STATUS_NEW, '', now, '', '', '', String(payload.deviceFp || ''), '', '']]
    }
  });

  return {
    success: true,
    message: 'تم فتح شكوى جديدة على نفس الخط. سيتم متابعتها من السنترال.',
    landline,
    mobile
  };
}

async function appendChatRow(landline, mobile, deviceFp, initialMessage) {
  const title = await resolveSheetTitle();
  const sheets = getSheets();
  const now = nowFormatted();
  const nowDate = new Date();
  let notification = '';
  const msg = String(initialMessage || '').trim();
  if (msg) {
    notification = appendNotificationLine('', CUSTOMER_MSG_PREFIX + msg, nowDate);
  }
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title}'!A:P`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[now, landline, CHAT_REASON, mobile, STATUS_NEW, notification, now, '', '', '', String(deviceFp || ''), '', '']]
    }
  });
}

async function startChat(payload) {
  await ensureHeaders();

  const landline = validateLandline(payload.landline);
  const mobile = validateMobile(payload.mobile);

  let data = await getAllRows();
  const latest = findLatestCustomerRowByLandline(data, landline);

  if (latest.rowNumber === -1) {
    await appendChatRow(landline, mobile, payload.deviceFp);
    data = await getAllRows();
    const created = findLatestByLandline(data, landline);
    const ticket = rowToObject(created.row);
    ticket.isNewConversation = true;
    return ticket;
  }

  const storedMobileRaw = latest.row[COL.MOBILE - 1];

  if (isEmptyMobile(storedMobileRaw)) {
    const title = await resolveSheetTitle();
    const sheets = getSheets();
    const now = nowFormatted();
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: `'${title}'!${colLetter(COL.MOBILE)}${latest.rowNumber}`, values: [[mobile]] },
          { range: `'${title}'!${colLetter(COL.LAST_UPDATE)}${latest.rowNumber}`, values: [[now]] }
        ]
      }
    });
    latest.row[COL.MOBILE - 1] = mobile;
  } else if (normalizeMobileForMatch(storedMobileRaw) !== normalizeMobileForMatch(mobile)) {
    throw new Error('رقم الموبايل مختلف عن الرقم المسجّل مسبقاً لهذا الخط. استخدم رقمك الصحيح أو غيّره من «تغيير رقم الموبايل».');
  }

  const latestStatus = String(latest.row[COL.STATUS - 1] || STATUS_NEW);
  if (shouldShowFreshChatView(latest.row)) {
    const ticket = rowToObject(latest.row);
    ticket.isNewConversation = true;
    return buildFreshChatView(ticket);
  }

  return rowToObject(latest.row);
}

async function getConversation(payload) {
  await ensureHeaders();

  const landline = validateLandline(payload.landline);
  const mobile = validateMobile(payload.mobile);
  const data = await getAllRows();
  const result = findLatestRowForCustomer(data, landline, mobile);

  if (result.rowNumber === -1) {
    throw new Error(getCustomerAccessError(data, landline, mobile));
  }

  if (result.needsMobileRegistration) {
    const title = await resolveSheetTitle();
    const sheets = getSheets();
    const now = nowFormatted();
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: `'${title}'!${colLetter(COL.MOBILE)}${result.rowNumber}`, values: [[mobile]] },
          { range: `'${title}'!${colLetter(COL.LAST_UPDATE)}${result.rowNumber}`, values: [[now]] }
        ]
      }
    });
    result.row[COL.MOBILE - 1] = mobile;
  }

  const ticket = rowToObject(result.row);
  if (shouldShowFreshChatView(result.row)) {
    return buildFreshChatView(ticket);
  }
  return ticket;
}

async function sendCustomerMessage(payload) {
  await ensureHeaders();

  const landline = validateLandline(payload.landline);
  const mobile = validateMobile(payload.mobile);
  const message = String(payload.message || '').trim();

  if (!message) {
    throw new Error('اكتب رسالتك أولاً');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error('الرسالة طويلة جداً — اجعلها أقصر من ' + MAX_MESSAGE_LENGTH + ' حرف');
  }

  let data = await getAllRows();
  let result = findLatestRowForCustomer(data, landline, mobile);

  if (result.rowNumber === -1) {
    const latest = findLatestCustomerRowByLandline(data, landline);
    if (latest.rowNumber !== -1) {
      throw new Error(getCustomerAccessError(data, landline, mobile));
    }
    await appendChatRow(landline, mobile, payload.deviceFp);
    data = await getAllRows();
    result = findLatestByLandline(data, landline);
    result.needsMobileRegistration = false;
  } else if (result.needsMobileRegistration) {
    result.row[COL.MOBILE - 1] = mobile;
  } else {
    const currentStatus = String(result.row[COL.STATUS - 1] || STATUS_NEW);
    if (isResolvedStatus(currentStatus)) {
      if (result.row[COL.RATING_FAULT - 1] || result.row[COL.RATING_TECH - 1]) {
        await appendChatRow(landline, mobile, payload.deviceFp, message);
        const freshData = await getAllRows();
        const created = findLatestByLandline(freshData, landline);
        const ticket = rowToObject(created.row);
        return {
          success: true,
          message: 'تم فتح شكوى جديدة وإرسال رسالتك إلى السنترال.',
          ticket,
          isNewConversation: true
        };
      }
      if (!canSendCustomerMessage(result.row)) {
        throw new Error('انتهت مدة إعادة فتح الشكوى (5 أيام من تاريخ إنهاء السنترال). يمكنك تقييم الخدمة، وبعد التقييم يمكنك فتح شكوى جديدة.');
      }
      const now = new Date();
      const updatedNotifications = appendNotificationLine(
        result.row[COL.NOTIFICATION - 1],
        CUSTOMER_MSG_PREFIX + message,
        now
      );
      const title = await resolveSheetTitle();
      const sheets = getSheets();
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: [
            { range: `'${title}'!${colLetter(COL.NOTIFICATION)}${result.rowNumber}`, values: [[updatedNotifications]] },
            { range: `'${title}'!${colLetter(COL.STATUS)}${result.rowNumber}`, values: [[STATUS_REOPENED]] },
            { range: `'${title}'!${colLetter(COL.LAST_UPDATE)}${result.rowNumber}`, values: [[nowFormatted()]] }
          ]
        }
      });
      const freshData = await getAllRows();
      const ticket = rowToObject(freshData[result.rowNumber - 1]);
      return {
        success: true,
        message: 'تم إعادة فتح الشكوى وإرسال رسالتك إلى السنترال.',
        ticket
      };
    }
  }

  const row = result.row;
  const rowNumber = result.rowNumber;
  const now = new Date();
  const updatedNotifications = appendNotificationLine(
    row[COL.NOTIFICATION - 1],
    CUSTOMER_MSG_PREFIX + message,
    now
  );

  const currentStatus = String(row[COL.STATUS - 1] || STATUS_NEW);
  let nextStatus = currentStatus;
  if (currentStatus !== STATUS_IN_PROGRESS) {
    nextStatus = STATUS_NEW;
  }

  const title = await resolveSheetTitle();
  const sheets = getSheets();
  const updates = [
    { range: `'${title}'!${colLetter(COL.NOTIFICATION)}${rowNumber}`, values: [[updatedNotifications]] },
    { range: `'${title}'!${colLetter(COL.STATUS)}${rowNumber}`, values: [[nextStatus]] },
    { range: `'${title}'!${colLetter(COL.LAST_UPDATE)}${rowNumber}`, values: [[nowFormatted()]] }
  ];

  if (result.needsMobileRegistration) {
    updates.push({ range: `'${title}'!${colLetter(COL.MOBILE)}${rowNumber}`, values: [[mobile]] });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { valueInputOption: 'USER_ENTERED', data: updates }
  });

  const freshData = await getAllRows();
  const ticket = rowToObject(freshData[rowNumber - 1]);

  return {
    success: true,
    message: 'تم إرسال رسالتك إلى مسؤولي السنترال.',
    ticket
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
  if (filter === 'active') return !isResolvedStatus(status);
  if (filter === 'resolved') return isResolvedStatus(status);
  return status === filter;
}

function ticketMatchesSearch(row, query) {
  if (!query) return true;

  const qRaw = String(query).trim().toLowerCase();
  const reason = String(row[COL.REASON - 1] || '').toLowerCase();
  if (reason.includes(qRaw)) return true;

  const landline = normalizeLandlineForMatch(row[COL.LANDLINE - 1]);
  const mobile = normalizeMobileForMatch(row[COL.MOBILE - 1]);
  const qLandline = normalizeLandlineForMatch(query);
  const qMobile = normalizeMobileForMatch(query);

  if (qLandline && landline.includes(qLandline)) return true;
  if (qMobile && mobile.includes(qMobile)) return true;

  const qDigits = digitsOnly(query).replace(/^0+/, '');
  if (qDigits) {
    const landDigits = digitsOnly(row[COL.LANDLINE - 1]).replace(/^0+/, '');
    const mobDigits = digitsOnly(row[COL.MOBILE - 1]).replace(/^0+/, '');
    if (landDigits.includes(qDigits)) return true;
    if (mobDigits.includes(qDigits)) return true;
  }

  const rawLandline = String(row[COL.LANDLINE - 1] || '').toLowerCase();
  const rawMobile = String(row[COL.MOBILE - 1] || '').toLowerCase();
  return rawLandline.includes(qRaw) || rawMobile.includes(qRaw);
}

function rowToCentralObject(row, rowNumber) {
  const base = rowToObject(row);
  return { ...base, row: rowNumber };
}

function isTicketRated(row) {
  return !!(row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1]);
}

function countRatedTickets(data) {
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;
    const status = String(row[COL.STATUS - 1] || STATUS_NEW);
    if (!isResolvedStatus(status) || !isTicketRated(row)) continue;
    if (!isRatingEligibleRow(row)) continue;
    count++;
  }
  return count;
}

async function centralListRatedTickets(payload) {
  verifyCentralAuth(payload.pin);
  await ensureHeaders();

  const search = String(payload.search || '').trim().toLowerCase();
  const data = await getAllRows();
  const tickets = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;

    const status = String(row[COL.STATUS - 1] || STATUS_NEW);
    if (!isResolvedStatus(status) || !isTicketRated(row)) continue;
    if (!isRatingEligibleRow(row)) continue;
    if (!ticketMatchesSearch(row, search)) continue;

    const rowNumber = i + 1;
    const landline = String(row[COL.LANDLINE - 1] || '');
    const mobile = String(row[COL.MOBILE - 1] || '');
    const archive = await getTicketArchive(landline, mobile, rowNumber);

    tickets.push({
      row: rowNumber,
      date: row[COL.DATE - 1] ? formatDate(row[COL.DATE - 1]) : '',
      landline,
      mobile,
      reason: String(row[COL.REASON - 1] || ''),
      status,
      lastUpdate: row[COL.LAST_UPDATE - 1] ? formatDate(row[COL.LAST_UPDATE - 1]) : '',
      ratingFault: row[COL.RATING_FAULT - 1] || '',
      ratingTech: row[COL.RATING_TECH - 1] || '',
      comment: String(row[COL.COMMENT - 1] || ''),
      archiveCount: archive.length,
      archive
    });
  }

  tickets.sort((a, b) => b.row - a.row);
  return { tickets, total: tickets.length };
}

async function centralListTickets(payload) {
  verifyCentralAuth(payload.pin);
  await ensureHeaders();

  const filter = String(payload.filter || 'active');
  const search = String(payload.search || '').trim().toLowerCase();
  const data = await getAllRows();
  const latestByLandline = getLatestRowByLandline(data);
  const tickets = [];
  const counts = {
    all: 0,
    active: 0,
    [STATUS_NEW]: 0,
    [STATUS_IN_PROGRESS]: 0,
    [STATUS_REOPENED]: 0,
    resolved: 0,
    rated: countRatedTickets(data)
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;
    if (isTechInspectionRow(row)) continue;

    const rowNumber = i + 1;
    if (!isLatestTicketForLandline(rowNumber, row, latestByLandline)) continue;

    const status = String(row[COL.STATUS - 1] || STATUS_NEW);
    const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate(row[COL.LAST_UPDATE - 1]) : '';
    const notifications = parseNotifications(row[COL.NOTIFICATION - 1], lastUpdate);

    counts.all++;
    if (!isResolvedStatus(status)) counts.active++;
    if (counts[status] !== undefined) counts[status]++;
    if (isResolvedStatus(status)) counts.resolved++;

    if (!ticketMatchesFilter(status, filter)) continue;
    if (!ticketMatchesSearch(row, search)) continue;

    tickets.push({
      row: rowNumber,
      date: row[COL.DATE - 1] ? formatDate(row[COL.DATE - 1]) : '',
      landline: String(row[COL.LANDLINE - 1] || ''),
      mobile: String(row[COL.MOBILE - 1] || ''),
      reason: String(row[COL.REASON - 1] || ''),
      status,
      lastUpdate,
      lastNotification: notifications.length ? notifications[notifications.length - 1].text : '',
      alreadyRated: !!(row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1]),
      assignedTech: String(row[COL.ASSIGNED_TECH - 1] || '')
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
  ticket.techMessages = await getMessagesForTicket(rowNumber);
  return ticket;
}

async function centralUpdateTicket(payload) {
  verifyCentralAuth(payload.pin);
  await ensureHeaders();

  const rowNumber = Number(payload.row);
  const status = String(payload.status || '').trim();
  const message = String(payload.message || '').trim();
  const photoUrl = String(payload.photoUrl || '').trim().replace(/&amp;/g, '&');
  const photoCaption = String(payload.photoCaption || 'صورة من الفني').trim();
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
    if (isResolvedStatus(status)) {
      updates.push({
        range: `'${title}'!${colLetter(COL.RATING_FLAG)}${rowNumber}`,
        values: [[RATING_FLAG_YES]]
      });
    }
  }

  let notifLine = '';
  if (message && photoUrl && photoUrl.startsWith('http')) {
    notifLine = 'السنترال: ' + message + ' ' + CUSTOMER_PHOTO_TAG + photoUrl + '|' + photoCaption;
  } else if (message) {
    notifLine = 'السنترال: ' + message;
  } else if (photoUrl && photoUrl.startsWith('http')) {
    notifLine = 'السنترال: ' + CUSTOMER_PHOTO_TAG + photoUrl + '|' + photoCaption;
  }

  if (notifLine) {
    const updated = appendNotificationLine(row[COL.NOTIFICATION - 1], notifLine, now);
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

async function centralForwardTechPhoto(payload) {
  verifyCentralAuth(payload.pin);
  await ensureHeaders();

  const rowNumber = Number(payload.row);
  const photoUrl = String(payload.photoUrl || '').trim();
  const caption = String(payload.caption || 'صورة من الفني').trim();

  if (!photoUrl || !photoUrl.startsWith('http')) {
    throw new Error('رابط الصورة غير صالح');
  }

  const data = await getAllRows();
  if (rowNumber < 2 || rowNumber > data.length) {
    throw new Error('رقم البلاغ غير صحيح');
  }

  const row = data[rowNumber - 1];
  const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate(row[COL.LAST_UPDATE - 1]) : '';
  const currentNotifications = parseNotifications(row[COL.NOTIFICATION - 1], lastUpdate);
  const currentStatus = String(row[COL.STATUS - 1] || STATUS_NEW);

  if (!canCentralSendNotification(currentStatus, currentNotifications)) {
    throw new Error('لا يمكن الإرسال — المحادثة منتهية حتى يرسل العميل رسالة جديدة');
  }

  const line = 'السنترال: ' + CUSTOMER_PHOTO_TAG + photoUrl + '|' + caption;
  const now = new Date();
  const updated = appendNotificationLine(row[COL.NOTIFICATION - 1], line, now);
  const title = await resolveSheetTitle();
  const sheets = getSheets();
  const updates = [
    {
      range: `'${title}'!${colLetter(COL.NOTIFICATION)}${rowNumber}`,
      values: [[updated]]
    },
    {
      range: `'${title}'!${colLetter(COL.LAST_UPDATE)}${rowNumber}`,
      values: [[nowFormatted()]]
    }
  ];

  if (currentStatus === STATUS_NEW) {
    updates.push({
      range: `'${title}'!${colLetter(COL.STATUS)}${rowNumber}`,
      values: [[STATUS_IN_PROGRESS]]
    });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { valueInputOption: 'USER_ENTERED', data: updates }
  });

  const freshData = await getAllRows();
  const ticket = rowToCentralObject(freshData[rowNumber - 1], rowNumber);
  ticket.archive = await getTicketArchive(ticket.landline, ticket.mobile, rowNumber);
  ticket.techMessages = await getMessagesForTicket(rowNumber);
  return {
    success: true,
    message: 'تم إرسال الصورة للعميل',
    ticket
  };
}

async function centralAddRepairedLandline(payload) {
  verifyCentralAuth(payload.pin);
  await ensureHeaders();

  const landline = validateLandline(payload.landline);
  const complaintDate = parseDateInput(payload.complaintDate, 'تاريخ الشكوى');
  const lastUpdateDate = parseDateInput(payload.lastUpdateDate, 'تاريخ آخر تحديث');

  if (lastUpdateDate.getTime() < complaintDate.getTime()) {
    throw new Error('تاريخ آخر تحديث يجب أن يكون بعد أو يساوي تاريخ الشكوى');
  }

  const data = await getAllRows();
  const latest = findLatestCustomerRowByLandline(data, landline);
  if (latest.rowNumber !== -1) {
    const status = String(latest.row[COL.STATUS - 1] || '');
    if (!isResolvedStatus(status)) {
      throw new Error('يوجد بلاغ مفتوح لهذا الخط. أغلقه أولاً أو حدّثه من القائمة.');
    }
    if (isRatingEligibleRow(latest.row)) {
      const rated = latest.row[COL.RATING_FAULT - 1] || latest.row[COL.RATING_TECH - 1];
      if (!rated) {
        throw new Error('يوجد بلاغ سابق بانتظار تقييم العميل لهذا الخط.');
      }
    }
  }

  const title = await resolveSheetTitle();
  const sheets = getSheets();
  const notification = appendNotificationLine('', CENTRAL_REPAIRED_NOTIFICATION, lastUpdateDate);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title}'!A:P`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        formatDate(complaintDate),
        landline,
        CENTRAL_REPAIRED_REASON,
        '',
        STATUS_RESOLVED,
        notification,
        formatDate(lastUpdateDate),
        '',
        '',
        '',
        '',
        '',
        RATING_FLAG_YES
      ]]
    }
  });

  return {
    success: true,
    message: 'تمت إضافة الخط المُصلح. يمكن للعميل البحث بالرقم الأرضي وتسجيل الموبايل للتقييم.',
    landline
  };
}

/* ============================================================
 * نظام المهام الثلاثي: الفنيون والرسائل والتعيين
 * ============================================================ */

async function ensureTab(name, headers) {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = (meta.data.sheets || []).some((s) => s.properties.title === name);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: name } } }] }
    });
  }
  const lastCol = colLetter(headers.length);
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${name}'!A1:${lastCol}1`
  });
  const first = (resp.data.values && resp.data.values[0]) || [];
  if (!first.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${name}'!A1:${lastCol}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] }
    });
  }
}

async function getTechRows() {
  await ensureTab(TECH_SHEET_NAME, TECH_HEADERS);
  const sheets = getSheets();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${TECH_SHEET_NAME}'!A:E`
  });
  return resp.data.values || [];
}

function techRowToObject(row) {
  return {
    id: String(row[TECH_COL.ID - 1] || ''),
    name: String(row[TECH_COL.NAME - 1] || ''),
    phone: String(row[TECH_COL.PHONE - 1] || ''),
    status: String(row[TECH_COL.STATUS - 1] || TECH_STATUS_AVAILABLE)
  };
}

function findTechByIdIn(data, techId) {
  const target = String(techId || '').trim();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][TECH_COL.ID - 1] || '').trim() === target) {
      return { rowNumber: i + 1, index: i, values: data[i] };
    }
  }
  return { rowNumber: -1, index: -1, values: null };
}

async function verifyTechAuth(techId, pin) {
  const data = await getTechRows();
  const found = findTechByIdIn(data, techId);
  if (found.rowNumber === -1) {
    throw new Error('فني غير معروف');
  }
  if (String(pin || '') !== String(found.values[TECH_COL.PIN - 1] || '')) {
    throw new Error('رمز دخول الفني غير صحيح');
  }
  if (String(found.values[TECH_COL.STATUS - 1] || '') === TECH_STATUS_INACTIVE) {
    throw new Error('هذا الحساب غير نشط. تواصل مع الإدارة.');
  }
  return found;
}

function generateTechId(data) {
  let max = 0;
  for (let i = 1; i < data.length; i++) {
    const m = String(data[i][TECH_COL.ID - 1] || '').match(/^T(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return 'T' + (max + 1);
}

function buildAttachmentJson(photoUrl, location) {
  const meta = {};
  if (photoUrl) meta.photoUrl = photoUrl;
  if (location && location.lat != null && location.lng != null) {
    meta.location = {
      lat: Number(location.lat),
      lng: Number(location.lng),
      accuracy: location.accuracy != null ? Number(location.accuracy) : null,
      mapsUrl: 'https://www.google.com/maps?q=' + Number(location.lat) + ',' + Number(location.lng)
    };
  }
  return Object.keys(meta).length ? JSON.stringify(meta) : '';
}

async function getOrCreateTicketDriveFolder(rowNumber) {
  const { row } = await getTicketRowData(rowNumber);
  const title = await resolveSheetTitle();
  const existingId = String(row[COL.DRIVE_FOLDER - 1] || '').trim();
  const drive = google.drive({ version: 'v3', auth: getAuth() });

  if (existingId) {
    try {
      await drive.files.get({ fileId: existingId, fields: 'id' });
      return existingId;
    } catch (_err) {}
  }

  const landline = String(row[COL.LANDLINE - 1] || '').trim();
  const folderName = 'شكوى_' + rowNumber + '_' + landline;
  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: []
    },
    fields: 'id'
  });
  const folderId = created.data.id;
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title}'!${colLetter(COL.DRIVE_FOLDER)}${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[folderId]] }
  });
  return folderId;
}

async function uploadTechPhoto(base64Data, mimeType, rowNumber, techId) {
  if (!base64Data) return '';
  const bytes = Buffer.from(base64Data, 'base64');
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new Error('حجم الصورة كبير جداً (الحد الأقصى 5 ميغابايت)');
  }
  const mime = String(mimeType || 'image/jpeg').split(';')[0];
  const ext = mime.includes('png') ? 'png' : 'jpg';
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const fileName = 'tech_' + techId + '_' + stamp + '.' + ext;
  const folderId = await getOrCreateTicketDriveFolder(rowNumber);
  const drive = google.drive({ version: 'v3', auth: getAuth() });
  const created = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType: mime, body: require('stream').Readable.from(bytes) },
    fields: 'id'
  });
  try {
    await drive.permissions.create({
      fileId: created.data.id,
      requestBody: { role: 'reader', type: 'anyone' }
    });
  } catch (_err) {}
  return 'https://drive.google.com/uc?export=view&id=' + created.data.id;
}

async function appendMessage(ticketRow, senderType, senderId, recipientId, text, attachment) {
  await ensureTab(MSG_SHEET_NAME, MSG_HEADERS);
  const sheets = getSheets();
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${MSG_SHEET_NAME}'!A:A`
  });
  const count = (existing.data.values || []).length;
  const msgId = 'M' + count;
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${MSG_SHEET_NAME}'!A:H`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        msgId,
        Number(ticketRow) || '',
        senderType || '',
        senderId || '',
        recipientId || '',
        String(text || ''),
        String(attachment || ''),
        nowFormatted()
      ]]
    }
  });
  return msgId;
}

async function getMessagesForTicket(ticketRow) {
  await ensureTab(MSG_SHEET_NAME, MSG_HEADERS);
  const sheets = getSheets();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${MSG_SHEET_NAME}'!A:H`
  });
  const data = resp.data.values || [];
  const target = Number(ticketRow);
  const messages = [];
  for (let i = 1; i < data.length; i++) {
    if (Number(data[i][MSG_COL.TICKET_ROW - 1]) !== target) continue;
    messages.push({
      id: String(data[i][MSG_COL.ID - 1] || ''),
      ticketRow: Number(data[i][MSG_COL.TICKET_ROW - 1]) || 0,
      senderType: String(data[i][MSG_COL.SENDER_TYPE - 1] || ''),
      senderId: String(data[i][MSG_COL.SENDER_ID - 1] || ''),
      recipientId: String(data[i][MSG_COL.RECIPIENT_ID - 1] || ''),
      text: String(data[i][MSG_COL.TEXT - 1] || ''),
      attachment: String(data[i][MSG_COL.ATTACHMENT - 1] || ''),
      date: String(data[i][MSG_COL.DATE - 1] || '')
    });
  }
  return messages;
}

async function getTicketRowData(rowNumber) {
  const data = await getAllRows();
  if (rowNumber < 2 || rowNumber > data.length) {
    throw new Error('رقم البلاغ غير صحيح');
  }
  return { data, row: data[rowNumber - 1] };
}

async function techList(payload) {
  verifyCentralAuth(payload.pin);
  const data = await getTechRows();
  const technicians = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][TECH_COL.ID - 1]) continue;
    technicians.push(techRowToObject(data[i]));
  }
  return { technicians, total: technicians.length };
}

async function techAdd(payload) {
  verifyCentralAuth(payload.pin);
  const name = String(payload.name || '').trim();
  const phone = String(payload.phone || '').trim();
  const techPin = String(payload.techPin || '').trim();

  if (name.length < 2) {
    throw new Error('اسم الفني مطلوب');
  }
  if (techPin.length < 4) {
    throw new Error('رمز دخول الفني يجب أن يكون 4 أرقام على الأقل');
  }

  const data = await getTechRows();
  const techId = generateTechId(data);
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${TECH_SHEET_NAME}'!A:E`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [[techId, name, phone, techPin, TECH_STATUS_AVAILABLE]] }
  });

  return {
    success: true,
    message: 'تمت إضافة الفني بنجاح',
    technician: { id: techId, name, phone, status: TECH_STATUS_AVAILABLE }
  };
}

async function techUpdateStatus(payload) {
  const status = String(payload.status || '').trim();
  if (!TECH_STATUSES.includes(status)) {
    throw new Error('حالة غير صحيحة');
  }

  let data;
  let found;
  if (payload.techId && payload.techPin) {
    found = await verifyTechAuth(payload.techId, payload.techPin);
    data = await getTechRows();
    found = findTechByIdIn(data, payload.techId);
  } else {
    verifyCentralAuth(payload.pin);
    data = await getTechRows();
    found = findTechByIdIn(data, payload.techId);
    if (found.rowNumber === -1) {
      throw new Error('فني غير معروف');
    }
  }

  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${TECH_SHEET_NAME}'!${colLetter(TECH_COL.STATUS)}${found.rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[status]] }
  });

  return { success: true, message: 'تم تحديث الحالة', status };
}

async function assignTechnician(payload) {
  verifyCentralAuth(payload.pin);
  await ensureHeaders();

  const rowNumber = Number(payload.row);
  const techId = String(payload.techId || '').trim();
  const { row } = await getTicketRowData(rowNumber);

  let techName = '';
  if (techId) {
    const techData = await getTechRows();
    const found = findTechByIdIn(techData, techId);
    if (found.rowNumber === -1) {
      throw new Error('فني غير معروف');
    }
    techName = String(found.values[TECH_COL.NAME - 1] || '');
  }

  const title = await resolveSheetTitle();
  const sheets = getSheets();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `'${title}'!${colLetter(COL.ASSIGNED_TECH)}${rowNumber}`, values: [[techId]] },
        { range: `'${title}'!${colLetter(COL.LAST_UPDATE)}${rowNumber}`, values: [[nowFormatted()]] }
      ]
    }
  });

  if (techId) {
    const landline = String(row[COL.LANDLINE - 1] || '');
    await appendMessage(rowNumber, SENDER_CENTRAL, RECIPIENT_CENTRAL, techId, 'تم إسناد المهمة إليك — الخط الأرضي: ' + landline, '');
  }

  return {
    success: true,
    message: techId ? ('تم إسناد المهمة للفني ' + techName) : 'تم إلغاء تعيين الفني',
    assignedTech: techId,
    assignedTechName: techName
  };
}

async function techLogin(payload) {
  const found = await verifyTechAuth(payload.techId, payload.pin);
  return { success: true, technician: techRowToObject(found.values) };
}

async function techListTasks(payload) {
  await verifyTechAuth(payload.techId, payload.pin);
  await ensureHeaders();

  const techId = String(payload.techId || '').trim();
  const data = await getAllRows();
  const tasks = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[COL.ASSIGNED_TECH - 1] || '').trim() !== techId) continue;

    const rowNumber = i + 1;
    const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate(row[COL.LAST_UPDATE - 1]) : '';
    const notifications = parseNotifications(row[COL.NOTIFICATION - 1], lastUpdate);
    tasks.push({
      row: rowNumber,
      date: row[COL.DATE - 1] ? formatDate(row[COL.DATE - 1]) : '',
      landline: String(row[COL.LANDLINE - 1] || ''),
      mobile: String(row[COL.MOBILE - 1] || ''),
      reason: String(row[COL.REASON - 1] || ''),
      status: String(row[COL.STATUS - 1] || STATUS_NEW),
      lastUpdate,
      lastNotification: notifications.length ? notifications[notifications.length - 1].text : '',
      archiveCount: await countTicketArchive(String(row[COL.LANDLINE - 1] || ''), rowNumber),
      isTechInspection: isTechInspectionRow(row)
    });
  }

  tasks.sort((a, b) => b.row - a.row);
  return { tasks, total: tasks.length };
}

async function techGetTask(payload) {
  await verifyTechAuth(payload.techId, payload.pin);
  await ensureHeaders();

  const rowNumber = Number(payload.row);
  const techId = String(payload.techId || '').trim();
  const { row } = await getTicketRowData(rowNumber);

  if (String(row[COL.ASSIGNED_TECH - 1] || '').trim() !== techId) {
    throw new Error('هذه المهمة غير مسندة إليك');
  }

  const ticket = rowToCentralObject(row, rowNumber);
  ticket.messages = await getMessagesForTicket(rowNumber);
  ticket.archive = await getTicketArchive(ticket.landline, ticket.mobile, rowNumber);
  return ticket;
}

async function techSendMessage(payload) {
  await verifyTechAuth(payload.techId, payload.pin);
  await ensureHeaders();

  const rowNumber = Number(payload.row);
  const techId = String(payload.techId || '').trim();
  let message = String(payload.message || '').trim();
  const photoBase64 = String(payload.photoBase64 || '').trim();
  const photoMimeType = String(payload.photoMimeType || 'image/jpeg').trim();
  const location = payload.location || null;
  const hasLocation = location && location.lat != null && location.lng != null;

  if (!message && !photoBase64 && !hasLocation) {
    throw new Error('اكتب رسالة أو أرفق صورة أو حدّد موقعك');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error('الرسالة طويلة جداً');
  }

  const { row } = await getTicketRowData(rowNumber);
  if (String(row[COL.ASSIGNED_TECH - 1] || '').trim() !== techId) {
    throw new Error('هذه المهمة غير مسندة إليك');
  }

  let photoUrl = '';
  if (photoBase64) {
    photoUrl = await uploadTechPhoto(photoBase64, photoMimeType, rowNumber, techId);
  }

  let attachment = buildAttachmentJson(photoUrl, hasLocation ? location : null);
  if (!attachment && payload.attachment) {
    attachment = String(payload.attachment || '');
  }

  if (!message && photoUrl && hasLocation) {
    message = '📷 صورة و📍 موقع من الفني';
  } else if (!message && photoUrl) {
    message = '📷 صورة مرفقة من الفني';
  } else if (!message && hasLocation) {
    message = '📍 موقع الفني';
  }

  await appendMessage(rowNumber, SENDER_TECH, techId, RECIPIENT_CENTRAL, message, attachment);
  const title = await resolveSheetTitle();
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title}'!${colLetter(COL.LAST_UPDATE)}${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[nowFormatted()]] }
  });

  return {
    success: true,
    message: 'تم إرسال رسالتك إلى الإدارة',
    messages: await getMessagesForTicket(rowNumber)
  };
}

async function centralSendTechMessage(payload) {
  verifyCentralAuth(payload.pin);
  await ensureHeaders();

  const rowNumber = Number(payload.row);
  let message = String(payload.message || '').trim();
  const photoBase64 = String(payload.photoBase64 || '').trim();
  const photoMimeType = String(payload.photoMimeType || 'image/jpeg').trim();

  if (!message && !photoBase64) {
    throw new Error('اكتب رسالة أو أرفق صورة');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error('الرسالة طويلة جداً');
  }

  const { row } = await getTicketRowData(rowNumber);
  const techId = String(row[COL.ASSIGNED_TECH - 1] || '').trim();
  if (!techId) {
    throw new Error('لا يوجد فني مسند لهذه المحادثة');
  }

  let photoUrl = '';
  if (photoBase64) {
    photoUrl = await uploadTechPhoto(photoBase64, photoMimeType, rowNumber, 'central');
  }

  let attachment = buildAttachmentJson(photoUrl, null);
  if (!attachment && payload.attachment) {
    attachment = String(payload.attachment || '');
  }

  if (!message && photoUrl) {
    message = '📷 صورة من الإدارة';
  }

  await appendMessage(rowNumber, SENDER_CENTRAL, RECIPIENT_CENTRAL, techId, message, attachment);
  const title = await resolveSheetTitle();
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title}'!${colLetter(COL.LAST_UPDATE)}${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[nowFormatted()]] }
  });

  return {
    success: true,
    message: photoUrl ? 'تم إرسال الرسالة والصورة للفني' : 'تم إرسال رسالتك إلى الفني',
    messages: await getMessagesForTicket(rowNumber)
  };
}

async function centralCreateTechInspection(payload) {
  verifyCentralAuth(payload.pin);
  await ensureHeaders();

  const landline = validateLandline(payload.landline);
  const techId = String(payload.techId || '').trim();
  const note = String(payload.note || '').trim();
  const photoBase64 = String(payload.photoBase64 || '').trim();
  const photoMimeType = String(payload.photoMimeType || 'image/jpeg').trim();

  if (!techId) throw new Error('اختر الفني المسؤول عن الفحص');
  if (!note && !photoBase64) throw new Error('اكتب تفاصيل طلب الفحص أو أرفق صورة');
  if (note.length > MAX_MESSAGE_LENGTH) throw new Error('الوصف طويل جداً');

  const techRows = await getTechRows();
  const found = findTechByIdIn(techRows, techId);
  if (found.rowNumber === -1) throw new Error('فني غير معروف');
  const techName = String(found.row[TECH_COL.NAME - 1] || '');

  const title = await resolveSheetTitle();
  const sheets = getSheets();
  const now = new Date();
  const nowStr = nowFormatted();
  const notifLine = appendNotificationLine('', 'السنترال: [فحص فني] ' + (note || '📷 صورة مرفقة'), now);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title}'!A:P`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[nowStr, landline, TECH_INSPECTION_REASON, '', STATUS_IN_PROGRESS, notifLine, nowStr, '', '', '', '', '', RATING_FLAG_NO, techId, CHANNEL_CLOSED, '']]
    }
  });

  const data = await getAllRows();
  const rowNumber = data.length;
  let photoUrl = '';
  if (photoBase64) {
    photoUrl = await uploadTechPhoto(photoBase64, photoMimeType, rowNumber, 'central');
  }
  let msgText = 'طلب فحص من السنترال — الخط: ' + landline;
  if (note) {
    msgText += '\n' + note;
  } else if (photoUrl) {
    msgText += '\n📷 صورة مرفقة';
  }
  let attachment = '';
  if (photoUrl) {
    attachment = JSON.stringify({ photoUrl: photoUrl });
  }
  await appendMessage(rowNumber, SENDER_CENTRAL, RECIPIENT_CENTRAL, techId, msgText, attachment);

  const ticket = rowToCentralObject(data[rowNumber - 1] || (await getAllRows())[rowNumber - 1], rowNumber);
  const freshData = await getAllRows();
  const ticketFresh = rowToCentralObject(freshData[rowNumber - 1], rowNumber);
  ticketFresh.techMessages = await getMessagesForTicket(rowNumber);
  ticketFresh.assignedTechName = techName;

  return { success: true, message: 'تم إرسال مهمة الفحص للفني ' + techName, ticket: ticketFresh };
}

async function centralListTechInspections(payload) {
  verifyCentralAuth(payload.pin);
  await ensureHeaders();

  const filter = String(payload.filter || 'active');
  const data = await getAllRows();
  const tasks = [];
  let activeCount = 0;
  let closedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!isTechInspectionRow(row)) continue;
    const rowNumber = i + 1;
    const status = String(row[COL.STATUS - 1] || STATUS_NEW);
    const resolved = isResolvedStatus(status);
    if (resolved) closedCount++; else activeCount++;
    if (filter === 'active' && resolved) continue;
    if (filter === 'closed' && !resolved) continue;
    tasks.push({
      row: rowNumber,
      date: row[COL.DATE - 1] ? formatDate(row[COL.DATE - 1]) : '',
      landline: String(row[COL.LANDLINE - 1] || ''),
      status,
      lastUpdate: row[COL.LAST_UPDATE - 1] ? formatDate(row[COL.LAST_UPDATE - 1]) : '',
      assignedTech: String(row[COL.ASSIGNED_TECH - 1] || ''),
      note: extractTechInspectionNote(row[COL.NOTIFICATION - 1])
    });
  }
  tasks.sort((a, b) => b.row - a.row);
  return { tasks, total: tasks.length, activeCount, closedCount };
}

async function centralGetTechInspection(payload) {
  verifyCentralAuth(payload.pin);
  await ensureHeaders();
  const rowNumber = Number(payload.row);
  const { row } = await getTicketRowData(rowNumber);
  if (!isTechInspectionRow(row)) throw new Error('هذه ليست مهمة فحص فني');
  const ticket = rowToCentralObject(row, rowNumber);
  ticket.techMessages = await getMessagesForTicket(rowNumber);
  const techId = String(row[COL.ASSIGNED_TECH - 1] || '').trim();
  if (techId) {
    const techRows = await getTechRows();
    const found = findTechByIdIn(techRows, techId);
    if (found.rowNumber !== -1) ticket.assignedTechName = String(found.row[TECH_COL.NAME - 1] || '');
  }
  ticket.canCloseInspection = !isResolvedStatus(ticket.status);
  ticket.archive = await getInspectionPageArchive(ticket.landline, rowNumber);
  ticket.archiveCount = ticket.archive.length;
  return ticket;
}

async function centralCloseTechInspection(payload) {
  verifyCentralAuth(payload.pin);
  await ensureHeaders();
  const rowNumber = Number(payload.row);
  const note = String(payload.note || '').trim();
  const { row } = await getTicketRowData(rowNumber);
  if (!isTechInspectionRow(row)) throw new Error('هذه ليست مهمة فحص فني');
  if (isResolvedStatus(row[COL.STATUS - 1])) throw new Error('المهمة مغلقة مسبقاً');

  const techId = String(row[COL.ASSIGNED_TECH - 1] || '').trim();
  const now = new Date();
  let closeMsg = 'تم إغلاق مهمة الفحص من السنترال';
  if (note) closeMsg += ' — ' + note;

  const updated = appendNotificationLine(row[COL.NOTIFICATION - 1], 'السنترال: ' + closeMsg, now);
  const title = await resolveSheetTitle();
  const sheets = getSheets();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `'${title}'!${colLetter(COL.STATUS)}${rowNumber}`, values: [[STATUS_RESOLVED]] },
        { range: `'${title}'!${colLetter(COL.NOTIFICATION)}${rowNumber}`, values: [[updated]] },
        { range: `'${title}'!${colLetter(COL.LAST_UPDATE)}${rowNumber}`, values: [[nowFormatted()]] }
      ]
    }
  });
  if (techId) await appendMessage(rowNumber, SENDER_CENTRAL, RECIPIENT_CENTRAL, techId, closeMsg, '');

  const freshData = await getAllRows();
  const ticket = rowToCentralObject(freshData[rowNumber - 1], rowNumber);
  ticket.techMessages = await getMessagesForTicket(rowNumber);
  ticket.canCloseInspection = false;
  ticket.archive = await getInspectionPageArchive(ticket.landline, rowNumber);
  ticket.archiveCount = ticket.archive.length;
  return { success: true, message: 'تم إغلاق مهمة الفحص', ticket };
}

async function resolveFarshootDataSheetTitle() {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: FARSHOOT_DATA_SPREADSHEET_ID });
  const tabs = meta.data.sheets || [];
  const byName = tabs.find((tab) => tab.properties.title === FARSHOOT_DATA_SHEET_NAME);
  if (byName) return byName.properties.title;
  const byGid = tabs.find((tab) => tab.properties.sheetId === FARSHOOT_DATA_SHEET_GID);
  if (byGid) return byGid.properties.title;
  throw new Error('لم يتم العثور على تبويب «' + FARSHOOT_DATA_SHEET_NAME + '» في شيت فرشوط');
}

async function techSearchSerialData(payload) {
  await verifyTechAuth(payload.techId, payload.pin);
  const serial = String(payload.serial || '').trim();
  if (!serial) {
    throw new Error('أدخل رقم المسلسل');
  }

  const sheets = getSheets();
  const title = await resolveFarshootDataSheetTitle();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: FARSHOOT_DATA_SPREADSHEET_ID,
    range: `'${title}'!A:Z`
  });
  const data = resp.data.values || [];
  if (data.length < 2) {
    return { found: false, serial };
  }

  const headers = data[0].map((h) => String(h || '').trim());
  let foundRow = null;
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    const cellVal = String(data[i][0] || '').trim();
    if (cellVal === serial) {
      foundRow = data[i];
      rowIndex = i + 1;
      break;
    }
  }

  if (!foundRow) {
    return { found: false, serial };
  }

  const record = {};
  for (let c = 0; c < headers.length; c++) {
    if (headers[c]) {
      record[headers[c]] = String(foundRow[c] || '').trim();
    }
  }

  return {
    found: true,
    serial,
    row: rowIndex,
    headers: headers.filter((h) => h),
    data: record
  };
}

async function resolveFarshootPreviewSheetTitle() {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: FARSHOOT_DATA_SPREADSHEET_ID });
  const tabs = meta.data.sheets || [];
  const byName = tabs.find((tab) => tab.properties.title === FARSHOOT_PREVIEW_SHEET_NAME);
  if (byName) return byName.properties.title;
  const byGid = tabs.find((tab) => tab.properties.sheetId === FARSHOOT_PREVIEW_SHEET_GID);
  if (byGid) return byGid.properties.title;
  throw new Error('لم يتم العثور على تبويب «' + FARSHOOT_PREVIEW_SHEET_NAME + '» في شيت فرشوط');
}

async function getOrCreatePreviewDriveFolder(serial) {
  const drive = google.drive({ version: 'v3', auth: getAuth() });
  const q = "mimeType='application/vnd.google-apps.folder' and name='" + PREVIEW_DRIVE_ROOT_NAME.replace(/'/g, "\\'") + "' and trashed=false";
  const listed = await drive.files.list({ q, fields: 'files(id)', spaces: 'drive' });
  let rootId = listed.data.files && listed.data.files[0] ? listed.data.files[0].id : '';
  if (!rootId) {
    const created = await drive.files.create({
      requestBody: { name: PREVIEW_DRIVE_ROOT_NAME, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id'
    });
    rootId = created.data.id;
  }
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const sub = await drive.files.create({
    requestBody: {
      name: 'معاينة_' + serial + '_' + stamp,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootId]
    },
    fields: 'id'
  });
  return sub.data.id;
}

async function uploadPreviewPhoto(base64Data, mimeType, serial, techId) {
  if (!base64Data) return '';
  const bytes = Buffer.from(base64Data, 'base64');
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new Error('حجم الصورة كبير جداً (الحد الأقصى 5 ميغابايت)');
  }
  const mime = String(mimeType || 'image/jpeg').split(';')[0];
  const ext = mime.includes('png') ? 'png' : 'jpg';
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const fileName = 'preview_' + techId + '_' + serial + '_' + stamp + '.' + ext;
  const folderId = await getOrCreatePreviewDriveFolder(serial);
  const drive = google.drive({ version: 'v3', auth: getAuth() });
  const created = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType: mime, body: require('stream').Readable.from(bytes) },
    fields: 'id'
  });
  try {
    await drive.permissions.create({
      fileId: created.data.id,
      requestBody: { role: 'reader', type: 'anyone' }
    });
  } catch (_err) {}
  return 'https://drive.google.com/file/d/' + created.data.id + '/view?usp=drivesdk';
}

function formatPreviewDateTime(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value || '').trim();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).formatToParts(d);
  const get = (type) => (parts.find((p) => p.type === type) || {}).value || '';
  return get('day') + '/' + get('month') + '/' + get('year') + ' ' + get('hour') + ':' + get('minute') + ':' + get('second') + ' ' + get('dayPeriod');
}

function sheetCellToDateTime(value) {
  if (value instanceof Date) return formatPreviewDateTime(value);
  if (typeof value === 'number' && isFinite(value) && value > 20000) {
    return formatPreviewDateTime(new Date(Date.UTC(1899, 11, 30) + value * 86400000));
  }
  const s = String(value || '').trim();
  if (/^\d+(\.\d+)?$/.test(s) && parseFloat(s) > 20000) {
    return formatPreviewDateTime(new Date(Date.UTC(1899, 11, 30) + parseFloat(s) * 86400000));
  }
  return s;
}

async function techSubmitPreviewInspection(payload) {
  const found = await verifyTechAuth(payload.techId, payload.pin);
  const serial = String(payload.serial || '').trim();
  if (!serial) throw new Error('رقم المسلسل مطلوب');

  const inspectionResult = String(payload.inspectionResult || '').trim();
  if (!PREVIEW_INSPECTION_RESULTS.includes(inspectionResult)) {
    throw new Error('اختر نتيجة الفحص من القائمة');
  }

  const photoBase64 = String(payload.photoBase64 || '').trim();
  if (!photoBase64) throw new Error('يجب التقاط صورة للفحص');

  const msanCabinet = String(payload.msanCabinet || '').trim();
  if (!msanCabinet) throw new Error('كابينة MSAN مطلوبة');
  const cableNumber = String(payload.cableNumber || '').trim();
  if (!cableNumber) throw new Error('رقم الكابل مطلوب');
  const cabinetNumber = String(payload.cabinetNumber || '').trim();
  if (!cabinetNumber) throw new Error('رقم الكابينة مطلوب');
  const boxNumber = String(payload.boxNumber || '').trim();
  if (!boxNumber) throw new Error('رقم البكس مطلوب');
  const notes = String(payload.notes || '').trim();
  if (!notes) throw new Error('الملاحظات مطلوبة');

  const location = payload.location || null;
  if (!location || location.lat == null || location.lng == null) {
    throw new Error('يجب تحديد الموقع قبل الإرسال — اضغط «تحديد موقعي»');
  }

  const techId = String(payload.techId || '').trim();
  const techName = String(found.values[TECH_COL.NAME - 1] || '').trim();
  const mapsUrl = 'https://www.google.com/maps?q=' + Number(location.lat) + ',' + Number(location.lng);
  const photoUrl = await uploadPreviewPhoto(photoBase64, payload.photoMimeType, serial, techId);

  const sheets = getSheets();
  const title = await resolveFarshootPreviewSheetTitle();
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: FARSHOOT_DATA_SPREADSHEET_ID,
    range: `'${title}'!A1:N1`
  });
  const firstRow = (existing.data.values || [])[0] || [];
  if (!firstRow.length || PREVIEW_SHEET_HEADERS.every((_h, i) => !firstRow[i])) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: FARSHOOT_DATA_SPREADSHEET_ID,
      range: `'${title}'!A1:N1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [PREVIEW_SHEET_HEADERS] }
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: FARSHOOT_DATA_SPREADSHEET_ID,
    range: `'${title}'!A:N`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        formatPreviewDateTime(new Date()),
        serial,
        techName,
        String(payload.customerMobile || '').trim(),
        String(payload.customerName || '').trim(),
        String(payload.customerAddress || '').trim(),
        String(payload.msanCabinet || '').trim(),
        String(payload.cableNumber || '').trim(),
        String(payload.cabinetNumber || '').trim(),
        String(payload.boxNumber || '').trim(),
        String(payload.notes || '').trim(),
        inspectionResult,
        mapsUrl,
        photoUrl
      ]]
    }
  });

  return { success: true, message: 'تم حفظ فحص التعذر في الشيت بنجاح' };
}

function previewRowToRecord(row, rowNumber) {
  const dateVal = row[0];
  const dateTime = dateVal instanceof Date
    ? formatPreviewDateTime(dateVal)
    : String(dateVal || '').trim();
  return {
    row: rowNumber,
    dateTime,
    serial: String(row[1] || '').trim(),
    tech: String(row[2] || '').trim(),
    mobile: String(row[3] || '').trim(),
    customerName: String(row[4] || '').trim(),
    address: String(row[5] || '').trim(),
    msanCabinet: String(row[6] || '').trim(),
    cableNumber: String(row[7] || '').trim(),
    cabinetNumber: String(row[8] || '').trim(),
    boxNumber: String(row[9] || '').trim(),
    notes: String(row[10] || '').trim(),
    action: String(row[11] || '').trim(),
    locationUrl: String(row[12] || '').trim(),
    photoUrl: String(row[13] || '').trim()
  };
}

function isPreviewRowEmpty(row) {
  for (let i = 0; i < 14; i++) {
    if (String(row[i] || '').trim()) return false;
  }
  return true;
}

async function centralGetPreviewInspections(payload) {
  verifyCentralAuth(payload.pin);
  const title = await resolveFarshootPreviewSheetTitle();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: FARSHOOT_DATA_SPREADSHEET_ID,
    range: `'${title.replace(/'/g, "''")}'!A:N`
  });
  const data = res.data.values || [];
  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (isPreviewRowEmpty(row)) continue;
    records.push(previewRowToRecord(row, i + 1));
  }
  records.sort((a, b) => b.row - a.row);
  return {
    records,
    total: records.length,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + FARSHOOT_DATA_SPREADSHEET_ID +
      '/edit?gid=' + FARSHOOT_PREVIEW_SHEET_GID
  };
}

function techNoteRowToRecord(row, rowNumber) {
  return {
    row: rowNumber,
    dateTime: sheetCellToDateTime(row[0]),
    landline: String(row[1] || '').trim(),
    tech: String(row[2] || '').trim(),
    reportType: String(row[3] || '').trim(),
    notes: String(row[4] || '').trim(),
    connectionType: String(row[5] || '').trim(),
    cableNumber: String(row[6] || '').trim(),
    cabinetNumber: String(row[7] || '').trim(),
    boxNumber: String(row[8] || '').trim(),
    locationUrl: String(row[9] || '').trim(),
    photoUrl: String(row[10] || '').trim(),
    action: String(row[11] || '').trim()
  };
}

function isTechNoteRowEmpty(row) {
  for (let i = 0; i < 12; i++) {
    if (String(row[i] || '').trim()) return false;
  }
  return true;
}

function normalizeArabicLabel(text) {
  return String(text || '').trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function isGroundFaultReportType(reportType) {
  const normalized = normalizeArabicLabel(reportType);
  return normalized === 'عطل ارضي' || normalized.includes('عطل ارض');
}

function isTransferredToNetworksAction(action) {
  return normalizeArabicLabel(action).includes('تحويل للشبكات');
}

function landlineDigitsForMatch(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

function landlineMatchesSearch(cellValue, targetLandline) {
  const cell = String(cellValue || '').trim();
  if (!cell) return false;
  const targetNorm = normalizeLandlineForMatch(targetLandline);
  const cellNorm = normalizeLandlineForMatch(cell);
  if (targetNorm && cellNorm === targetNorm) return true;
  const targetDigits = landlineDigitsForMatch(targetLandline);
  const cellDigits = landlineDigitsForMatch(cell);
  if (!targetDigits || targetDigits.length < 4) return false;
  return cellDigits === targetDigits ||
    (cellDigits.length >= 4 && targetDigits.endsWith(cellDigits)) ||
    (cellDigits.length >= 4 && cellDigits.endsWith(targetDigits));
}

function landlineMatchesArchiveTicket(cellValue, targetLandline) {
  const cell = String(cellValue || '').trim();
  if (!cell) return false;
  const parts = cell.split(/[/,،|]/);
  for (let i = 0; i < parts.length; i++) {
    if (landlineMatchesSearch(parts[i].trim(), targetLandline)) return true;
  }
  return landlineMatchesSearch(cell, targetLandline);
}

function networkArchiveRowToRecord(row, rowNumber) {
  return {
    row: rowNumber,
    dateTime: sheetCellToDateTime(row[0]),
    welder: String(row[3] || '').trim(),
    companion: String(row[4] || '').trim(),
    workClassification: String(row[5] || '').trim(),
    workType: String(row[6] || '').trim(),
    materials: String(row[7] || '').trim(),
    repairStatus: String(row[8] || '').trim(),
    inspectionNotes: String(row[9] || '').trim(),
    locationUrl: String(row[14] || '').trim(),
    photoUrl: String(row[15] || '').trim()
  };
}

function networkArchiveFullRowToRecord(row, rowNumber) {
  return {
    row: rowNumber,
    dateTime: sheetCellToDateTime(row[0]),
    ticketNumber: String(row[1] || '').trim(),
    originalTech: String(row[2] || '').trim(),
    welder: String(row[3] || '').trim(),
    companion: String(row[4] || '').trim(),
    workCategory: String(row[5] || '').trim(),
    workType: String(row[6] || '').trim(),
    materials: String(row[7] || '').trim(),
    repairStatus: String(row[8] || '').trim(),
    inspectionNotes: String(row[9] || '').trim(),
    otherNotes: String(row[10] || '').trim(),
    cableNumber: String(row[11] || '').trim(),
    cabinetNumber: String(row[12] || '').trim(),
    boxNumber: String(row[13] || '').trim(),
    locationUrl: String(row[14] || '').trim(),
    photoUrl: String(row[15] || '').trim()
  };
}

function isNetworkArchiveRowEmpty(row) {
  for (let i = 0; i < 16; i++) {
    if (String(row[i] || '').trim()) return false;
  }
  return true;
}

async function resolveNetworkArchiveSheetTitle() {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const tabs = meta.data.sheets || [];
  const byName = tabs.find((tab) => tab.properties.title === NETWORK_ARCHIVE_SHEET_NAME);
  if (byName) return byName.properties.title;
  const byGid = tabs.find((tab) => tab.properties.sheetId === NETWORK_ARCHIVE_SHEET_GID);
  if (byGid) return byGid.properties.title;
  throw new Error('لم يتم العثور على تبويب «' + NETWORK_ARCHIVE_SHEET_NAME + '» في الشيت');
}

async function netTechGetNetworkArchive(payload) {
  await verifyTechAuth(payload.techId, payload.pin);
  const landline = String(payload.landline || '').trim();
  if (!landline) throw new Error('رقم التليفون مطلوب');

  const title = await resolveNetworkArchiveSheetTitle();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title.replace(/'/g, "''")}'!A:P`
  });
  const data = res.data.values || [];
  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!landlineMatchesArchiveTicket(row[1], landline)) continue;
    records.push(networkArchiveRowToRecord(row, i + 1));
  }
  records.sort((a, b) => b.row - a.row);
  return {
    records,
    total: records.length,
    landline,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID +
      '/edit?gid=' + NETWORK_ARCHIVE_SHEET_GID
  };
}

function networkInspectionRowToHistoryRecord(row, rowNumber) {
  return {
    row: rowNumber,
    dateTime: sheetCellToDateTime(row[0]),
    welder: String(row[3] || '').trim(),
    companion: String(row[4] || '').trim(),
    workClassification: String(row[5] || '').trim(),
    workType: String(row[6] || '').trim(),
    materials: String(row[7] || '').trim(),
    repairStatus: String(row[8] || '').trim(),
    inspectionNotes: String(row[9] || '').trim(),
    locationUrl: String(row[14] || '').trim(),
    photoUrl: String(row[15] || '').trim()
  };
}

async function netTechGetNetworkInspectionHistory(payload) {
  await verifyTechAuth(payload.techId, payload.pin);
  const landline = String(payload.landline || '').trim();
  if (!landline) throw new Error('رقم التليفون مطلوب');

  const title = await resolveNetworkInspectionSheetTitle();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title.replace(/'/g, "''")}'!A:Q`
  });
  const data = res.data.values || [];
  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!landlineMatchesArchiveTicket(row[1], landline)) continue;
    records.push(networkInspectionRowToHistoryRecord(row, i + 1));
  }
  records.sort((a, b) => b.row - a.row);
  return {
    records,
    total: records.length,
    landline,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID +
      '/edit?gid=' + NETWORK_INSPECTION_SHEET_GID
  };
}

function farshootRowToRecord(headers, row, rowNumber) {
  const record = {};
  for (let c = 0; c < headers.length; c++) {
    if (headers[c]) record[headers[c]] = String(row[c] || '').trim();
  }
  return {
    row: rowNumber,
    headers: headers.filter((h) => h),
    data: record
  };
}

function getFarshootLandlineSearchColumns(headers) {
  const priority = [];
  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i] || '').trim();
    if (!header) continue;
    if (/تذكر|تليفون|أرض|ارض|مسلسل|line|phone/i.test(header)) {
      priority.push(i);
    }
  }
  if (priority.length) return priority;
  const cols = [];
  for (let i = 0; i < headers.length; i++) {
    if (headers[i]) cols.push(i);
  }
  return cols;
}

async function netTechGetGroundFaults(payload) {
  verifyTechAuth(payload.techId, payload.pin);
  const title = await resolveTechNotesSheetTitle();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title.replace(/'/g, "''")}'!A:L`
  });
  const data = res.data.values || [];
  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (isTechNoteRowEmpty(row)) continue;
    const rec = techNoteRowToRecord(row, i + 1);
    if (!isGroundFaultReportType(rec.reportType)) continue;
    if (!isTransferredToNetworksAction(rec.action)) continue;
    records.push(rec);
  }
  records.sort((a, b) => b.row - a.row);
  return {
    records,
    total: records.length,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID +
      '/edit?gid=' + TECH_NOTES_SHEET_GID
  };
}

function networkInspectionRowToListRecord(row, rowNumber) {
  return {
    row: rowNumber,
    dateTime: sheetCellToDateTime(row[0]),
    ticketNumber: String(row[1] || '').trim(),
    originalTech: String(row[2] || '').trim(),
    welder: String(row[3] || '').trim(),
    companion: String(row[4] || '').trim(),
    workCategory: String(row[5] || '').trim(),
    workType: String(row[6] || '').trim(),
    materials: String(row[7] || '').trim(),
    repairStatus: String(row[8] || '').trim(),
    inspectionNotes: String(row[9] || '').trim(),
    cableNumber: String(row[11] || '').trim(),
    cabinetNumber: String(row[12] || '').trim(),
    boxNumber: String(row[13] || '').trim(),
    locationUrl: String(row[14] || '').trim(),
    photoUrl: String(row[15] || '').trim(),
    sourceDateTime: sheetCellToDateTime(row[16])
  };
}

function isUnrepairedNetworkInspectionStatus(status) {
  const normalized = normalizeArabicLabel(status);
  if (!normalized) return false;
  return normalized.includes('جاري') ||
    normalized.includes('يصعب') ||
    normalized.includes('انتظار');
}

async function findOpenNetworkInspectionsForLandline(landline) {
  const targetLandline = normalizeLandlineForMatch(landline);
  if (!targetLandline) return [];
  const title = await resolveNetworkInspectionSheetTitle();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title.replace(/'/g, "''")}'!A:Q`
  });
  const data = res.data.values || [];
  const matches = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowLandline = normalizeLandlineForMatch(String(row[1] || '').trim());
    if (!rowLandline || rowLandline !== targetLandline) continue;
    if (!isUnrepairedNetworkInspectionStatus(row[8])) continue;
    matches.push({
      row: i + 1,
      repairStatus: String(row[8] || '').trim(),
      dateTime: sheetCellToDateTime(row[0])
    });
  }
  matches.sort((a, b) => b.row - a.row);
  return matches;
}

async function assertNoOpenNetworkInspectionForLandline(landline) {
  const matches = await findOpenNetworkInspectionsForLandline(landline);
  if (!matches.length) return;
  const latest = matches[0];
  throw new Error(
    'رقم التليفون ' + landline + ' موجود في شيت فحص الشبكات كعطل مفتوح' +
    (latest.repairStatus ? ' (حالة: ' + latest.repairStatus + ')' : '') +
    '. يرجى التوجه إلى قسم «أعطال أرضية تم فحصها ولم يتم إصلاحها».'
  );
}

async function netTechGetUnrepairedInspections(payload) {
  await verifyTechAuth(payload.techId, payload.pin);
  const title = await resolveNetworkInspectionSheetTitle();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title.replace(/'/g, "''")}'!A:Q`
  });
  const data = res.data.values || [];
  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!String(row[1] || '').trim() && !String(row[8] || '').trim()) continue;
    if (!isUnrepairedNetworkInspectionStatus(row[8])) continue;
    records.push(networkInspectionRowToListRecord(row, i + 1));
  }
  records.sort((a, b) => b.row - a.row);
  return {
    records,
    total: records.length,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID +
      '/edit?gid=' + NETWORK_INSPECTION_SHEET_GID
  };
}

async function netTechCheckOpenNetworkInspection(payload) {
  await verifyTechAuth(payload.techId, payload.pin);
  const landline = String(payload.landline || '').trim();
  if (!landline) throw new Error('رقم التليفون مطلوب');
  const matches = await findOpenNetworkInspectionsForLandline(landline);
  return {
    open: matches.length > 0,
    landline,
    count: matches.length,
    latest: matches.length ? matches[0] : null
  };
}

async function techSearchLandlineData(payload) {
  verifyTechAuth(payload.techId, payload.pin);
  const landline = String(payload.landline || '').trim();
  if (!landline) throw new Error('أدخل رقم التليفون');

  const title = await resolveFarshootDataSheetTitle();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: FARSHOOT_DATA_SPREADSHEET_ID,
    range: `'${title.replace(/'/g, "''")}'!A:ZZ`
  });
  const data = res.data.values || [];
  if (data.length < 2) {
    return { found: false, landline, matches: [], total: 0 };
  }

  const headers = data[0].map((h) => String(h || '').trim());
  const searchCols = getFarshootLandlineSearchColumns(headers);
  const matches = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let matched = false;
    for (let c = 0; c < searchCols.length; c++) {
      if (landlineMatchesSearch(row[searchCols[c]], landline)) {
        matched = true;
        break;
      }
    }
    if (matched) matches.push(farshootRowToRecord(headers, row, i + 1));
  }

  return {
    found: matches.length > 0,
    landline,
    matches,
    total: matches.length
  };
}

async function resolveNetworkInspectionSheetTitle() {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const tabs = meta.data.sheets || [];
  const byName = tabs.find((tab) => tab.properties.title === NETWORK_INSPECTION_SHEET_NAME);
  if (byName) return byName.properties.title;
  const byGid = tabs.find((tab) => tab.properties.sheetId === NETWORK_INSPECTION_SHEET_GID);
  if (byGid) return byGid.properties.title;
  throw new Error('لم يتم العثور على تبويب «' + NETWORK_INSPECTION_SHEET_NAME + '» في الشيت');
}

async function getOrCreateNetworkInspectionDriveFolder(landline) {
  const drive = google.drive({ version: 'v3', auth: getAuth() });
  const q = "mimeType='application/vnd.google-apps.folder' and name='" + NETWORK_INSPECTION_DRIVE_ROOT_NAME.replace(/'/g, "\\'") + "' and trashed=false";
  const listed = await drive.files.list({ q, fields: 'files(id)', spaces: 'drive' });
  let rootId = listed.data.files && listed.data.files[0] ? listed.data.files[0].id : '';
  if (!rootId) {
    const created = await drive.files.create({
      requestBody: { name: NETWORK_INSPECTION_DRIVE_ROOT_NAME, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id'
    });
    rootId = created.data.id;
  }
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const safeLine = String(landline || '').replace(/[^\d]/g, '') || 'line';
  const sub = await drive.files.create({
    requestBody: {
      name: 'فحص_' + safeLine + '_' + stamp,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootId]
    },
    fields: 'id'
  });
  return sub.data.id;
}

async function uploadNetworkInspectionPhoto(base64Data, mimeType, landline, techId) {
  if (!base64Data) return '';
  const bytes = Buffer.from(base64Data, 'base64');
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new Error('حجم الصورة كبير جداً (الحد الأقصى 5 ميغابايت)');
  }
  const mime = String(mimeType || 'image/jpeg').split(';')[0];
  const ext = mime.includes('png') ? 'png' : 'jpg';
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const safeLine = String(landline || '').replace(/[^\d]/g, '') || 'line';
  const fileName = 'net_' + techId + '_' + safeLine + '_' + stamp + '.' + ext;
  const folderId = await getOrCreateNetworkInspectionDriveFolder(landline);
  const drive = google.drive({ version: 'v3', auth: getAuth() });
  const created = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType: mime, body: require('stream').Readable.from(bytes) },
    fields: 'id'
  });
  try {
    await drive.permissions.create({
      fileId: created.data.id,
      requestBody: { role: 'reader', type: 'anyone' }
    });
  } catch (_err) {}
  return 'https://drive.google.com/file/d/' + created.data.id + '/view?usp=drivesdk';
}

function deriveNetworkWorkType(connectionType) {
  const t = String(connectionType || '').trim().toLowerCase();
  if (t === 'ftth') return 'أعمال شبكة فيبر';
  if (t === 'msan') return 'أعمال شبكة نحاس';
  return String(connectionType || '').trim();
}

function normalizeNetworkWorkClassification(value) {
  const raw = normalizeArabicLabel(value);
  for (let i = 0; i < NETWORK_WORK_CLASSIFICATIONS.length; i++) {
    if (normalizeArabicLabel(NETWORK_WORK_CLASSIFICATIONS[i]) === raw) {
      return NETWORK_WORK_CLASSIFICATIONS[i];
    }
  }
  return '';
}

function normalizeNetworkRepairStatus(value) {
  const raw = normalizeArabicLabel(value);
  for (let i = 0; i < NETWORK_REPAIR_STATUSES.length; i++) {
    if (normalizeArabicLabel(NETWORK_REPAIR_STATUSES[i]) === raw) {
      return NETWORK_REPAIR_STATUSES[i];
    }
  }
  return '';
}

async function findGroundFaultSourceRecord(sourceRow, landline, sourceDateTime) {
  const title = await resolveTechNotesSheetTitle();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title.replace(/'/g, "''")}'!A:L`
  });
  const data = res.data.values || [];
  const rowNum = Number(sourceRow);

  if (rowNum >= 2 && rowNum <= data.length) {
    const byRow = data[rowNum - 1];
    if (!isTechNoteRowEmpty(byRow)) {
      const recByRow = techNoteRowToRecord(byRow, rowNum);
      if (isGroundFaultReportType(recByRow.reportType) &&
          isTransferredToNetworksAction(recByRow.action) &&
          recByRow.landline === landline) {
        return recByRow;
      }
    }
  }

  const targetDateTime = String(sourceDateTime || '').trim();
  if (!targetDateTime) return null;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (isTechNoteRowEmpty(row)) continue;
    const rec = techNoteRowToRecord(row, i + 1);
    if (!isGroundFaultReportType(rec.reportType)) continue;
    if (!isTransferredToNetworksAction(rec.action)) continue;
    if (rec.landline !== landline) continue;
    if (rec.dateTime === targetDateTime) return rec;
  }

  return null;
}

async function netTechSubmitNetworkInspection(payload) {
  await verifyTechAuth(payload.techId, payload.pin);

  const landline = String(payload.landline || '').trim();
  if (!landline) throw new Error('رقم التليفون مطلوب');

  const sourceDateTimeInput = String(payload.sourceDateTime || '').trim();
  const sourceRow = Number(payload.sourceRow || 0);
  if (!sourceDateTimeInput && !sourceRow) {
    throw new Error('يجب اختيار سجل العطل من الجدول (الرقم مع التاريخ والوقت)');
  }

  const sourceRecord = await findGroundFaultSourceRecord(sourceRow, landline, sourceDateTimeInput);
  if (!sourceRecord) {
    throw new Error('تعذر ربط الفحص بسجل العطل المحدد — حدّث الجدول واختر السجل من جديد');
  }
  const sourceDateTime = sourceRecord.dateTime || sourceDateTimeInput;

  const fromUnrepairedTab = payload.fromUnrepairedTab === true || String(payload.fromUnrepairedTab || '') === 'true';
  if (!fromUnrepairedTab) {
    await assertNoOpenNetworkInspectionForLandline(landline);
  }

  const welderName = String(payload.welderName || '').trim();
  if (!welderName) throw new Error('اللحاميين القائمين بالعمل مطلوبون');

  const workClassification = normalizeNetworkWorkClassification(payload.workClassification);
  if (!workClassification) throw new Error('اختر تصنيف الأعمال من القائمة');

  const repairStatus = normalizeNetworkRepairStatus(payload.repairStatus);
  if (!repairStatus) throw new Error('اختر حالة الإصلاح من القائمة');

  const photoBase64 = String(payload.photoBase64 || '').trim();
  if (!photoBase64) throw new Error('يجب التقاط صورة للفحص');

  const location = payload.location || null;
  if (!location || location.lat == null || location.lng == null) {
    throw new Error('يجب التقاط الصورة مع الموقع — اضغط «التقاط صورة مع الموقع»');
  }
  const mapsUrl = 'https://www.google.com/maps?q=' + Number(location.lat) + ',' + Number(location.lng);

  const techId = String(payload.techId || '').trim();
  const originalTech = String(payload.originalTech || sourceRecord.tech || '').trim();
  const companionWorker = String(payload.companionWorker || '').trim();
  const materialsUsed = String(payload.materialsUsed || '').trim();
  const reportAckName = String(payload.reportAckName || '').trim();
  const inspectionNotes = String(payload.inspectionNotes || '').trim();
  const cableNumber = String(payload.cableNumber || sourceRecord.cableNumber || '').trim();
  const cabinetNumber = String(payload.cabinetNumber || sourceRecord.cabinetNumber || '').trim();
  const boxNumber = String(payload.boxNumber || sourceRecord.boxNumber || '').trim();
  const workType = deriveNetworkWorkType(payload.connectionType || sourceRecord.connectionType);
  const photoUrl = await uploadNetworkInspectionPhoto(photoBase64, payload.photoMimeType, landline, techId);
  const now = formatPreviewDateTime(new Date());

  const title = await resolveNetworkInspectionSheetTitle();
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title.replace(/'/g, "''")}'!A:Q`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        now,
        landline,
        originalTech,
        welderName,
        companionWorker,
        workClassification,
        workType,
        materialsUsed,
        repairStatus,
        inspectionNotes,
        reportAckName,
        cableNumber,
        cabinetNumber,
        boxNumber,
        mapsUrl,
        photoUrl,
        sourceDateTime
      ]]
    }
  });

  return {
    success: true,
    message: 'تم حفظ فحص العطل الأرضي في شيت فحص الشبكات بنجاح'
  };
}

async function centralGetGroundRepairs(payload) {
  verifyCentralAuth(payload.pin);
  const source = String(payload.source || 'archive').trim();
  const useInspection = source === 'inspection';
  const title = useInspection
    ? await resolveNetworkInspectionSheetTitle()
    : await resolveNetworkArchiveSheetTitle();
  const sheetGid = useInspection ? NETWORK_INSPECTION_SHEET_GID : NETWORK_ARCHIVE_SHEET_GID;
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title.replace(/'/g, "''")}'!A:P`
  });
  const data = res.data.values || [];
  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (isNetworkArchiveRowEmpty(row)) continue;
    records.push(networkArchiveFullRowToRecord(row, i + 1));
  }
  records.sort((a, b) => b.row - a.row);
  return {
    records,
    total: records.length,
    source: useInspection ? 'inspection' : 'archive',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID +
      '/edit?gid=' + sheetGid
  };
}

async function centralGetTechnicianNotes(payload) {
  verifyCentralAuth(payload.pin);
  const title = await resolveTechNotesSheetTitle();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title.replace(/'/g, "''")}'!A:L`
  });
  const data = res.data.values || [];
  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (isTechNoteRowEmpty(row)) continue;
    records.push(techNoteRowToRecord(row, i + 1));
  }
  records.sort((a, b) => b.row - a.row);
  return {
    records,
    total: records.length,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID +
      '/edit?gid=' + TECH_NOTES_SHEET_GID
  };
}

async function resolveTechNotesSheetTitle() {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const tabs = meta.data.sheets || [];
  const byName = tabs.find((tab) => tab.properties.title === TECH_NOTES_SHEET_NAME);
  if (byName) return byName.properties.title;
  const byGid = tabs.find((tab) => tab.properties.sheetId === TECH_NOTES_SHEET_GID);
  if (byGid) return byGid.properties.title;
  throw new Error('لم يتم العثور على تبويب «' + TECH_NOTES_SHEET_NAME + '» في الشيت');
}

async function getOrCreateTechNotesDriveFolder(landline) {
  const drive = google.drive({ version: 'v3', auth: getAuth() });
  const q = "mimeType='application/vnd.google-apps.folder' and name='" + TECH_NOTES_DRIVE_ROOT_NAME.replace(/'/g, "\\'") + "' and trashed=false";
  const listed = await drive.files.list({ q, fields: 'files(id)', spaces: 'drive' });
  let rootId = listed.data.files && listed.data.files[0] ? listed.data.files[0].id : '';
  if (!rootId) {
    const created = await drive.files.create({
      requestBody: { name: TECH_NOTES_DRIVE_ROOT_NAME, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id'
    });
    rootId = created.data.id;
  }
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const safeLine = String(landline || '').replace(/[^\d]/g, '') || 'line';
  const sub = await drive.files.create({
    requestBody: {
      name: 'ملاحظة_' + safeLine + '_' + stamp,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootId]
    },
    fields: 'id'
  });
  return sub.data.id;
}

async function uploadTechNotePhoto(base64Data, mimeType, landline, techId) {
  if (!base64Data) return '';
  const bytes = Buffer.from(base64Data, 'base64');
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new Error('حجم الصورة كبير جداً (الحد الأقصى 5 ميغابايت)');
  }
  const mime = String(mimeType || 'image/jpeg').split(';')[0];
  const ext = mime.includes('png') ? 'png' : 'jpg';
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const safeLine = String(landline || '').replace(/[^\d]/g, '') || 'line';
  const fileName = 'note_' + techId + '_' + safeLine + '_' + stamp + '.' + ext;
  const folderId = await getOrCreateTechNotesDriveFolder(landline);
  const drive = google.drive({ version: 'v3', auth: getAuth() });
  const created = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType: mime, body: require('stream').Readable.from(bytes) },
    fields: 'id'
  });
  try {
    await drive.permissions.create({
      fileId: created.data.id,
      requestBody: { role: 'reader', type: 'anyone' }
    });
  } catch (_err) {}
  return 'https://drive.google.com/file/d/' + created.data.id + '/view?usp=drivesdk';
}

function validateTechNoteLandlineOrLines(reportType, value) {
  const type = String(reportType || '').trim();
  const raw = String(value || '').trim();
  if (type === 'اعمال صيانة') {
    const n = parseInt(raw, 10);
    if (!raw || !/^\d+$/.test(raw) || n < 1) {
      throw new Error('أدخل عدد الخطوط (رقم صحيح موجب)');
    }
    return String(n);
  }
  return validateLandline(raw);
}

async function techSubmitTechnicianNote(payload) {
  const found = await verifyTechAuth(payload.techId, payload.pin);

  const reportType = String(payload.reportType || '').trim();
  if (!TECH_NOTE_REPORT_TYPES.includes(reportType)) {
    throw new Error('اختر نوع الإبلاغ من القائمة');
  }

  const landline = validateTechNoteLandlineOrLines(reportType, payload.landline);

  const actionTaken = String(payload.actionTaken || '').trim();
  if (!TECH_NOTE_ACTIONS.includes(actionTaken)) {
    throw new Error('اختر الإجراء المتخذ من القائمة');
  }

  const notes = String(payload.notes || '').trim();
  if (!notes) throw new Error('الملاحظات مطلوبة');

  const cableNumber = String(payload.cableNumber || '').trim();
  if (!cableNumber) throw new Error('رقم الكابل مطلوب');
  const cabinetNumber = String(payload.cabinetNumber || '').trim();
  if (!cabinetNumber) throw new Error('رقم الكابينة مطلوب');
  const boxNumber = String(payload.boxNumber || '').trim();
  if (!boxNumber) throw new Error('رقم البكس مطلوب');

  const connectionType = String(payload.connectionType || '').trim().toLowerCase();
  if (!TECH_NOTE_CONNECTION_TYPES.includes(connectionType)) {
    throw new Error('اختر النوع (msan أو ftth) من القائمة');
  }

  const photoBase64 = String(payload.photoBase64 || '').trim();
  if (!photoBase64) throw new Error('يجب التقاط صورة للإبلاغ');

  const location = payload.location || null;
  if (!location || location.lat == null || location.lng == null) {
    throw new Error('يجب التقاط الصورة مع الموقع — اضغط «التقاط صورة مع الموقع»');
  }

  const techId = String(payload.techId || '').trim();
  const techName = String(found.values[TECH_COL.NAME - 1] || '').trim();
  const mapsUrl = 'https://www.google.com/maps?q=' + Number(location.lat) + ',' + Number(location.lng);
  const photoUrl = await uploadTechNotePhoto(photoBase64, payload.photoMimeType, landline, techId);

  const sheets = getSheets();
  const title = await resolveTechNotesSheetTitle();
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title.replace(/'/g, "''")}'!A1:L1`
  });
  const firstRow = (existing.data.values || [])[0] || [];
  if (!firstRow.length || TECH_NOTES_SHEET_HEADERS.every((_h, i) => !firstRow[i])) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${title.replace(/'/g, "''")}'!A1:L1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [TECH_NOTES_SHEET_HEADERS] }
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title.replace(/'/g, "''")}'!A:L`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        formatPreviewDateTime(new Date()),
        landline,
        techName,
        reportType,
        notes,
        connectionType,
        cableNumber,
        cabinetNumber,
        boxNumber,
        mapsUrl,
        photoUrl,
        actionTaken
      ]]
    }
  });

  return { success: true, message: 'تم حفظ الإبلاغ في شيت ملاحظات الفنيين بنجاح' };
}

function hasCredentials() {
  return Boolean(findCredentialsPath());
}

module.exports = {
  submitReport,
  getStatus,
  startChat,
  getConversation,
  sendCustomerMessage,
  submitRating,
  reopenTicket,
  submitNewComplaint,
  centralListTickets,
  centralGetTicket,
  centralUpdateTicket,
  centralForwardTechPhoto,
  centralAddRepairedLandline,
  centralListRatedTickets,
  techList,
  techAdd,
  techUpdateStatus,
  assignTechnician,
  techLogin,
  techListTasks,
  techGetTask,
  techSendMessage,
  centralSendTechMessage,
  centralCreateTechInspection,
  centralListTechInspections,
  centralGetTechInspection,
  centralCloseTechInspection,
  techSearchSerialData,
  techSubmitPreviewInspection,
  centralGetPreviewInspections,
  centralGetTechnicianNotes,
  centralGetGroundRepairs,
  techSubmitTechnicianNote,
  netTechGetGroundFaults,
  techSearchLandlineData,
  netTechSubmitNetworkInspection,
  netTechGetNetworkArchive,
  netTechGetNetworkInspectionHistory,
  netTechGetUnrepairedInspections,
  netTechCheckOpenNetworkInspection,
  hasCredentials,
  resolveSheetTitle
};
