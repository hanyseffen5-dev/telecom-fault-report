/**
 * تطبيق إبلاغ أعطال الخط الأرضي
 * Google Apps Script — ربط بـ Google Sheet
 */

const SPREADSHEET_ID = '1T5agEVNB6lLNkkiqjaXSufoE3gF59bH1_wLhWC0h_0A';
const SHEET_GID = 80364727;
const SHEET_NAME = 'ابلاغ عميل';

/** شيت فرشوط — تبويب بيانات المسلسلات (تعذر معاينة) */
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

/* ============================================================
 * تبويب الفنيين وتبويب الرسائل (نظام المهام الثلاثي)
 * ============================================================ */

const TECH_SHEET_NAME = 'الفنيين';
const TECH_HEADERS = ['tech_id', 'الاسم', 'رقم التليفون', 'PIN', 'الحالة'];
const TECH_COL = { ID: 1, NAME: 2, PHONE: 3, PIN: 4, STATUS: 5 };

const MSG_SHEET_NAME = 'الرسائل';
const MSG_HEADERS = ['msg_id', 'ticket_row', 'sender_type', 'sender_id', 'recipient_id', 'النص', 'رابط_المرفق', 'التاريخ'];
const MSG_COL = { ID: 1, TICKET_ROW: 2, SENDER_TYPE: 3, SENDER_ID: 4, RECIPIENT_ID: 5, TEXT: 6, ATTACHMENT: 7, DATE: 8 };

const SENDER_CUSTOMER = 'عميل';
const SENDER_CENTRAL = 'إدارة';
const SENDER_TECH = 'فني';

const RECIPIENT_CENTRAL = 'central';
const RECIPIENT_CUSTOMER = 'customer';
/** مستلم رسالة سنترال موجّهة لجميع فنيي مهمة الفحص المشتركة */
const RECIPIENT_ALL_TECHS = 'all-techs';

const TECH_STATUS_AVAILABLE = 'متاح';
const TECH_STATUS_BUSY = 'مشغول';
const TECH_STATUS_INACTIVE = 'غير نشط';
const TECH_STATUSES = [TECH_STATUS_AVAILABLE, TECH_STATUS_BUSY, TECH_STATUS_INACTIVE];

const ANNOUNCEMENTS_SHEET_NAME = 'إعلانات_الفنيين';
const ANNOUNCEMENTS_HEADERS = ['ann_id', 'النوع', 'العنوان', 'المحتوى', 'معرّفات_الفنيين', 'أسماء_الفنيين', 'التاريخ', 'رابط_الصورة'];
const ANN_COL = { ID: 1, TYPE: 2, TITLE: 3, BODY: 4, TECH_IDS: 5, TECH_NAMES: 6, DATE: 7, IMAGE: 8 };
const ANNOUNCEMENTS_DRIVE_ROOT_NAME = 'مرفقات_إعلانات_الفنيين';
const ANN_TYPES = ['إعلان', 'تعليمات'];

const CHANNEL_OPEN = 'مفتوحة';
const CHANNEL_CLOSED = 'مغلقة';
/** مهمة فحص لعدة فنيين — قبل أول رد */
const INSPECTION_MULTI = 'multi';
/** مهمة فحص مشتركة — بعد أول رد من أحد الفنيين */
const INSPECTION_SHARED = 'multi:shared';

const RATING_FLAG_YES = 'نعم';
const RATING_FLAG_NO = 'لا';

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

/** نوع السجل عند بدء محادثة جديدة مع السنترال (بدلاً من بلاغ عطل) */
const CHAT_REASON = 'تواصل مع السنترال';
/** مهمة فحص يرسلها السنترال مباشرة للفني — بدون محادثة عميل */
const TECH_INSPECTION_REASON = 'فحص فني — سنترال';
const MAX_MESSAGE_LENGTH = 1000;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const TECH_DRIVE_ROOT_NAME = 'مرفقات_فني_فرشوط';
const CUSTOMER_MSG_PREFIX = 'العميل: ';
const CUSTOMER_PHOTO_TAG = '[صورة]';
const COMPLAINT_REOPEN_DAYS = 5;

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
    } else if (fn === 'startChat') {
      result = startChat(payload);
    } else if (fn === 'getConversation') {
      result = getConversation(payload);
    } else if (fn === 'sendCustomerMessage') {
      result = sendCustomerMessage(payload);
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
    } else if (fn === 'techList') {
      result = techList(payload);
    } else if (fn === 'techAdd') {
      result = techAdd(payload);
    } else if (fn === 'techUpdateStatus') {
      result = techUpdateStatus(payload);
    } else if (fn === 'assignTechnician') {
      result = assignTechnician(payload);
    } else if (fn === 'techLogin') {
      result = techLogin(payload);
    } else if (fn === 'techListTasks') {
      result = techListTasks(payload);
    } else if (fn === 'techGetTask') {
      result = techGetTask(payload);
    } else if (fn === 'techSendMessage') {
      result = techSendMessage(payload);
    } else if (fn === 'centralSendTechMessage') {
      result = centralSendTechMessage(payload);
    } else if (fn === 'centralForwardTechPhoto') {
      result = centralForwardTechPhoto(payload);
    } else if (fn === 'centralCreateTechInspection') {
      result = centralCreateTechInspection(payload);
    } else if (fn === 'centralListTechInspections') {
      result = centralListTechInspections(payload);
    } else if (fn === 'centralGetTechInspection') {
      result = centralGetTechInspection(payload);
    } else if (fn === 'centralCloseTechInspection') {
      result = centralCloseTechInspection(payload);
    } else if (fn === 'techSearchSerialData') {
      result = techSearchSerialData(payload);
    } else if (fn === 'techSubmitPreviewInspection') {
      result = techSubmitPreviewInspection(payload);
    } else if (fn === 'centralGetPreviewInspections') {
      result = centralGetPreviewInspections(payload);
    } else if (fn === 'centralGetTechnicianNotes') {
      result = centralGetTechnicianNotes(payload);
    } else if (fn === 'centralGetGroundRepairs') {
      result = centralGetGroundRepairs(payload);
    } else if (fn === 'techSubmitTechnicianNote') {
      result = techSubmitTechnicianNote(payload);
    } else if (fn === 'netTechGetGroundFaults') {
      result = netTechGetGroundFaults(payload);
    } else if (fn === 'techSearchLandlineData') {
      result = techSearchLandlineData(payload);
    } else if (fn === 'netTechSubmitNetworkInspection') {
      result = netTechSubmitNetworkInspection(payload);
    } else if (fn === 'netTechGetNetworkArchive') {
      result = netTechGetNetworkArchive(payload);
    } else if (fn === 'netTechGetUnrepairedInspections') {
      result = netTechGetUnrepairedInspections(payload);
    } else if (fn === 'netTechCheckOpenNetworkInspection') {
      result = netTechCheckOpenNetworkInspection(payload);
    } else if (fn === 'netTechGetNetworkInspectionHistory') {
      result = netTechGetNetworkInspectionHistory(payload);
    } else if (fn === 'centralCreateTechAnnouncement') {
      result = centralCreateTechAnnouncement(payload);
    } else if (fn === 'centralListTechAnnouncements') {
      result = centralListTechAnnouncements(payload);
    } else if (fn === 'techListAnnouncements') {
      result = techListAnnouncements(payload);
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

/** أحدث صف عميل للخط — يستثني مهام الفحص الداخلية (سنترال ↔ فني) */
function findLatestCustomerRowByLandline_(landline) {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const targetLandline = normalizeLandlineForMatch_(landline);

  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    if (isTechInspectionRow_(row)) continue;
    const rowLandline = normalizeLandlineForMatch_(row[COL.LANDLINE - 1]);
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
  const latest = findLatestCustomerRowByLandline_(landline);

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
  const latest = findLatestCustomerRowByLandline_(landline);

  if (latest.row === -1) {
    return 'لم يتم العثور على اى تواصل لهذا الرقم الأرضي. تأكد من رقم التليفون الأرضي.';
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

function isTechInspectionRow_(row) {
  return String(row[COL.REASON - 1] || '').trim() === TECH_INSPECTION_REASON;
}

function extractTechInspectionNote_(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  const m = text.match(/\[فحص فني\]\s*(.+)/);
  if (m) return m[1].split('\n')[0].trim();
  return text.split('\n')[0].trim();
}

/** أحدث صف لكل خط أرضي — للعرض في لوحة السنترال فقط */
function getLatestRowByLine_(data) {
  const latest = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;
    if (isTechInspectionRow_(row)) continue;
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
    if (isTechInspectionRow_(row)) continue;

    const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate_(row[COL.LAST_UPDATE - 1]) : '';
    const notifications = parseNotifications_(row[COL.NOTIFICATION - 1], lastUpdate);

    archive.push({
      row: rowNumber,
      date: row[COL.DATE - 1] ? formatDate_(row[COL.DATE - 1]) : '',
      lastUpdate: lastUpdate,
      reason: String(row[COL.REASON - 1] || ''),
      status: String(row[COL.STATUS - 1] || STATUS_NEW),
      notifications: notifications,
      techMessages: getMessagesForTicket_(rowNumber),
      lastNotification: notifications.length ? notifications[notifications.length - 1].text : ''
    });
  }

  archive.sort(function (a, b) {
    return b.row - a.row;
  });

  return archive;
}

/** أرشيف الخط لصفحة مهام الفحص — يشمل الشكاوى السابقة ومهام الفحص بدون محادثة الفني */
function getInspectionPageArchive_(landline, excludeRow) {
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

    const isInspection = isTechInspectionRow_(row);
    const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate_(row[COL.LAST_UPDATE - 1]) : '';
    const notifications = parseNotifications_(row[COL.NOTIFICATION - 1], lastUpdate);

    archive.push({
      row: rowNumber,
      date: row[COL.DATE - 1] ? formatDate_(row[COL.DATE - 1]) : '',
      lastUpdate: lastUpdate,
      reason: String(row[COL.REASON - 1] || ''),
      status: String(row[COL.STATUS - 1] || STATUS_NEW),
      notifications: notifications,
      techMessages: isInspection ? [] : getMessagesForTicket_(rowNumber),
      lastNotification: notifications.length ? notifications[notifications.length - 1].text : '',
      isInspection: isInspection,
      inspectionNote: isInspection ? extractTechInspectionNote_(row[COL.NOTIFICATION - 1]) : ''
    });
  }

  archive.sort(function (a, b) {
    return b.row - a.row;
  });

  return archive;
}

function countTicketArchive_(landline, excludeRow) {
  const data = getSheet_().getDataRange().getValues();
  const targetLandline = normalizeLandlineForMatch_(landline);
  let count = 0;

  for (let i = 1; i < data.length; i++) {
    const rowNumber = i + 1;
    if (rowNumber === excludeRow) continue;
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;
    if (normalizeLandlineForMatch_(row[COL.LANDLINE - 1]) !== targetLandline) continue;
    count++;
  }

  return count;
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
  const windowInfo = getReopenWindowInfo_(row);

  return {
    row: rowNumber || 0,
    date: windowInfo.complaintDate,
    landline: String(row[COL.LANDLINE - 1] || ''),
    reason: String(row[COL.REASON - 1] || ''),
    mobile: String(row[COL.MOBILE - 1] || ''),
    status: status,
    notifications: notifications,
    notification: notifications.length ? notifications[notifications.length - 1].text : '',
    lastUpdate: lastUpdate,
    resolutionDate: windowInfo.resolutionDate,
    reopenDeadline: windowInfo.reopenDeadline,
    reopenWindowExpired: windowInfo.reopenWindowExpired,
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
    canReopen: canReopenRow_(row),
    canSendMessage: canSendCustomerMessage_(row),
    isArchiveComplaint: isArchiveComplaintRow_(row),
    alreadyRated: !!(row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1]),
    canOpenNewComplaint: isResolvedStatus_(status) && (
      (isTicketRated_(row) && !isWithinPostRatingReopenWindow_(row)) ||
      isArchiveComplaintRow_(row) ||
      (!isTicketRated_(row) && windowInfo.reopenWindowExpired)
    ),
    canSendNotification: canCentralSendNotification_(status, notifications),
    mobileRegistered: !isEmptyMobile_(row[COL.MOBILE - 1]),
    assignedTech: String(row[COL.ASSIGNED_TECH - 1] || ''),
    custTechChannel: String(row[COL.CUST_TECH_CHANNEL - 1] || CHANNEL_CLOSED),
    driveFolder: String(row[COL.DRIVE_FOLDER - 1] || ''),
    isTechInspection: isTechInspectionRow_(row),
    inspectionNote: isTechInspectionRow_(row) ? extractTechInspectionNote_(row[COL.NOTIFICATION - 1]) : ''
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
    if (isTechInspectionRow_(row)) continue;

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
      alreadyRated: !!(row[COL.RATING_FAULT - 1] || row[COL.RATING_TECH - 1]),
      assignedTech: String(row[COL.ASSIGNED_TECH - 1] || '')
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
  ticket.techMessages = getMessagesForTicket_(rowNumber);
  return ticket;
}

function centralUpdateTicket(payload) {
  verifyCentralAuth_(payload.pin);
  ensureHeaders_();

  const rowNumber = Number(payload.row);
  const status = String(payload.status || '').trim();
  const message = String(payload.message || '').trim();
  const photoUrl = String(payload.photoUrl || '').trim().replace(/&amp;/g, '&');
  const photoCaption = String(payload.photoCaption || 'صورة من الفني').trim();
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
    if (isResolvedStatus_(status)) {
      result.sheet.getRange(rowNumber, COL.RATING_FLAG).setValue(RATING_FLAG_YES);
    }
  }

  let notifLine = '';
  if (message && photoUrl && photoUrl.indexOf('http') === 0) {
    notifLine = 'السنترال: ' + message + ' ' + CUSTOMER_PHOTO_TAG + photoUrl + '|' + photoCaption;
  } else if (message) {
    notifLine = 'السنترال: ' + message;
  } else if (photoUrl && photoUrl.indexOf('http') === 0) {
    notifLine = 'السنترال: ' + CUSTOMER_PHOTO_TAG + photoUrl + '|' + photoCaption;
  }

  if (notifLine) {
    const existing = result.row[COL.NOTIFICATION - 1];
    const updated = appendNotificationLine_(existing, notifLine, now);
    result.sheet.getRange(rowNumber, COL.NOTIFICATION).setValue(updated);
  }

  if (!status && !notifLine) {
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

/** إرسال صورة من الفني إلى محادثة العميل */
function centralForwardTechPhoto(payload) {
  verifyCentralAuth_(payload.pin);
  ensureHeaders_();

  const rowNumber = Number(payload.row);
  const photoUrl = String(payload.photoUrl || '').trim().replace(/&amp;/g, '&');
  const caption = String(payload.caption || 'صورة من الفني').trim();

  if (!photoUrl || photoUrl.indexOf('http') !== 0) {
    throw new Error('رابط الصورة غير صالح');
  }

  const result = getTicketRow_(rowNumber);
  const lastUpdate = result.row[COL.LAST_UPDATE - 1] ? formatDate_(result.row[COL.LAST_UPDATE - 1]) : '';
  const currentNotifications = parseNotifications_(result.row[COL.NOTIFICATION - 1], lastUpdate);
  const currentStatus = String(result.row[COL.STATUS - 1] || STATUS_NEW);

  if (!canCentralSendNotification_(currentStatus, currentNotifications)) {
    throw new Error('لا يمكن الإرسال — المحادثة منتهية حتى يرسل العميل رسالة جديدة');
  }

  const line = 'السنترال: ' + CUSTOMER_PHOTO_TAG + photoUrl + '|' + caption;
  const now = new Date();
  const updated = appendNotificationLine_(result.row[COL.NOTIFICATION - 1], line, now);
  result.sheet.getRange(rowNumber, COL.NOTIFICATION).setValue(updated);
  result.sheet.getRange(rowNumber, COL.LAST_UPDATE).setValue(now);

  if (currentStatus === STATUS_NEW) {
    result.sheet.getRange(rowNumber, COL.STATUS).setValue(STATUS_IN_PROGRESS);
  }

  const updatedTicket = rowToObject_(
    result.sheet.getRange(rowNumber, 1, 1, HEADERS.length).getValues()[0],
    rowNumber
  );
  updatedTicket.archive = getTicketArchive_(updatedTicket.landline, updatedTicket.mobile, rowNumber);
  updatedTicket.techMessages = getMessagesForTicket_(rowNumber);

  return {
    success: true,
    message: 'تم إرسال الصورة للعميل',
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
const CENTRAL_REPAIRED_NOTIFICATION = 'تم إصلاح العطل بنجاح';

function isRatingEligibleRow_(row) {
  const flag = String(row[COL.RATING_FLAG - 1] || '').trim();
  if (flag === RATING_FLAG_YES) return true;
  if (flag === RATING_FLAG_NO) return false;
  // توافق مع السجلات القديمة قبل عمود «تقييم متاح»
  const notification = String(row[COL.NOTIFICATION - 1] || '');
  return notification.indexOf(RATING_ENABLED_MARKER) !== -1;
}

function parseNotificationDate_(dateStr) {
  const m = String(dateStr || '').match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]));
  return isNaN(d.getTime()) ? null : d;
}

function findCentralCompletionNotification_(notifications) {
  let lastMatch = null;
  (notifications || []).forEach(function (n) {
    const text = String(n.text || '');
    if (text.indexOf('السنترال:') !== 0) return;
    const body = text.replace(/^السنترال:\s*/, '');
    if (body.indexOf('تم الانتهاء من طلبكم') !== -1 ||
        body.indexOf('تم الحل') !== -1 ||
        isCentralResolutionMessage_(text)) {
      lastMatch = n;
    }
  });
  return lastMatch;
}

function getCompletionDateFromRow_(row) {
  const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate_(row[COL.LAST_UPDATE - 1]) : '';
  const notifications = parseNotifications_(row[COL.NOTIFICATION - 1], lastUpdate);
  const completion = findCentralCompletionNotification_(notifications);
  if (completion && completion.date) {
    const parsed = parseNotificationDate_(completion.date);
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

function isWithinReopenWindow_(row) {
  if (!isResolvedStatus_(String(row[COL.STATUS - 1] || ''))) return true;
  const completionDate = getCompletionDateFromRow_(row);
  if (!completionDate) return true;
  const diffDays = (Date.now() - completionDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= COMPLAINT_REOPEN_DAYS;
}

function getRatingDateFromRow_(row) {
  if (!isTicketRated_(row)) return null;
  if (row[COL.LAST_UPDATE - 1]) {
    const d = row[COL.LAST_UPDATE - 1] instanceof Date
      ? row[COL.LAST_UPDATE - 1]
      : new Date(row[COL.LAST_UPDATE - 1]);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function isWithinPostRatingReopenWindow_(row) {
  if (!isTicketRated_(row)) return false;
  const ratingDate = getRatingDateFromRow_(row);
  if (!ratingDate) return true;
  const diffDays = (Date.now() - ratingDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= COMPLAINT_REOPEN_DAYS;
}

function getReopenWindowInfo_(row) {
  const complaintDate = row[COL.DATE - 1] ? formatDate_(row[COL.DATE - 1]) : '';
  let resolutionDate = '';
  let reopenDeadline = '';
  let reopenWindowExpired = false;

  if (isResolvedStatus_(String(row[COL.STATUS - 1] || ''))) {
    if (isTicketRated_(row)) {
      const ratingDate = getRatingDateFromRow_(row);
      if (ratingDate) {
        resolutionDate = formatDate_(ratingDate);
        const deadline = new Date(ratingDate.getTime());
        deadline.setDate(deadline.getDate() + COMPLAINT_REOPEN_DAYS);
        reopenDeadline = formatDate_(deadline);
        reopenWindowExpired = !isWithinPostRatingReopenWindow_(row);
      }
    } else {
      const completionDate = getCompletionDateFromRow_(row);
      if (completionDate) {
        resolutionDate = formatDate_(completionDate);
        const deadline = new Date(completionDate.getTime());
        deadline.setDate(deadline.getDate() + COMPLAINT_REOPEN_DAYS);
        reopenDeadline = formatDate_(deadline);
        reopenWindowExpired = !isWithinReopenWindow_(row);
      }
    }
  }

  return {
    complaintDate: complaintDate,
    resolutionDate: resolutionDate,
    reopenDeadline: reopenDeadline,
    reopenWindowExpired: reopenWindowExpired
  };
}

function canSendCustomerMessage_(row) {
  if (isTechInspectionRow_(row)) return false;
  const status = String(row[COL.STATUS - 1] || STATUS_NEW);
  if (!isResolvedStatus_(status)) return true;
  if (isTicketRated_(row)) return isWithinPostRatingReopenWindow_(row);
  return isWithinReopenWindow_(row);
}

function canReopenRow_(row) {
  const status = String(row[COL.STATUS - 1] || STATUS_NEW);
  if (!isResolvedStatus_(status)) return false;
  if (!isRatingEligibleRow_(row)) return false;
  if (isTicketRated_(row)) return isWithinPostRatingReopenWindow_(row);
  return isWithinReopenWindow_(row);
}

function isArchiveComplaintRow_(row) {
  return isResolvedStatus_(String(row[COL.STATUS - 1] || '')) && !isRatingEligibleRow_(row);
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

  const latest = findLatestCustomerRowByLandline_(landline);
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
    '',
    RATING_FLAG_YES
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
    '',
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

  if (!canReopenRow_(result.data[result.index])) {
    if (isTicketRated_(result.data[result.index]) && !isWithinPostRatingReopenWindow_(result.data[result.index])) {
      throw new Error('انتهت مدة إعادة فتح الشكوى (5 أيام من تاريخ التقييم). يمكنك فتح شكوى جديدة.');
    }
    if (!isWithinReopenWindow_(result.data[result.index])) {
      throw new Error('انتهت مدة إعادة فتح الشكوى (5 أيام من تاريخ إنهاء السنترال للطلب)');
    }
    throw new Error('إعادة الفتح غير متاحة لهذا البلاغ');
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
    '',
    ''
  ]);

  return {
    success: true,
    message: 'تم فتح شكوى جديدة على نفس الخط. سيتم متابعتها من السنترال.',
    landline: landline,
    mobile: mobile
  };
}

/* ============================================================
 * محادثة العميل مع السنترال (دردشة بدلاً من بلاغ عطل)
 * ============================================================ */

function createChatRow_(landline, mobile, deviceFp, initialMessage) {
  const sheet = getSheet_();
  const now = new Date();
  let notification = '';
  const msg = String(initialMessage || '').trim();
  if (msg) {
    notification = appendNotificationLine_('', CUSTOMER_MSG_PREFIX + msg, now);
  }
  sheet.appendRow([
    now,
    landline,
    CHAT_REASON,
    mobile,
    STATUS_NEW,
    notification,
    now,
    '',
    '',
    '',
    deviceFp || '',
    '',
    ''
  ]);
  const rowNumber = sheet.getLastRow();
  return { sheet: sheet, rowNumber: rowNumber };
}

function buildFreshChatView_(ticket, row) {
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

function shouldShowFreshChatView_(row) {
  const status = String(row[COL.STATUS - 1] || STATUS_NEW);
  if (!isResolvedStatus_(status) || !isTicketRated_(row)) return false;
  return !isWithinPostRatingReopenWindow_(row);
}

/**
 * بدء/فتح محادثة: يطابق برقم الأرضي + الموبايل، ويُنشئ محادثة جديدة إن لم توجد.
 */
function startChat(payload) {
  ensureHeaders_();

  const landline = validateLandline_(payload.landline);
  const mobile = validateMobile_(payload.mobile);
  const deviceFp = validateDeviceFp_(payload.deviceFp, true);

  const latest = findLatestCustomerRowByLandline_(landline);

  if (latest.row === -1) {
    const created = createChatRow_(landline, mobile, deviceFp);
    const ticket = rowToObject_(
      created.sheet.getRange(created.rowNumber, 1, 1, HEADERS.length).getValues()[0],
      created.rowNumber
    );
    ticket.deviceTrusted = true;
    ticket.deviceFpBound = true;
    ticket.isNewConversation = true;
    return ticket;
  }

  const storedMobileRaw = latest.data[latest.index][COL.MOBILE - 1];

  if (isEmptyMobile_(storedMobileRaw)) {
    registerCustomerMobile_(latest.sheet, latest.row, mobile, deviceFp);
    latest.data[latest.index][COL.MOBILE - 1] = mobile;
  } else if (normalizeMobileForMatch_(storedMobileRaw) !== normalizeMobileForMatch_(mobile)) {
    throw new Error('رقم الموبايل مختلف عن الرقم المسجّل مسبقاً لهذا الخط. استخدم رقمك الصحيح أو غيّره من «تغيير رقم الموبايل».');
  }

  const latestStatus = String(latest.data[latest.index][COL.STATUS - 1] || STATUS_NEW);
  if (shouldShowFreshChatView_(latest.data[latest.index])) {
    const ticket = rowToObject_(latest.data[latest.index], latest.row);
    const deviceInfo = bindOrVerifyDeviceFp_(latest.sheet, latest.row, latest.data[latest.index], deviceFp);
    ticket.deviceTrusted = deviceInfo.deviceTrusted;
    ticket.deviceFpBound = deviceInfo.deviceFpBound;
    ticket.deviceFp = deviceInfo.deviceFp || ticket.deviceFp;
    return buildFreshChatView_(ticket, latest.data[latest.index]);
  }

  const ticket = rowToObject_(latest.data[latest.index], latest.row);
  const deviceInfo = bindOrVerifyDeviceFp_(latest.sheet, latest.row, latest.data[latest.index], deviceFp);
  ticket.deviceTrusted = deviceInfo.deviceTrusted;
  ticket.deviceFpBound = deviceInfo.deviceFpBound;
  ticket.deviceFp = deviceInfo.deviceFp || ticket.deviceFp;
  return ticket;
}

/**
 * جلب المحادثة الحالية (للتحديث التلقائي) — لا يُنشئ سجلاً جديداً.
 */
function getConversation(payload) {
  ensureHeaders_();

  const landline = validateLandline_(payload.landline);
  const mobile = validateMobile_(payload.mobile);
  const result = findLatestRowForCustomer_(landline, mobile);

  if (result.row === -1) {
    throw new Error(getCustomerAccessError_(landline, mobile));
  }

  if (result.needsMobileRegistration) {
    registerCustomerMobile_(result.sheet, result.row, mobile, payload.deviceFp);
    result.data[result.index][COL.MOBILE - 1] = mobile;
  }

  const ticket = rowToObject_(result.data[result.index], result.row);

  if (payload.deviceFp) {
    const info = bindOrVerifyDeviceFp_(result.sheet, result.row, result.data[result.index], payload.deviceFp);
    ticket.deviceTrusted = info.deviceTrusted;
    ticket.deviceFpBound = info.deviceFpBound;
    ticket.deviceFp = info.deviceFp || ticket.deviceFp;
  } else {
    ticket.deviceTrusted = !ticket.hasDeviceFp;
  }

  if (shouldShowFreshChatView_(result.data[result.index])) {
    return buildFreshChatView_(ticket, result.data[result.index]);
  }

  return ticket;
}

/**
 * إرسال رسالة من العميل إلى السنترال — تُضاف إلى سجل المحادثة.
 */
function sendCustomerMessage(payload) {
  ensureHeaders_();

  const landline = validateLandline_(payload.landline);
  const mobile = validateMobile_(payload.mobile);
  const deviceFp = validateDeviceFp_(payload.deviceFp, true);
  const message = String(payload.message || '').trim();

  if (!message) {
    throw new Error('اكتب رسالتك أولاً');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error('الرسالة طويلة جداً — اجعلها أقصر من ' + MAX_MESSAGE_LENGTH + ' حرف');
  }

  let sheet;
  let rowNumber;
  let rowData;

  const result = findLatestRowForCustomer_(landline, mobile);

  if (result.row === -1) {
    const latest = findLatestCustomerRowByLandline_(landline);
    if (latest.row !== -1) {
      throw new Error(getCustomerAccessError_(landline, mobile));
    }
    const created = createChatRow_(landline, mobile, deviceFp);
    sheet = created.sheet;
    rowNumber = created.rowNumber;
    rowData = sheet.getRange(rowNumber, 1, 1, HEADERS.length).getValues()[0];
  } else {
    if (result.needsMobileRegistration) {
      registerCustomerMobile_(result.sheet, result.row, mobile, deviceFp);
      result.data[result.index][COL.MOBILE - 1] = mobile;
    }
    sheet = result.sheet;
    rowNumber = result.row;
    rowData = result.data[result.index];

    const currentStatus = String(rowData[COL.STATUS - 1] || STATUS_NEW);
    if (isResolvedStatus_(currentStatus)) {
      if (isTicketRated_(rowData)) {
        if (isWithinPostRatingReopenWindow_(rowData)) {
          const now = new Date();
          const existing = sheet.getRange(rowNumber, COL.NOTIFICATION).getValue();
          const updated = appendNotificationLine_(existing, CUSTOMER_MSG_PREFIX + message, now);
          sheet.getRange(rowNumber, COL.NOTIFICATION).setValue(updated);
          sheet.getRange(rowNumber, COL.STATUS).setValue(STATUS_REOPENED);
          sheet.getRange(rowNumber, COL.LAST_UPDATE).setValue(now);

          const ticket = rowToObject_(
            sheet.getRange(rowNumber, 1, 1, HEADERS.length).getValues()[0],
            rowNumber
          );
          const deviceInfo = bindOrVerifyDeviceFp_(sheet, rowNumber, rowData, deviceFp);
          ticket.deviceTrusted = deviceInfo.deviceTrusted;
          ticket.deviceFpBound = deviceInfo.deviceFpBound;
          ticket.deviceFp = deviceInfo.deviceFp || ticket.deviceFp;

          return {
            success: true,
            message: 'تم إعادة فتح الشكوى وإرسال رسالتك إلى السنترال.',
            ticket: ticket
          };
        }
        const created = createChatRow_(landline, mobile, deviceFp, message);
        const newRowData = created.sheet.getRange(created.rowNumber, 1, 1, HEADERS.length).getValues()[0];
        const ticket = rowToObject_(newRowData, created.rowNumber);
        const deviceInfo = bindOrVerifyDeviceFp_(created.sheet, created.rowNumber, newRowData, deviceFp);
        ticket.deviceTrusted = deviceInfo.deviceTrusted;
        ticket.deviceFpBound = deviceInfo.deviceFpBound;
        ticket.deviceFp = deviceInfo.deviceFp || ticket.deviceFp;
        ticket.isNewConversation = true;
        return {
          success: true,
          message: 'تم فتح شكوى جديدة وإرسال رسالتك إلى السنترال.',
          ticket: ticket,
          isNewConversation: true
        };
      }
      if (!canSendCustomerMessage_(rowData)) {
        throw new Error('انتهت مدة إعادة فتح الشكوى (5 أيام من تاريخ إنهاء السنترال). يمكنك تقييم الخدمة، وبعد التقييم يمكنك فتح شكوى جديدة.');
      }
      const now = new Date();
      const existing = sheet.getRange(rowNumber, COL.NOTIFICATION).getValue();
      const updated = appendNotificationLine_(existing, CUSTOMER_MSG_PREFIX + message, now);
      sheet.getRange(rowNumber, COL.NOTIFICATION).setValue(updated);
      sheet.getRange(rowNumber, COL.STATUS).setValue(STATUS_REOPENED);
      sheet.getRange(rowNumber, COL.LAST_UPDATE).setValue(now);

      const ticket = rowToObject_(
        sheet.getRange(rowNumber, 1, 1, HEADERS.length).getValues()[0],
        rowNumber
      );
      const deviceInfo = bindOrVerifyDeviceFp_(sheet, rowNumber, rowData, deviceFp);
      ticket.deviceTrusted = deviceInfo.deviceTrusted;
      ticket.deviceFpBound = deviceInfo.deviceFpBound;
      ticket.deviceFp = deviceInfo.deviceFp || ticket.deviceFp;

      return {
        success: true,
        message: 'تم إعادة فتح الشكوى وإرسال رسالتك إلى السنترال.',
        ticket: ticket
      };
    }
  }

  const now = new Date();
  const existing = sheet.getRange(rowNumber, COL.NOTIFICATION).getValue();
  const updated = appendNotificationLine_(existing, CUSTOMER_MSG_PREFIX + message, now);
  sheet.getRange(rowNumber, COL.NOTIFICATION).setValue(updated);

  const activeStatus = String(rowData[COL.STATUS - 1] || STATUS_NEW);
  if (activeStatus !== STATUS_IN_PROGRESS) {
    sheet.getRange(rowNumber, COL.STATUS).setValue(STATUS_NEW);
  }
  sheet.getRange(rowNumber, COL.LAST_UPDATE).setValue(now);

  const ticket = rowToObject_(
    sheet.getRange(rowNumber, 1, 1, HEADERS.length).getValues()[0],
    rowNumber
  );

  return {
    success: true,
    message: 'تم إرسال رسالتك إلى مسؤولي السنترال.',
    ticket: ticket
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

/* ============================================================
 * نظام المهام الثلاثي: الفنيون والرسائل والتعيين
 * ============================================================ */

function getTechSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(TECH_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TECH_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(TECH_HEADERS);
    sheet.getRange(1, 1, 1, TECH_HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function getMessagesSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(MSG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(MSG_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(MSG_HEADERS);
    sheet.getRange(1, 1, 1, MSG_HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function techRowToObject_(row) {
  return {
    id: String(row[TECH_COL.ID - 1] || ''),
    name: String(row[TECH_COL.NAME - 1] || ''),
    phone: String(row[TECH_COL.PHONE - 1] || ''),
    status: String(row[TECH_COL.STATUS - 1] || TECH_STATUS_AVAILABLE)
  };
}

function findTechById_(techId) {
  const sheet = getTechSheet_();
  const data = sheet.getDataRange().getValues();
  const target = String(techId || '').trim();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][TECH_COL.ID - 1] || '').trim() === target) {
      return { sheet: sheet, data: data, row: i + 1, index: i, values: data[i] };
    }
  }
  return { sheet: sheet, data: data, row: -1, index: -1, values: null };
}

function verifyTechAuth_(techId, pin) {
  const found = findTechById_(techId);
  if (found.row === -1) {
    throw new Error('فني غير معروف');
  }
  const storedPin = String(found.values[TECH_COL.PIN - 1] || '');
  if (String(pin || '') !== storedPin) {
    throw new Error('رمز دخول الفني غير صحيح');
  }
  if (String(found.values[TECH_COL.STATUS - 1] || '') === TECH_STATUS_INACTIVE) {
    throw new Error('هذا الحساب غير نشط. تواصل مع الإدارة.');
  }
  return found;
}

function generateTechId_(data) {
  let max = 0;
  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][TECH_COL.ID - 1] || '');
    const m = id.match(/^T(\d+)$/);
    if (m) {
      max = Math.max(max, Number(m[1]));
    }
  }
  return 'T' + (max + 1);
}

function parseAttachmentMeta_(raw) {
  if (!raw) return null;
  var s = String(raw).trim();
  if (!s) return null;
  if (s.charAt(0) === '{') {
    try { return JSON.parse(s); } catch (err) { return { photoUrl: s }; }
  }
  if (s.indexOf('http') === 0) return { photoUrl: s };
  return null;
}

function buildAttachmentJson_(photoUrl, location) {
  var meta = {};
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

function getTechDriveRootFolder_() {
  var storedId = PropertiesService.getScriptProperties().getProperty('TECH_DRIVE_ROOT_ID');
  if (storedId) {
    try { return DriveApp.getFolderById(storedId); } catch (err) {}
  }
  var folders = DriveApp.getFoldersByName(TECH_DRIVE_ROOT_NAME);
  if (folders.hasNext()) {
    var existing = folders.next();
    PropertiesService.getScriptProperties().setProperty('TECH_DRIVE_ROOT_ID', existing.getId());
    return existing;
  }
  var folder = DriveApp.createFolder(TECH_DRIVE_ROOT_NAME);
  PropertiesService.getScriptProperties().setProperty('TECH_DRIVE_ROOT_ID', folder.getId());
  return folder;
}

function getOrCreateTicketDriveFolder_(rowNumber) {
  ensureHeaders_();
  var result = getTicketRow_(rowNumber);
  var existingId = String(result.row[COL.DRIVE_FOLDER - 1] || '').trim();
  if (existingId) {
    try { return DriveApp.getFolderById(existingId); } catch (err) {}
  }
  var landline = String(result.row[COL.LANDLINE - 1] || '').trim();
  var root = getTechDriveRootFolder_();
  var folder = root.createFolder('شكوى_' + rowNumber + '_' + landline);
  result.sheet.getRange(rowNumber, COL.DRIVE_FOLDER).setValue(folder.getId());
  return folder;
}

function uploadTechPhoto_(base64Data, mimeType, rowNumber, techId) {
  if (!base64Data) return '';
  var bytes = Utilities.base64Decode(base64Data);
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new Error('حجم الصورة كبير جداً (الحد الأقصى 5 ميغابايت)');
  }
  var mime = String(mimeType || 'image/jpeg').split(';')[0];
  var ext = mime.indexOf('png') !== -1 ? 'png' : 'jpg';
  var stamp = Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyyMMdd_HHmmss');
  var fileName = 'tech_' + techId + '_' + stamp + '.' + ext;
  var folder = getOrCreateTicketDriveFolder_(rowNumber);
  var file = folder.createFile(Utilities.newBlob(bytes, mime, fileName));
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {}
  return 'https://drive.google.com/uc?export=view&id=' + file.getId();
}

function appendMessage_(ticketRow, senderType, senderId, recipientId, text, attachment) {
  const sheet = getMessagesSheet_();
  const now = new Date();
  const msgId = 'M' + (sheet.getLastRow());
  sheet.appendRow([
    msgId,
    Number(ticketRow) || '',
    senderType || '',
    senderId || '',
    recipientId || '',
    String(text || ''),
    String(attachment || ''),
    formatDate_(now)
  ]);
  return msgId;
}

function getMessagesForTicket_(ticketRow) {
  const sheet = getMessagesSheet_();
  const data = sheet.getDataRange().getValues();
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

function isAllTechsRecipient_(recipientId) {
  return String(recipientId || '').trim().toLowerCase() === RECIPIENT_ALL_TECHS;
}

function messageBelongsToTech_(msg, techId) {
  const id = normalizeTechId_(techId);
  if (!id || !msg) return false;
  const sender = normalizeTechId_(msg.senderId);
  const recipient = String(msg.recipientId || '').trim();
  if (msg.senderType === SENDER_TECH && sender === id) return true;
  if (msg.senderType === SENDER_CENTRAL && normalizeTechId_(recipient) === id) return true;
  if (msg.senderType === SENDER_CENTRAL && isAllTechsRecipient_(recipient)) return true;
  return false;
}

function filterMessagesForTech_(messages, techId) {
  const id = String(techId || '').trim();
  if (!id) return [];
  return (messages || []).filter(function (m) {
    return messageBelongsToTech_(m, id);
  });
}

function getMessagesForTechOnTicket_(ticketRow, techId) {
  const result = getTicketRow_(ticketRow);
  if (isTechInspectionRow_(result.row)) {
    return getMessagesForTechOnInspection_(ticketRow, techId, result.row);
  }
  return filterMessagesForTech_(getMessagesForTicket_(ticketRow), techId);
}

function getLastTechMessageForTech_(ticketRow, techId) {
  const messages = getMessagesForTechOnTicket_(ticketRow, techId);
  if (!messages.length) return null;
  return messages[messages.length - 1];
}

function classifyNotificationSender_(text) {
  const t = String(text || '').trim();
  if (t.indexOf('العميل:') === 0) return SENDER_CUSTOMER;
  if (t.indexOf('السنترال:') === 0) return SENDER_CENTRAL;
  return 'system';
}

function getLastTechMessage_(ticketRow, techId) {
  if (techId) {
    return getLastTechMessageForTech_(ticketRow, techId);
  }
  const messages = getMessagesForTicket_(ticketRow);
  if (!messages.length) return null;
  return messages[messages.length - 1];
}

function buildUnreadItem_(scope, row, key) {
  return {
    scope: String(scope || ''),
    row: Number(row) || 0,
    key: String(key || '')
  };
}

/** عناصر قد تكون غير مقروءة — لوحة السنترال (محادثات + فحص فني) */
function centralGetUnreadItems(payload) {
  verifyCentralAuth_(payload.pin);
  ensureHeaders_();

  const data = getSheet_().getDataRange().getValues();
  const latestByLine = getLatestRowByLine_(data);
  const items = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[COL.LANDLINE - 1] && !row[COL.MOBILE - 1]) continue;

    const rowNumber = i + 1;
    const status = String(row[COL.STATUS - 1] || STATUS_NEW);
    if (isResolvedStatus_(status)) continue;

    if (isTechInspectionRow_(row)) {
      const assignedIds = parseInspectionTechIds_(row[COL.ASSIGNED_TECH - 1]);
      let lastTech = null;
      for (let t = 0; t < assignedIds.length; t++) {
        const candidate = getLastTechMessage_(rowNumber, assignedIds[t]);
        if (candidate && candidate.senderType === SENDER_TECH) {
          if (!lastTech || String(candidate.date || '') > String(lastTech.date || '')) {
            lastTech = candidate;
          }
        }
      }
      if (lastTech) {
        items.push(buildUnreadItem_(
          'inspections',
          rowNumber,
          lastTech.id || lastTech.date || lastTech.text
        ));
      }
      continue;
    }

    if (!isLatestTicketForLine_(rowNumber, row, latestByLine)) continue;

    const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate_(row[COL.LAST_UPDATE - 1]) : '';
    const notifications = parseNotifications_(row[COL.NOTIFICATION - 1], lastUpdate);
    if (notifications.length) {
      const last = notifications[notifications.length - 1];
      if (classifyNotificationSender_(last.text) === SENDER_CUSTOMER) {
        items.push(buildUnreadItem_(
          'chats',
          rowNumber,
          (last.date || '') + '|' + String(last.text || '').slice(0, 120)
        ));
      }
    }

    const assignedTech = String(row[COL.ASSIGNED_TECH - 1] || '').trim();
    const lastTech = getLastTechMessage_(rowNumber, assignedTech);
    if (lastTech && lastTech.senderType === SENDER_TECH) {
      items.push(buildUnreadItem_(
        'chats-tech',
        rowNumber,
        lastTech.id || lastTech.date || lastTech.text
      ));
    }
  }

  return { items: items };
}

/** عناصر قد تكون غير مقروءة — لوحة الفني */
function techGetUnreadItems(payload) {
  verifyTechAuth_(payload.techId, payload.pin);
  ensureHeaders_();

  const techId = String(payload.techId || '').trim();
  const data = getSheet_().getDataRange().getValues();
  const items = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 1;
    if (!inspectionTaskVisibleInTechList_(row, rowNumber, techId)) continue;

    const status = String(row[COL.STATUS - 1] || STATUS_NEW);
    if (isResolvedStatus_(status)) continue;

    const lastMsg = getLastTechMessageForTech_(rowNumber, techId);
    if (!lastMsg && isMultiTechInspection_(row) && !isInspectionShared_(row, rowNumber)) {
      if (!techHasInspectionInvite_(rowNumber, techId)) continue;
    }
    const lastAny = getLastTechMessage_(rowNumber, techId);
    if (lastAny && lastAny.senderType === SENDER_CENTRAL) {
      items.push(buildUnreadItem_(
        'tasks',
        rowNumber,
        lastAny.id || lastAny.date || lastAny.text
      ));
    }
  }

  return { items: items };
}

/** قائمة الفنيين (للإدارة) — بدون كشف الـ PIN */
function techList(payload) {
  verifyCentralAuth_(payload.pin);
  const sheet = getTechSheet_();
  const data = sheet.getDataRange().getValues();
  const technicians = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][TECH_COL.ID - 1]) continue;
    technicians.push(techRowToObject_(data[i]));
  }
  return { technicians: technicians, total: technicians.length };
}

/** إضافة فني جديد (الإدارة) */
function techAdd(payload) {
  verifyCentralAuth_(payload.pin);
  const name = String(payload.name || '').trim();
  const phone = String(payload.phone || '').trim();
  const techPin = String(payload.techPin || '').trim();

  if (name.length < 2) {
    throw new Error('اسم الفني مطلوب');
  }
  if (techPin.length < 4) {
    throw new Error('رمز دخول الفني يجب أن يكون 4 أرقام على الأقل');
  }

  const sheet = getTechSheet_();
  const data = sheet.getDataRange().getValues();
  const techId = generateTechId_(data);
  sheet.appendRow([techId, name, phone, techPin, TECH_STATUS_AVAILABLE]);

  return {
    success: true,
    message: 'تمت إضافة الفني بنجاح',
    technician: { id: techId, name: name, phone: phone, status: TECH_STATUS_AVAILABLE }
  };
}

function ensureAnnouncementsHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(ANNOUNCEMENTS_HEADERS);
    sheet.getRange(1, 1, 1, ANNOUNCEMENTS_HEADERS.length).setFontWeight('bold');
    return;
  }
  const headerRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), ANNOUNCEMENTS_HEADERS.length)).getValues()[0];
  const hasImageCol = headerRow.some(function (h) {
    return String(h || '').trim() === 'رابط_الصورة';
  });
  if (!hasImageCol) {
    const col = headerRow.length + 1;
    sheet.getRange(1, col).setValue('رابط_الصورة').setFontWeight('bold');
  }
}

function getAnnouncementsSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(ANNOUNCEMENTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(ANNOUNCEMENTS_SHEET_NAME);
  }
  ensureAnnouncementsHeaders_(sheet);
  return sheet;
}

function getAnnouncementDriveRootFolder_() {
  var storedId = PropertiesService.getScriptProperties().getProperty('ANNOUNCEMENTS_DRIVE_ROOT_ID');
  if (storedId) {
    try { return DriveApp.getFolderById(storedId); } catch (err) {}
  }
  var folders = DriveApp.getFoldersByName(ANNOUNCEMENTS_DRIVE_ROOT_NAME);
  if (folders.hasNext()) {
    var existing = folders.next();
    PropertiesService.getScriptProperties().setProperty('ANNOUNCEMENTS_DRIVE_ROOT_ID', existing.getId());
    return existing;
  }
  var folder = DriveApp.createFolder(ANNOUNCEMENTS_DRIVE_ROOT_NAME);
  PropertiesService.getScriptProperties().setProperty('ANNOUNCEMENTS_DRIVE_ROOT_ID', folder.getId());
  return folder;
}

function uploadAnnouncementPhoto_(base64Data, mimeType, annId) {
  if (!base64Data) return '';
  var bytes = Utilities.base64Decode(base64Data);
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new Error('حجم الصورة كبير جداً (الحد الأقصى 5 ميغابايت)');
  }
  var mime = String(mimeType || 'image/jpeg').split(';')[0];
  var ext = mime.indexOf('png') !== -1 ? 'png' : 'jpg';
  var stamp = Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyyMMdd_HHmmss');
  var fileName = 'ann_' + annId + '_' + stamp + '.' + ext;
  var folder = getAnnouncementDriveRootFolder_();
  var file = folder.createFile(Utilities.newBlob(bytes, mime, fileName));
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {}
  return 'https://drive.google.com/uc?export=view&id=' + file.getId();
}

function sortAnnouncementsNewestFirst_(items) {
  items.sort(function (a, b) {
    return (Number(b._row) || 0) - (Number(a._row) || 0);
  });
  items.forEach(function (item) { delete item._row; });
  return items;
}

function generateAnnId_(data) {
  let max = 0;
  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][ANN_COL.ID - 1] || '');
    const m = id.match(/^A(\d+)$/);
    if (m) {
      max = Math.max(max, Number(m[1]));
    }
  }
  return 'A' + (max + 1);
}

function normalizeTechId_(techId) {
  return String(techId || '').trim().toUpperCase();
}

function parseAnnouncementTechIds_(raw) {
  return String(raw || '').split(/[|,،;]+/).map(function (s) {
    return normalizeTechId_(s);
  }).filter(Boolean);
}

function parseInspectionTechIds_(raw) {
  return parseAnnouncementTechIds_(raw);
}

function isTechInInspection_(row, techId) {
  if (!isTechInspectionRow_(row)) return false;
  return isAnnouncementForTech_(parseInspectionTechIds_(row[COL.ASSIGNED_TECH - 1]), techId);
}

function isMultiTechInspection_(row) {
  return isTechInspectionRow_(row) && parseInspectionTechIds_(row[COL.ASSIGNED_TECH - 1]).length > 1;
}

function getTechNameById_(techId) {
  const found = findTechById_(techId);
  if (found.row === -1) return String(techId || '');
  return String(found.values[TECH_COL.NAME - 1] || techId);
}

function getInspectionTechNames_(techIds) {
  return (techIds || []).map(function (id) {
    return getTechNameById_(id);
  });
}

function techHasInspectionInvite_(ticketRow, techId) {
  const id = normalizeTechId_(techId);
  if (!id) return false;
  const messages = getMessagesForTicket_(ticketRow);
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.senderType !== SENDER_CENTRAL) continue;
    if (isAllTechsRecipient_(m.recipientId)) return true;
    if (normalizeTechId_(m.recipientId) === id) return true;
  }
  return false;
}

function dedupeMultiInspectionMessages_(messages) {
  const seen = {};
  const out = [];
  (messages || []).forEach(function (m) {
    if (m.senderType !== SENDER_CENTRAL) {
      out.push(m);
      return;
    }
    const key = [
      m.senderType,
      String(m.text || '').trim(),
      String(m.attachment || '').trim(),
      String(m.date || '').trim()
    ].join('\u0001');
    if (seen[key]) return;
    seen[key] = true;
    out.push(m);
  });
  return out;
}

function getMessagesForCentralOnInspection_(ticketRow, row) {
  const messages = getMessagesForTicket_(ticketRow);
  if (!isMultiTechInspection_(row)) return messages;
  return dedupeMultiInspectionMessages_(messages);
}

function hasInspectionTechReply_(messages, assignedIds) {
  for (let i = 0; i < (messages || []).length; i++) {
    const m = messages[i];
    if (m.senderType !== SENDER_TECH) continue;
    if (assignedIds.indexOf(normalizeTechId_(m.senderId)) !== -1) return true;
  }
  return false;
}

function isInspectionShared_(row, ticketRow) {
  const channel = String(row[COL.CUST_TECH_CHANNEL - 1] || '').trim();
  if (channel === INSPECTION_SHARED) return true;
  const assignedIds = parseInspectionTechIds_(row[COL.ASSIGNED_TECH - 1]);
  if (assignedIds.length <= 1) return true;
  return hasInspectionTechReply_(getMessagesForTicket_(ticketRow), assignedIds);
}

function markInspectionShared_(sheet, rowNumber) {
  sheet.getRange(rowNumber, COL.CUST_TECH_CHANNEL).setValue(INSPECTION_SHARED);
}

function inspectionTaskVisibleInTechList_(row, rowNumber, techId) {
  if (!isTechInspectionRow_(row)) {
    return normalizeTechId_(row[COL.ASSIGNED_TECH - 1]) === normalizeTechId_(techId);
  }
  if (!isTechInInspection_(row, techId)) return false;
  const assignedIds = parseInspectionTechIds_(row[COL.ASSIGNED_TECH - 1]);
  if (assignedIds.length <= 1) return true;
  if (isResolvedStatus_(row[COL.STATUS - 1])) return true;
  if (isInspectionShared_(row, rowNumber)) return true;
  return techHasInspectionInvite_(rowNumber, techId);
}

function filterMessagesForMultiInspection_(messages, assignedIds) {
  const filtered = (messages || []).filter(function (m) {
    if (m.senderType === SENDER_CENTRAL) {
      if (isAllTechsRecipient_(m.recipientId)) return true;
      const recip = normalizeTechId_(m.recipientId);
      return recip && assignedIds.indexOf(recip) !== -1;
    }
    if (m.senderType === SENDER_TECH) {
      return assignedIds.indexOf(normalizeTechId_(m.senderId)) !== -1;
    }
    return false;
  });
  return dedupeMultiInspectionMessages_(filtered);
}

function getMessagesForTechOnInspection_(ticketRow, techId, row) {
  const all = getMessagesForTicket_(ticketRow);
  const assignedIds = parseInspectionTechIds_(row[COL.ASSIGNED_TECH - 1]);
  if (assignedIds.length <= 1) {
    return filterMessagesForTech_(all, techId);
  }
  if (isInspectionShared_(row, ticketRow) || isResolvedStatus_(row[COL.STATUS - 1])) {
    return filterMessagesForMultiInspection_(all, assignedIds);
  }
  return filterMessagesForTech_(all, techId);
}

function notifyOtherInspectionTechsOnShare_(sheet, rowNumber, row, respondingTechId) {
  const assignedIds = parseInspectionTechIds_(row[COL.ASSIGNED_TECH - 1]);
  if (assignedIds.length <= 1) return;
  const responder = normalizeTechId_(respondingTechId);
  const landline = String(row[COL.LANDLINE - 1] || '');
  const responderName = getTechNameById_(respondingTechId);
  const notifyText = '🔔 ردّ الفني ' + responderName + ' على مهمة الفحص — الخط: ' + landline +
    '. يمكنك الآن متابعة المحادثة مع باقي الفريق.';
  appendMessage_(rowNumber, SENDER_CENTRAL, RECIPIENT_CENTRAL, RECIPIENT_ALL_TECHS, notifyText, '');
}

function maybeShareInspectionOnTechReply_(sheet, rowNumber, row, techId) {
  if (!isMultiTechInspection_(row)) return;
  if (isInspectionShared_(row, rowNumber)) return;
  markInspectionShared_(sheet, rowNumber);
  notifyOtherInspectionTechsOnShare_(sheet, rowNumber, row, techId);
}

function enrichInspectionFields_(ticket, row, rowNumber) {
  if (!ticket.isTechInspection) return ticket;
  const ids = parseInspectionTechIds_(row[COL.ASSIGNED_TECH - 1]);
  ticket.assignedTechIds = ids;
  ticket.assignedTechNames = getInspectionTechNames_(ids);
  ticket.isMultiTechInspection = ids.length > 1;
  ticket.inspectionShared = isInspectionShared_(row, rowNumber);
  return ticket;
}

function normalizeInspectionTechIdsPayload_(payload) {
  let techIds = payload && payload.techIds;
  if (Array.isArray(techIds)) {
    techIds = techIds.map(function (id) { return normalizeTechId_(id); }).filter(Boolean);
  } else {
    techIds = [];
  }
  if (!techIds.length) {
    const single = normalizeTechId_(payload && payload.techId);
    if (single) techIds = [single];
  }
  const unique = [];
  techIds.forEach(function (id) {
    if (unique.indexOf(id) === -1) unique.push(id);
  });
  return unique;
}

function isAnnouncementForTech_(techIds, techId) {
  const target = normalizeTechId_(techId);
  if (!target) return false;
  const ids = Array.isArray(techIds)
    ? techIds.map(normalizeTechId_)
    : parseAnnouncementTechIds_(techIds);
  if (!ids.length) return false;
  return ids.indexOf(target) !== -1;
}

function getAnnouncementColumnIndexes_(sheet) {
  const headerRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const indexes = {
    ID: ANN_COL.ID - 1,
    TYPE: ANN_COL.TYPE - 1,
    TITLE: ANN_COL.TITLE - 1,
    BODY: ANN_COL.BODY - 1,
    TECH_IDS: ANN_COL.TECH_IDS - 1,
    TECH_NAMES: ANN_COL.TECH_NAMES - 1,
    DATE: ANN_COL.DATE - 1,
    IMAGE: ANN_COL.IMAGE - 1
  };
  headerRow.forEach(function (label, i) {
    const h = String(label || '').trim();
    if (h === 'ann_id') indexes.ID = i;
    else if (h === 'النوع') indexes.TYPE = i;
    else if (h === 'العنوان') indexes.TITLE = i;
    else if (h === 'المحتوى') indexes.BODY = i;
    else if (h === 'معرّفات_الفنيين') indexes.TECH_IDS = i;
    else if (h === 'أسماء_الفنيين') indexes.TECH_NAMES = i;
    else if (h === 'التاريخ') indexes.DATE = i;
    else if (h === 'رابط_الصورة') indexes.IMAGE = i;
  });
  return indexes;
}

function resolveAnnouncementImageUrl_(row, c) {
  const direct = String(row[c.IMAGE] || '').trim();
  if (direct && direct.indexOf('http') === 0) return direct;
  for (let i = 0; i < row.length; i++) {
    const cell = String(row[i] || '').trim();
    if (cell.indexOf('http') === 0 && cell.indexOf('drive.google.com') !== -1) {
      return cell;
    }
  }
  return direct;
}

function announcementRowToObject_(row, colIndexes) {
  const c = colIndexes || {
    ID: ANN_COL.ID - 1,
    TYPE: ANN_COL.TYPE - 1,
    TITLE: ANN_COL.TITLE - 1,
    BODY: ANN_COL.BODY - 1,
    TECH_IDS: ANN_COL.TECH_IDS - 1,
    TECH_NAMES: ANN_COL.TECH_NAMES - 1,
    DATE: ANN_COL.DATE - 1,
    IMAGE: ANN_COL.IMAGE - 1
  };
  const techIds = parseAnnouncementTechIds_(row[c.TECH_IDS]);
  const dateVal = String(row[c.DATE] || '');
  const imageUrl = resolveAnnouncementImageUrl_(row, c);
  const date = (dateVal.indexOf('drive.google.com') !== -1 && imageUrl === dateVal)
    ? ''
    : dateVal;
  return {
    id: String(row[c.ID] || ''),
    type: String(row[c.TYPE] || ''),
    title: String(row[c.TITLE] || ''),
    body: String(row[c.BODY] || ''),
    techIds: techIds,
    techNames: String(row[c.TECH_NAMES] || ''),
    date: date,
    imageUrl: imageUrl
  };
}

/** إرسال إعلان أو تعليمات لفنيين محددين (الإدارة) */
function centralCreateTechAnnouncement(payload) {
  verifyCentralAuth_(payload.pin);
  const type = String(payload.type || '').trim();
  const title = String(payload.title || '').trim();
  const body = String(payload.body || '').trim();
  const photoBase64 = String(payload.photoBase64 || '').trim();
  const photoMimeType = String(payload.photoMimeType || 'image/jpeg').trim();
  const techIds = Array.isArray(payload.techIds) ? payload.techIds.map(function (id) {
    return String(id || '').trim();
  }).filter(Boolean) : [];

  if (ANN_TYPES.indexOf(type) === -1) {
    throw new Error('اختر نوعاً صحيحاً: إعلان أو تعليمات');
  }
  if (title.length < 2) {
    throw new Error('العنوان مطلوب');
  }
  if (body.length < 2 && !photoBase64) {
    throw new Error('اكتب المحتوى أو أرفق صورة');
  }
  if (!techIds.length) {
    throw new Error('اختر فنياً واحداً على الأقل');
  }

  const uniqueIds = [];
  const techNames = [];
  techIds.forEach(function (techId) {
    if (uniqueIds.indexOf(techId) !== -1) return;
    const found = findTechById_(techId);
    if (found.row === -1) {
      throw new Error('فني غير معروف: ' + techId);
    }
    uniqueIds.push(techId);
    techNames.push(String(found.values[TECH_COL.NAME - 1] || techId));
  });

  const sheet = getAnnouncementsSheet_();
  const data = sheet.getDataRange().getValues();
  const annId = generateAnnId_(data);
  const now = formatPreviewDateTime_(new Date());
  const imageUrl = photoBase64 ? uploadAnnouncementPhoto_(photoBase64, photoMimeType, annId) : '';

  sheet.appendRow([annId, type, title, body, uniqueIds.join('|'), techNames.join('، '), now, imageUrl]);

  return {
    success: true,
    message: 'تم إرسال ' + type + ' إلى ' + uniqueIds.length + ' فني' + (imageUrl ? ' مع صورة' : ''),
    announcement: announcementRowToObject_(sheet.getRange(sheet.getLastRow(), 1, 1, ANNOUNCEMENTS_HEADERS.length).getValues()[0])
  };
}

/** قائمة الإعلانات والتعليمات (الإدارة) */
function centralListTechAnnouncements(payload) {
  verifyCentralAuth_(payload.pin);
  const sheet = getAnnouncementsSheet_();
  const data = sheet.getDataRange().getValues();
  const colIndexes = getAnnouncementColumnIndexes_(sheet);
  const items = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][colIndexes.ID]) continue;
    const ann = announcementRowToObject_(data[i], colIndexes);
    ann._row = i;
    items.push(ann);
  }
  return { announcements: sortAnnouncementsNewestFirst_(items), total: items.length };
}

/** إعلانات وتعليمات الفني الحالي */
function techListAnnouncements(payload) {
  const techId = normalizeTechId_(payload.techId);
  verifyTechAuth_(payload.techId, payload.techPin);
  const sheet = getAnnouncementsSheet_();
  const data = sheet.getDataRange().getValues();
  const colIndexes = getAnnouncementColumnIndexes_(sheet);
  const items = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][colIndexes.ID]) continue;
    const ann = announcementRowToObject_(data[i], colIndexes);
    if (isAnnouncementForTech_(ann.techIds, techId)) {
      ann._row = i;
      items.push(ann);
    }
  }
  return { announcements: sortAnnouncementsNewestFirst_(items), total: items.length };
}

/** تحديث حالة الفني — من الإدارة (pin) أو من الفني نفسه (techId+techPin) */
function techUpdateStatus(payload) {
  const status = String(payload.status || '').trim();
  if (TECH_STATUSES.indexOf(status) === -1) {
    throw new Error('حالة غير صحيحة');
  }

  let found;
  if (payload.techId && payload.techPin) {
    found = verifyTechAuth_(payload.techId, payload.techPin);
  } else {
    verifyCentralAuth_(payload.pin);
    found = findTechById_(payload.techId);
    if (found.row === -1) {
      throw new Error('فني غير معروف');
    }
  }

  found.sheet.getRange(found.row, TECH_COL.STATUS).setValue(status);
  return { success: true, message: 'تم تحديث الحالة', status: status };
}

/** تعيين فني لمحادثة (الإدارة) — techId فارغ = إلغاء التعيين
 *  يُزامِن الإسناد على كل المهام النشطة لنفس الخط (محادثة عميل + فحص فني...) */
function assignTechnician(payload) {
  verifyCentralAuth_(payload.pin);
  ensureHeaders_();

  const rowNumber = Number(payload.row);
  const techId = String(payload.techId || '').trim();
  const result = getTicketRow_(rowNumber);
  const landline = String(result.row[COL.LANDLINE - 1] || '');

  if (!landline) {
    throw new Error('لا يوجد خط أرضي لهذه المهمة');
  }

  let techName = '';
  if (techId) {
    const found = findTechById_(techId);
    if (found.row === -1) {
      throw new Error('فني غير معروف');
    }
    techName = String(found.values[TECH_COL.NAME - 1] || '');
  }

  const sheet = result.sheet;
  const data = sheet.getDataRange().getValues();
  const targetLandline = normalizeLandlineForMatch_(landline);
  const now = new Date();
  let syncedRows = 0;

  for (let i = 1; i < data.length; i++) {
    const rn = i + 1;
    const row = data[i];
    if (!row[COL.LANDLINE - 1]) continue;
    if (normalizeLandlineForMatch_(row[COL.LANDLINE - 1]) !== targetLandline) continue;
    if (isResolvedStatus_(String(row[COL.STATUS - 1] || STATUS_NEW))) continue;

    const oldTech = String(row[COL.ASSIGNED_TECH - 1] || '').trim();
    if (oldTech === techId) continue;

    sheet.getRange(rn, COL.ASSIGNED_TECH).setValue(techId);
    sheet.getRange(rn, COL.LAST_UPDATE).setValue(now);
    syncedRows++;

    if (techId) {
      appendMessage_(
        rn,
        SENDER_CENTRAL,
        RECIPIENT_CENTRAL,
        techId,
        'تم إسناد المهمة إليك — الخط الأرضي: ' + landline,
        ''
      );
    }
  }

  let message = techId ? ('تم إسناد المهمة للفني ' + techName) : 'تم إلغاء تعيين الفني';
  if (syncedRows > 1) {
    message += ' (شمل ' + syncedRows + ' مهام نشطة على نفس الخط)';
  } else if (syncedRows === 0) {
    message = techId
      ? ('الفني ' + techName + ' مسند مسبقاً على هذا الخط')
      : 'لا يوجد فنيون مسندون على مهام نشطة لهذا الخط';
  }

  return {
    success: true,
    message: message,
    assignedTech: techId,
    assignedTechName: techName,
    syncedRows: syncedRows
  };
}

/** دخول الفني بلوحته */
function techLogin(payload) {
  const found = verifyTechAuth_(payload.techId, payload.pin);
  return {
    success: true,
    technician: techRowToObject_(found.values)
  };
}

/** المهام المسندة لفني محدد فقط */
function techListTasks(payload) {
  verifyTechAuth_(payload.techId, payload.pin);
  ensureHeaders_();

  const techId = String(payload.techId || '').trim();
  const data = getSheet_().getDataRange().getValues();
  const tasks = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 1;
    if (!inspectionTaskVisibleInTechList_(row, rowNumber, techId)) continue;

    const lastUpdate = row[COL.LAST_UPDATE - 1] ? formatDate_(row[COL.LAST_UPDATE - 1]) : '';
    const notifications = parseNotifications_(row[COL.NOTIFICATION - 1], lastUpdate);

    tasks.push({
      row: rowNumber,
      date: row[COL.DATE - 1] ? formatDate_(row[COL.DATE - 1]) : '',
      landline: String(row[COL.LANDLINE - 1] || ''),
      mobile: String(row[COL.MOBILE - 1] || ''),
      reason: String(row[COL.REASON - 1] || ''),
      status: String(row[COL.STATUS - 1] || STATUS_NEW),
      lastUpdate: lastUpdate,
      lastNotification: notifications.length ? notifications[notifications.length - 1].text : '',
      archiveCount: countTicketArchive_(String(row[COL.LANDLINE - 1] || ''), rowNumber),
      isTechInspection: isTechInspectionRow_(row),
      isMultiTechInspection: isMultiTechInspection_(row),
      inspectionShared: isInspectionShared_(row, rowNumber)
    });
  }

  tasks.sort(function (a, b) { return b.row - a.row; });
  return { tasks: tasks, total: tasks.length };
}

/** تفاصيل مهمة واحدة للفني + سجل المحادثة مع الإدارة */
function techGetTask(payload) {
  verifyTechAuth_(payload.techId, payload.pin);
  ensureHeaders_();

  const rowNumber = Number(payload.row);
  const techId = String(payload.techId || '').trim();
  const result = getTicketRow_(rowNumber);

  if (!isTechInInspection_(result.row, techId) &&
      normalizeTechId_(result.row[COL.ASSIGNED_TECH - 1]) !== normalizeTechId_(techId)) {
    throw new Error('هذه المهمة غير مسندة إليك');
  }
  if (isTechInspectionRow_(result.row) && !inspectionTaskVisibleInTechList_(result.row, rowNumber, techId)) {
    throw new Error('هذه المهمة غير متاحة لك بعد');
  }

  const ticket = rowToObject_(result.row, rowNumber);
  enrichInspectionFields_(ticket, result.row, rowNumber);
  ticket.messages = getMessagesForTechOnTicket_(rowNumber, techId);
  if (ticket.isMultiTechInspection && ticket.assignedTechIds && ticket.assignedTechIds.length) {
    const nameMap = {};
    ticket.assignedTechIds.forEach(function (id, idx) {
      nameMap[normalizeTechId_(id)] = ticket.assignedTechNames[idx] || id;
    });
    ticket.messages.forEach(function (m) {
      if (m.senderType === SENDER_TECH) {
        m.senderName = nameMap[normalizeTechId_(m.senderId)] || 'فني آخر';
      }
    });
  }
  ticket.archive = getTicketArchive_(ticket.landline, ticket.mobile, rowNumber);
  return ticket;
}

/** رسالة من الفني إلى الإدارة (نص + صورة + موقع) */
function techSendMessage(payload) {
  const found = verifyTechAuth_(payload.techId, payload.pin);
  ensureHeaders_();

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

  const result = getTicketRow_(rowNumber);
  if (!isTechInInspection_(result.row, techId) &&
      normalizeTechId_(result.row[COL.ASSIGNED_TECH - 1]) !== normalizeTechId_(techId)) {
    throw new Error('هذه المهمة غير مسندة إليك');
  }
  if (isTechInspectionRow_(result.row) && !inspectionTaskVisibleInTechList_(result.row, rowNumber, techId)) {
    throw new Error('هذه المهمة غير متاحة لك بعد');
  }

  let photoUrl = '';
  if (photoBase64) {
    photoUrl = uploadTechPhoto_(photoBase64, photoMimeType, rowNumber, techId);
  }

  let attachment = buildAttachmentJson_(photoUrl, hasLocation ? location : null);
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

  appendMessage_(rowNumber, SENDER_TECH, techId, RECIPIENT_CENTRAL, message, attachment);
  if (isTechInspectionRow_(result.row)) {
    maybeShareInspectionOnTechReply_(result.sheet, rowNumber, result.row, techId);
  }
  result.sheet.getRange(rowNumber, COL.LAST_UPDATE).setValue(new Date());

  return {
    success: true,
    message: 'تم إرسال رسالتك إلى الإدارة',
    messages: getMessagesForTechOnTicket_(rowNumber, techId)
  };
}

/** رسالة من الإدارة إلى الفني (نص + صورة) */
function centralSendTechMessage(payload) {
  verifyCentralAuth_(payload.pin);
  ensureHeaders_();

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

  const result = getTicketRow_(rowNumber);
  const assignedRaw = String(result.row[COL.ASSIGNED_TECH - 1] || '').trim();
  if (!assignedRaw) {
    throw new Error('لا يوجد فني مسند لهذه المحادثة');
  }

  let photoUrl = '';
  if (photoBase64) {
    photoUrl = uploadTechPhoto_(photoBase64, photoMimeType, rowNumber, 'central');
  }

  let attachment = buildAttachmentJson_(photoUrl, null);
  if (!attachment && payload.attachment) {
    attachment = String(payload.attachment || '');
  }

  if (!message && photoUrl) {
    message = '📷 صورة من الإدارة';
  }

  const inspectionMulti = isMultiTechInspection_(result.row);
  const assignedIds = inspectionMulti
    ? parseInspectionTechIds_(result.row[COL.ASSIGNED_TECH - 1])
    : [normalizeTechId_(assignedRaw)];
  const recipientId = inspectionMulti ? RECIPIENT_ALL_TECHS : assignedIds[0];

  appendMessage_(rowNumber, SENDER_CENTRAL, RECIPIENT_CENTRAL, recipientId, message, attachment);
  result.sheet.getRange(rowNumber, COL.LAST_UPDATE).setValue(new Date());

  return {
    success: true,
    message: photoUrl ? 'تم إرسال الرسالة والصورة للفني' + (inspectionMulti ? 'ين' : '') :
      'تم إرسال رسالتك إلى الفني' + (inspectionMulti ? 'ين' : ''),
    messages: getMessagesForCentralOnInspection_(rowNumber, result.row)
  };
}

/** إنشاء مهمة فحص فني مباشرة من السنترال */
function centralCreateTechInspection(payload) {
  verifyCentralAuth_(payload.pin);
  ensureHeaders_();

  const landline = validateLandline_(payload.landline);
  const techIds = normalizeInspectionTechIdsPayload_(payload);
  const note = String(payload.note || '').trim();
  const photoBase64 = String(payload.photoBase64 || '').trim();
  const photoMimeType = String(payload.photoMimeType || 'image/jpeg').trim();

  if (!techIds.length) {
    throw new Error('اختر فنياً واحداً على الأقل');
  }
  if (!note && !photoBase64) {
    throw new Error('اكتب تفاصيل طلب الفحص أو أرفق صورة');
  }
  if (note.length > MAX_MESSAGE_LENGTH) {
    throw new Error('الوصف طويل جداً');
  }

  const techNames = [];
  techIds.forEach(function (id) {
    const found = findTechById_(id);
    if (found.row === -1) {
      throw new Error('فني غير معروف: ' + id);
    }
    techNames.push(String(found.values[TECH_COL.NAME - 1] || id));
  });

  const sheet = getSheet_();
  const now = new Date();
  const notifLine = appendNotificationLine_('', 'السنترال: [فحص فني] ' + (note || '📷 صورة مرفقة'), now);
  const assignedStorage = techIds.join(',');
  const channelVal = techIds.length > 1 ? INSPECTION_MULTI : CHANNEL_CLOSED;

  sheet.appendRow([
    now,
    landline,
    TECH_INSPECTION_REASON,
    '',
    STATUS_IN_PROGRESS,
    notifLine,
    now,
    '',
    '',
    '',
    '',
    '',
    RATING_FLAG_NO,
    assignedStorage,
    channelVal,
    ''
  ]);

  const rowNumber = sheet.getLastRow();
  let photoUrl = '';
  if (photoBase64) {
    photoUrl = uploadTechPhoto_(photoBase64, photoMimeType, rowNumber, 'central');
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

  const recipientId = techIds.length > 1 ? RECIPIENT_ALL_TECHS : techIds[0];
  appendMessage_(
    rowNumber,
    SENDER_CENTRAL,
    RECIPIENT_CENTRAL,
    recipientId,
    msgText,
    attachment
  );

  const freshRow = sheet.getRange(rowNumber, 1, 1, HEADERS.length).getValues()[0];
  const ticket = rowToObject_(freshRow, rowNumber);
  enrichInspectionFields_(ticket, freshRow, rowNumber);
  ticket.techMessages = getMessagesForCentralOnInspection_(rowNumber, freshRow);
  ticket.assignedTechName = techNames.join('، ');

  return {
    success: true,
    message: 'تم إرسال مهمة الفحص إلى: ' + techNames.join('، '),
    ticket: ticket
  };
}

/** قائمة مهام الفحص الفني */
function centralListTechInspections(payload) {
  verifyCentralAuth_(payload.pin);
  ensureHeaders_();

  const filter = String(payload.filter || 'active');
  const data = getSheet_().getDataRange().getValues();
  const tasks = [];
  let activeCount = 0;
  let closedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!isTechInspectionRow_(row)) continue;

    const rowNumber = i + 1;
    const status = String(row[COL.STATUS - 1] || STATUS_NEW);
    const resolved = isResolvedStatus_(status);
    if (resolved) {
      closedCount++;
    } else {
      activeCount++;
    }

    if (filter === 'active' && resolved) continue;
    if (filter === 'closed' && !resolved) continue;

    tasks.push({
      row: rowNumber,
      date: row[COL.DATE - 1] ? formatDate_(row[COL.DATE - 1]) : '',
      landline: String(row[COL.LANDLINE - 1] || ''),
      status: status,
      lastUpdate: row[COL.LAST_UPDATE - 1] ? formatDate_(row[COL.LAST_UPDATE - 1]) : '',
      assignedTech: String(row[COL.ASSIGNED_TECH - 1] || ''),
      assignedTechIds: parseInspectionTechIds_(row[COL.ASSIGNED_TECH - 1]),
      assignedTechNames: getInspectionTechNames_(parseInspectionTechIds_(row[COL.ASSIGNED_TECH - 1])),
      isMultiTechInspection: isMultiTechInspection_(row),
      inspectionShared: isInspectionShared_(row, rowNumber),
      note: extractTechInspectionNote_(row[COL.NOTIFICATION - 1])
    });
  }

  tasks.sort(function (a, b) {
    return b.row - a.row;
  });

  return {
    tasks: tasks,
    total: tasks.length,
    activeCount: activeCount,
    closedCount: closedCount
  };
}

/** تفاصيل مهمة فحص فني */
function centralGetTechInspection(payload) {
  verifyCentralAuth_(payload.pin);
  ensureHeaders_();

  const rowNumber = Number(payload.row);
  const result = getTicketRow_(rowNumber);
  if (!isTechInspectionRow_(result.row)) {
    throw new Error('هذه ليست مهمة فحص فني');
  }

  const ticket = rowToObject_(result.row, rowNumber);
  enrichInspectionFields_(ticket, result.row, rowNumber);
  const techIds = parseInspectionTechIds_(result.row[COL.ASSIGNED_TECH - 1]);
  ticket.techMessages = getMessagesForCentralOnInspection_(rowNumber, result.row);
  if (techIds.length === 1) {
    const found = findTechById_(techIds[0]);
    if (found.row !== -1) {
      ticket.assignedTechName = String(found.values[TECH_COL.NAME - 1] || '');
    }
  } else if (techIds.length > 1) {
    ticket.assignedTechName = getInspectionTechNames_(techIds).join('، ');
  }
  ticket.canCloseInspection = !isResolvedStatus_(ticket.status);
  ticket.archive = getInspectionPageArchive_(ticket.landline, rowNumber);
  ticket.archiveCount = ticket.archive.length;

  return ticket;
}

/** إغلاق مهمة فحص فني من السنترال */
function centralCloseTechInspection(payload) {
  verifyCentralAuth_(payload.pin);
  ensureHeaders_();

  const rowNumber = Number(payload.row);
  const note = String(payload.note || '').trim();
  const result = getTicketRow_(rowNumber);

  if (!isTechInspectionRow_(result.row)) {
    throw new Error('هذه ليست مهمة فحص فني');
  }
  if (isResolvedStatus_(result.row[COL.STATUS - 1])) {
    throw new Error('المهمة مغلقة مسبقاً');
  }

  const techIds = parseInspectionTechIds_(result.row[COL.ASSIGNED_TECH - 1]);
  const now = new Date();
  let closeMsg = 'تم إغلاق مهمة الفحص من السنترال';
  if (note) {
    closeMsg += ' — ' + note;
  }

  result.sheet.getRange(rowNumber, COL.STATUS).setValue(STATUS_RESOLVED);
  result.sheet.getRange(rowNumber, COL.LAST_UPDATE).setValue(now);
  if (techIds.length > 1 && String(result.row[COL.CUST_TECH_CHANNEL - 1] || '').trim() !== INSPECTION_SHARED) {
    markInspectionShared_(result.sheet, rowNumber);
  }

  const updated = appendNotificationLine_(result.row[COL.NOTIFICATION - 1], 'السنترال: ' + closeMsg, now);
  result.sheet.getRange(rowNumber, COL.NOTIFICATION).setValue(updated);

  const closeRecipient = techIds.length > 1 ? RECIPIENT_ALL_TECHS : techIds[0];
  appendMessage_(rowNumber, SENDER_CENTRAL, RECIPIENT_CENTRAL, closeRecipient, closeMsg, '');

  const freshRow = result.sheet.getRange(rowNumber, 1, 1, HEADERS.length).getValues()[0];
  const ticket = rowToObject_(freshRow, rowNumber);
  enrichInspectionFields_(ticket, freshRow, rowNumber);
  ticket.techMessages = getMessagesForCentralOnInspection_(rowNumber, freshRow);
  ticket.canCloseInspection = false;
  ticket.archive = getInspectionPageArchive_(ticket.landline, rowNumber);
  ticket.archiveCount = ticket.archive.length;

  return {
    success: true,
    message: 'تم إغلاق مهمة الفحص',
    ticket: ticket
  };
}

function getFarshootDataSheet_() {
  const ss = SpreadsheetApp.openById(FARSHOOT_DATA_SPREADSHEET_ID);
  const byName = ss.getSheetByName(FARSHOOT_DATA_SHEET_NAME);
  if (byName) {
    return byName;
  }
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === FARSHOOT_DATA_SHEET_GID) {
      return sheets[i];
    }
  }
  throw new Error('لم يتم العثور على تبويب «' + FARSHOOT_DATA_SHEET_NAME + '» في شيت فرشوط');
}

/** بحث رقم مسلسل في تبويب بيانات شيت فرشوط */
function techSearchSerialData(payload) {
  verifyTechAuth_(payload.techId, payload.pin);
  const serial = String(payload.serial || '').trim();
  if (!serial) {
    throw new Error('أدخل رقم المسلسل');
  }

  const sheet = getFarshootDataSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return { found: false, serial: serial };
  }

  const headers = data[0].map(function (h) { return String(h || '').trim(); });
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
    return { found: false, serial: serial };
  }

  const record = {};
  for (let c = 0; c < headers.length; c++) {
    if (headers[c]) {
      record[headers[c]] = String(foundRow[c] || '').trim();
    }
  }

  return {
    found: true,
    serial: serial,
    row: rowIndex,
    headers: headers.filter(function (h) { return h; }),
    data: record
  };
}

function getFarshootPreviewSheet_() {
  const ss = SpreadsheetApp.openById(FARSHOOT_DATA_SPREADSHEET_ID);
  const byName = ss.getSheetByName(FARSHOOT_PREVIEW_SHEET_NAME);
  if (byName) {
    return byName;
  }
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === FARSHOOT_PREVIEW_SHEET_GID) {
      return sheets[i];
    }
  }
  throw new Error('لم يتم العثور على تبويب «' + FARSHOOT_PREVIEW_SHEET_NAME + '» في شيت فرشوط');
}

function ensurePreviewSheetHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(PREVIEW_SHEET_HEADERS);
    sheet.getRange(1, 1, 1, PREVIEW_SHEET_HEADERS.length).setFontWeight('bold');
    return;
  }
  const width = Math.max(sheet.getLastColumn(), PREVIEW_SHEET_HEADERS.length);
  const firstRow = sheet.getRange(1, 1, 1, width).getValues()[0];
  const needsHeaders = PREVIEW_SHEET_HEADERS.every(function (_header, index) {
    return !firstRow[index];
  });
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, PREVIEW_SHEET_HEADERS.length).setValues([PREVIEW_SHEET_HEADERS]);
    sheet.getRange(1, 1, 1, PREVIEW_SHEET_HEADERS.length).setFontWeight('bold');
  }
}

function getPreviewDriveRootFolder_() {
  var storedId = PropertiesService.getScriptProperties().getProperty('PREVIEW_DRIVE_ROOT_ID');
  if (storedId) {
    try { return DriveApp.getFolderById(storedId); } catch (err) {}
  }
  var folders = DriveApp.getFoldersByName(PREVIEW_DRIVE_ROOT_NAME);
  if (folders.hasNext()) {
    var existing = folders.next();
    PropertiesService.getScriptProperties().setProperty('PREVIEW_DRIVE_ROOT_ID', existing.getId());
    return existing;
  }
  var folder = DriveApp.createFolder(PREVIEW_DRIVE_ROOT_NAME);
  PropertiesService.getScriptProperties().setProperty('PREVIEW_DRIVE_ROOT_ID', folder.getId());
  return folder;
}

function uploadPreviewPhoto_(base64Data, mimeType, serial, techId) {
  if (!base64Data) return '';
  var bytes = Utilities.base64Decode(base64Data);
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new Error('حجم الصورة كبير جداً (الحد الأقصى 5 ميغابايت)');
  }
  var mime = String(mimeType || 'image/jpeg').split(';')[0];
  var ext = mime.indexOf('png') !== -1 ? 'png' : 'jpg';
  var stamp = Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyyMMdd_HHmmss');
  var fileName = 'preview_' + techId + '_' + serial + '_' + stamp + '.' + ext;
  var root = getPreviewDriveRootFolder_();
  var folder = root.createFolder('معاينة_' + serial + '_' + stamp);
  var file = folder.createFile(Utilities.newBlob(bytes, mime, fileName));
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {}
  return 'https://drive.google.com/file/d/' + file.getId() + '/view?usp=drivesdk';
}

function formatPreviewDateTime_(value) {
  var d = value instanceof Date ? value : new Date(value);
  return Utilities.formatDate(d, 'Africa/Cairo', 'dd/MM/yyyy hh:mm:ss a');
}

/** حفظ فحص تعذر معاينة في تبويب تعذر معاينة */
function techSubmitPreviewInspection(payload) {
  const found = verifyTechAuth_(payload.techId, payload.pin);
  const serial = String(payload.serial || '').trim();
  if (!serial) {
    throw new Error('رقم المسلسل مطلوب');
  }

  const inspectionResult = String(payload.inspectionResult || '').trim();
  if (PREVIEW_INSPECTION_RESULTS.indexOf(inspectionResult) === -1) {
    throw new Error('اختر نتيجة الفحص من القائمة');
  }

  const photoBase64 = String(payload.photoBase64 || '').trim();
  if (!photoBase64) {
    throw new Error('يجب التقاط صورة للفحص');
  }

  const msanCabinet = String(payload.msanCabinet || '').trim();
  if (!msanCabinet) {
    throw new Error('كابينة MSAN مطلوبة');
  }
  const cableNumber = String(payload.cableNumber || '').trim();
  if (!cableNumber) {
    throw new Error('رقم الكابل مطلوب');
  }
  const cabinetNumber = String(payload.cabinetNumber || '').trim();
  if (!cabinetNumber) {
    throw new Error('رقم الكابينة مطلوب');
  }
  const boxNumber = String(payload.boxNumber || '').trim();
  if (!boxNumber) {
    throw new Error('رقم البكس مطلوب');
  }
  const notes = String(payload.notes || '').trim();
  if (!notes) {
    throw new Error('الملاحظات مطلوبة');
  }

  const location = payload.location || null;
  if (!location || location.lat == null || location.lng == null) {
    throw new Error('يجب تحديد الموقع قبل الإرسال — اضغط «تحديد موقعي»');
  }

  const techId = String(payload.techId || '').trim();
  const techName = String(found.values[TECH_COL.NAME - 1] || '').trim();
  const customerName = String(payload.customerName || '').trim();
  const customerMobile = String(payload.customerMobile || '').trim();
  const customerAddress = String(payload.customerAddress || '').trim();
  const mapsUrl = 'https://www.google.com/maps?q=' + Number(location.lat) + ',' + Number(location.lng);
  const photoUrl = uploadPreviewPhoto_(photoBase64, payload.photoMimeType, serial, techId);
  const now = new Date();

  const sheet = getFarshootPreviewSheet_();
  ensurePreviewSheetHeaders_(sheet);
  sheet.appendRow([
    formatPreviewDateTime_(now),
    serial,
    techName,
    customerMobile,
    customerName,
    customerAddress,
    msanCabinet,
    cableNumber,
    cabinetNumber,
    boxNumber,
    notes,
    inspectionResult,
    mapsUrl,
    photoUrl
  ]);

  return { success: true, message: 'تم حفظ فحص التعذر في الشيت بنجاح' };
}

function previewRowToRecord_(row, rowNumber) {
  var dateVal = row[0];
  var dateTime = dateVal instanceof Date
    ? formatPreviewDateTime_(dateVal)
    : String(dateVal || '').trim();
  return {
    row: rowNumber,
    dateTime: dateTime,
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

function isPreviewRowEmpty_(row) {
  for (var i = 0; i < 14; i++) {
    if (String(row[i] || '').trim()) return false;
  }
  return true;
}

/** قائمة سجلات تعذر المعاينة للسنترال */
function centralGetPreviewInspections(payload) {
  verifyCentralAuth_(payload.pin);
  var sheet = getFarshootPreviewSheet_();
  var data = sheet.getDataRange().getValues();
  var records = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (isPreviewRowEmpty_(row)) continue;
    records.push(previewRowToRecord_(row, i + 1));
  }

  records.sort(function (a, b) {
    return b.row - a.row;
  });

  return {
    records: records,
    total: records.length,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + FARSHOOT_DATA_SPREADSHEET_ID +
      '/edit?gid=' + FARSHOOT_PREVIEW_SHEET_GID
  };
}

function sheetCellToDateTime_(value) {
  if (value instanceof Date) {
    return formatPreviewDateTime_(value);
  }
  if (typeof value === 'number' && isFinite(value) && value > 20000) {
    var epoch = new Date(1899, 11, 30);
    return formatPreviewDateTime_(new Date(epoch.getTime() + value * 86400000));
  }
  var s = String(value || '').trim();
  if (/^\d+(\.\d+)?$/.test(s) && parseFloat(s) > 20000) {
    var epoch2 = new Date(1899, 11, 30);
    return formatPreviewDateTime_(new Date(epoch2.getTime() + parseFloat(s) * 86400000));
  }
  return s;
}

function techNoteRowToRecord_(row, rowNumber) {
  return {
    row: rowNumber,
    dateTime: sheetCellToDateTime_(row[0]),
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

function isTechNoteRowEmpty_(row) {
  for (var i = 0; i < 12; i++) {
    if (String(row[i] || '').trim()) return false;
  }
  return true;
}

function normalizeArabicLabel_(text) {
  return String(text || '').trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function isGroundFaultReportType_(reportType) {
  var normalized = normalizeArabicLabel_(reportType);
  return normalized === 'عطل ارضي' || normalized.indexOf('عطل ارض') !== -1;
}

function isTransferredToNetworksAction_(action) {
  return normalizeArabicLabel_(action).indexOf('تحويل للشبكات') !== -1;
}

function landlineDigitsForMatch_(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

function landlineMatchesSearch_(cellValue, targetLandline) {
  var cell = String(cellValue || '').trim();
  if (!cell) return false;
  var targetNorm = normalizeLandlineForMatch_(targetLandline);
  var cellNorm = normalizeLandlineForMatch_(cell);
  if (targetNorm && cellNorm === targetNorm) return true;
  var targetDigits = landlineDigitsForMatch_(targetLandline);
  var cellDigits = landlineDigitsForMatch_(cell);
  if (!targetDigits || targetDigits.length < 4) return false;
  return cellDigits === targetDigits ||
    (cellDigits.length >= 4 && targetDigits.endsWith(cellDigits)) ||
    (cellDigits.length >= 4 && cellDigits.endsWith(targetDigits));
}

function landlineMatchesArchiveTicket_(cellValue, targetLandline) {
  var cell = String(cellValue || '').trim();
  if (!cell) return false;
  var parts = cell.split(/[/,،|]/);
  var i;
  for (i = 0; i < parts.length; i++) {
    if (landlineMatchesSearch_(parts[i].trim(), targetLandline)) return true;
  }
  return landlineMatchesSearch_(cell, targetLandline);
}

function getNetworkArchiveSheet_() {
  var ss = getSpreadsheet_();
  var byName = ss.getSheetByName(NETWORK_ARCHIVE_SHEET_NAME);
  if (byName) {
    return byName;
  }
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === NETWORK_ARCHIVE_SHEET_GID) {
      return sheets[i];
    }
  }
  throw new Error('لم يتم العثور على تبويب «' + NETWORK_ARCHIVE_SHEET_NAME + '» في الشيت');
}

function networkArchiveRowToRecord_(row, rowNumber) {
  return {
    row: rowNumber,
    dateTime: sheetCellToDateTime_(row[0]),
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

function networkArchiveFullRowToRecord_(row, rowNumber) {
  return {
    row: rowNumber,
    dateTime: sheetCellToDateTime_(row[0]),
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

function isNetworkArchiveRowEmpty_(row) {
  for (var i = 0; i < 16; i++) {
    if (String(row[i] || '').trim()) return false;
  }
  return true;
}

/** الإصلاحات الأرضية — أرشيف الشبكات أو فحص الشبكات للسنترال */
function centralGetGroundRepairs(payload) {
  verifyCentralAuth_(payload.pin);
  var source = String(payload.source || 'archive').trim();
  var useInspection = source === 'inspection';
  var sheet = useInspection ? getNetworkInspectionSheet_() : getNetworkArchiveSheet_();
  var data = sheet.getDataRange().getValues();
  var records = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (isNetworkArchiveRowEmpty_(row)) continue;
    records.push(networkArchiveFullRowToRecord_(row, i + 1));
  }

  records.sort(function (a, b) {
    return b.row - a.row;
  });

  return {
    records: records,
    total: records.length,
    source: useInspection ? 'inspection' : 'archive',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID +
      '/edit?gid=' + (useInspection ? NETWORK_INSPECTION_SHEET_GID : NETWORK_ARCHIVE_SHEET_GID)
  };
}

/** أرشيف إصلاحات الشبكات لرقم تليفون — تبويب ارشيف الشبكات */
function netTechGetNetworkArchive(payload) {
  verifyTechAuth_(payload.techId, payload.pin);

  var landline = String(payload.landline || '').trim();
  if (!landline) {
    throw new Error('رقم التليفون مطلوب');
  }

  var sheet = getNetworkArchiveSheet_();
  var data = sheet.getDataRange().getValues();
  var records = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!landlineMatchesArchiveTicket_(row[1], landline)) continue;
    records.push(networkArchiveRowToRecord_(row, i + 1));
  }

  records.sort(function (a, b) {
    return b.row - a.row;
  });

  return {
    records: records,
    total: records.length,
    landline: landline,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID +
      '/edit?gid=' + NETWORK_ARCHIVE_SHEET_GID
  };
}

function networkInspectionRowToHistoryRecord_(row, rowNumber) {
  return {
    row: rowNumber,
    dateTime: sheetCellToDateTime_(row[0]),
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

/** سجل فحوصات رقم تليفون — من شيت فحص الشبكات (تاب لم يُصلَح بعد) */
function netTechGetNetworkInspectionHistory(payload) {
  verifyTechAuth_(payload.techId, payload.pin);

  var landline = String(payload.landline || '').trim();
  if (!landline) {
    throw new Error('رقم التليفون مطلوب');
  }

  var sheet = getNetworkInspectionSheet_();
  var data = sheet.getDataRange().getValues();
  var records = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!landlineMatchesArchiveTicket_(row[1], landline)) continue;
    records.push(networkInspectionRowToHistoryRecord_(row, i + 1));
  }

  records.sort(function (a, b) {
    return b.row - a.row;
  });

  return {
    records: records,
    total: records.length,
    landline: landline,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID +
      '/edit?gid=' + NETWORK_INSPECTION_SHEET_GID
  };
}

function farshootRowToRecord_(headers, row, rowNumber) {
  var record = {};
  for (var c = 0; c < headers.length; c++) {
    if (headers[c]) {
      record[headers[c]] = String(row[c] || '').trim();
    }
  }
  return {
    row: rowNumber,
    headers: headers.filter(function (h) { return h; }),
    data: record
  };
}

function getFarshootLandlineSearchColumns_(headers) {
  var priority = [];
  var i;
  for (i = 0; i < headers.length; i++) {
    var header = String(headers[i] || '').trim();
    if (!header) continue;
    if (/تذكر|تليفون|أرض|ارض|مسلسل|line|phone/i.test(header)) {
      priority.push(i);
    }
  }
  if (priority.length) return priority;
  var cols = [];
  for (i = 0; i < headers.length; i++) {
    if (headers[i]) cols.push(i);
  }
  return cols;
}

/** أعطال أرضية محوّلة للشبكات — لوحة فني الشبكات */
function netTechGetGroundFaults(payload) {
  verifyTechAuth_(payload.techId, payload.pin);
  var sheet = getTechNotesSheet_();
  var data = sheet.getDataRange().getValues();
  var records = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (isTechNoteRowEmpty_(row)) continue;
    var rec = techNoteRowToRecord_(row, i + 1);
    if (!isGroundFaultReportType_(rec.reportType)) continue;
    if (!isTransferredToNetworksAction_(rec.action)) continue;
    records.push(rec);
  }

  records.sort(function (a, b) {
    return b.row - a.row;
  });

  return {
    records: records,
    total: records.length,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID +
      '/edit?gid=' + TECH_NOTES_SHEET_GID
  };
}

function networkInspectionRowToListRecord_(row, rowNumber) {
  return {
    row: rowNumber,
    dateTime: sheetCellToDateTime_(row[0]),
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
    sourceDateTime: sheetCellToDateTime_(row[16])
  };
}

function isUnrepairedNetworkInspectionStatus_(status) {
  var normalized = normalizeArabicLabel_(status);
  if (!normalized) return false;
  return normalized.indexOf('جاري') !== -1 ||
    normalized.indexOf('يصعب') !== -1 ||
    normalized.indexOf('انتظار') !== -1;
}

function findOpenNetworkInspectionsForLandline_(landline) {
  var targetLandline = normalizeLandlineForMatch_(landline);
  if (!targetLandline) return [];
  var sheet = getNetworkInspectionSheet_();
  var data = sheet.getDataRange().getValues();
  var matches = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowLandline = normalizeLandlineForMatch_(String(row[1] || '').trim());
    if (!rowLandline || rowLandline !== targetLandline) continue;
    if (!isUnrepairedNetworkInspectionStatus_(row[8])) continue;
    matches.push({
      row: i + 1,
      repairStatus: String(row[8] || '').trim(),
      dateTime: sheetCellToDateTime_(row[0])
    });
  }

  matches.sort(function (a, b) {
    return b.row - a.row;
  });
  return matches;
}

function assertNoOpenNetworkInspectionForLandline_(landline) {
  var matches = findOpenNetworkInspectionsForLandline_(landline);
  if (!matches.length) return;
  var latest = matches[0];
  throw new Error(
    'رقم التليفون ' + landline + ' موجود في شيت فحص الشبكات كعطل مفتوح' +
    (latest.repairStatus ? ' (حالة: ' + latest.repairStatus + ')' : '') +
    '. يرجى التوجه إلى قسم «أعطال أرضية تم فحصها ولم يتم إصلاحها».'
  );
}

/** أعطال أرضية مُفحوصة ولم يُصلَح بعد — من شيت فحص الشبكات */
function netTechGetUnrepairedInspections(payload) {
  verifyTechAuth_(payload.techId, payload.pin);
  var sheet = getNetworkInspectionSheet_();
  var data = sheet.getDataRange().getValues();
  var records = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!String(row[1] || '').trim() && !String(row[8] || '').trim()) continue;
    if (!isUnrepairedNetworkInspectionStatus_(row[8])) continue;
    records.push(networkInspectionRowToListRecord_(row, i + 1));
  }

  records.sort(function (a, b) {
    return b.row - a.row;
  });

  return {
    records: records,
    total: records.length,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID +
      '/edit?gid=' + NETWORK_INSPECTION_SHEET_GID
  };
}

/** هل يوجد فحص شبكات مفتوح (لم يُصلَح) لنفس رقم التليفون؟ */
function netTechCheckOpenNetworkInspection(payload) {
  verifyTechAuth_(payload.techId, payload.pin);
  var landline = String(payload.landline || '').trim();
  if (!landline) {
    throw new Error('رقم التليفون مطلوب');
  }
  var matches = findOpenNetworkInspectionsForLandline_(landline);

  return {
    open: matches.length > 0,
    landline: landline,
    count: matches.length,
    latest: matches.length ? matches[0] : null
  };
}

/** بحث رقم تليفون/تذكرة في تبويب بيانات شيت فرشوط — فحص الشبكات */
function techSearchLandlineData(payload) {
  verifyTechAuth_(payload.techId, payload.pin);
  var landline = String(payload.landline || '').trim();
  if (!landline) {
    throw new Error('أدخل رقم التليفون');
  }

  var sheet = getFarshootDataSheet_();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return { found: false, landline: landline, matches: [], total: 0 };
  }

  var headers = data[0].map(function (h) { return String(h || '').trim(); });
  var searchCols = getFarshootLandlineSearchColumns_(headers);
  var matches = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var matched = false;
    for (var c = 0; c < searchCols.length; c++) {
      if (landlineMatchesSearch_(row[searchCols[c]], landline)) {
        matched = true;
        break;
      }
    }
    if (matched) {
      matches.push(farshootRowToRecord_(headers, row, i + 1));
    }
  }

  return {
    found: matches.length > 0,
    landline: landline,
    matches: matches,
    total: matches.length
  };
}

function getNetworkInspectionSheet_() {
  var ss = getSpreadsheet_();
  var byName = ss.getSheetByName(NETWORK_INSPECTION_SHEET_NAME);
  if (byName) {
    return byName;
  }
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === NETWORK_INSPECTION_SHEET_GID) {
      return sheets[i];
    }
  }
  throw new Error('لم يتم العثور على تبويب «' + NETWORK_INSPECTION_SHEET_NAME + '» في الشيت');
}

function ensureNetworkInspectionSheetHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(NETWORK_INSPECTION_SHEET_HEADERS);
    sheet.getRange(1, 1, 1, NETWORK_INSPECTION_SHEET_HEADERS.length).setFontWeight('bold');
    return;
  }
  var width = Math.max(sheet.getLastColumn(), NETWORK_INSPECTION_SHEET_HEADERS.length);
  var firstRow = sheet.getRange(1, 1, 1, width).getValues()[0];
  var needsHeaders = NETWORK_INSPECTION_SHEET_HEADERS.every(function (_header, index) {
    return !firstRow[index];
  });
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, NETWORK_INSPECTION_SHEET_HEADERS.length).setValues([NETWORK_INSPECTION_SHEET_HEADERS]);
    sheet.getRange(1, 1, 1, NETWORK_INSPECTION_SHEET_HEADERS.length).setFontWeight('bold');
  }
}

function getNetworkInspectionDriveRootFolder_() {
  var storedId = PropertiesService.getScriptProperties().getProperty('NETWORK_INSPECTION_DRIVE_ROOT_ID');
  if (storedId) {
    try { return DriveApp.getFolderById(storedId); } catch (err) {}
  }
  var folders = DriveApp.getFoldersByName(NETWORK_INSPECTION_DRIVE_ROOT_NAME);
  if (folders.hasNext()) {
    var existing = folders.next();
    PropertiesService.getScriptProperties().setProperty('NETWORK_INSPECTION_DRIVE_ROOT_ID', existing.getId());
    return existing;
  }
  var folder = DriveApp.createFolder(NETWORK_INSPECTION_DRIVE_ROOT_NAME);
  PropertiesService.getScriptProperties().setProperty('NETWORK_INSPECTION_DRIVE_ROOT_ID', folder.getId());
  return folder;
}

function uploadNetworkInspectionPhoto_(base64Data, mimeType, landline, techId) {
  if (!base64Data) return '';
  var bytes = Utilities.base64Decode(base64Data);
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new Error('حجم الصورة كبير جداً (الحد الأقصى 5 ميغابايت)');
  }
  var mime = String(mimeType || 'image/jpeg').split(';')[0];
  var ext = mime.indexOf('png') !== -1 ? 'png' : 'jpg';
  var stamp = Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyyMMdd_HHmmss');
  var safeLine = String(landline || '').replace(/[^\d]/g, '') || 'line';
  var fileName = 'net_' + techId + '_' + safeLine + '_' + stamp + '.' + ext;
  var root = getNetworkInspectionDriveRootFolder_();
  var folder = root.createFolder('فحص_' + safeLine + '_' + stamp);
  var file = folder.createFile(Utilities.newBlob(bytes, mime, fileName));
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {}
  return 'https://drive.google.com/file/d/' + file.getId() + '/view?usp=drivesdk';
}

function deriveNetworkWorkType_(connectionType) {
  var t = String(connectionType || '').trim().toLowerCase();
  if (t === 'ftth') return 'أعمال شبكة فيبر';
  if (t === 'msan') return 'أعمال شبكة نحاس';
  return String(connectionType || '').trim();
}

function normalizeNetworkWorkClassification_(value) {
  var raw = normalizeArabicLabel_(value);
  for (var i = 0; i < NETWORK_WORK_CLASSIFICATIONS.length; i++) {
    if (normalizeArabicLabel_(NETWORK_WORK_CLASSIFICATIONS[i]) === raw) {
      return NETWORK_WORK_CLASSIFICATIONS[i];
    }
  }
  return '';
}

function normalizeNetworkRepairStatus_(value) {
  var raw = normalizeArabicLabel_(value);
  for (var i = 0; i < NETWORK_REPAIR_STATUSES.length; i++) {
    if (normalizeArabicLabel_(NETWORK_REPAIR_STATUSES[i]) === raw) {
      return NETWORK_REPAIR_STATUSES[i];
    }
  }
  return '';
}

function findGroundFaultSourceRecord_(sourceRow, landline, sourceDateTime) {
  var sheet = getTechNotesSheet_();
  var data = sheet.getDataRange().getValues();
  var rowNum = Number(sourceRow);

  if (rowNum >= 2 && rowNum <= data.length) {
    var byRow = data[rowNum - 1];
    if (!isTechNoteRowEmpty_(byRow)) {
      var recByRow = techNoteRowToRecord_(byRow, rowNum);
      if (isGroundFaultReportType_(recByRow.reportType) &&
          isTransferredToNetworksAction_(recByRow.action) &&
          recByRow.landline === landline) {
        return recByRow;
      }
    }
  }

  var targetDateTime = String(sourceDateTime || '').trim();
  if (!targetDateTime) return null;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (isTechNoteRowEmpty_(row)) continue;
    var rec = techNoteRowToRecord_(row, i + 1);
    if (!isGroundFaultReportType_(rec.reportType)) continue;
    if (!isTransferredToNetworksAction_(rec.action)) continue;
    if (rec.landline !== landline) continue;
    if (rec.dateTime === targetDateTime) return rec;
  }

  return null;
}

/** حفظ فحص عطل أرضي في تبويب فحص الشبكات */
function netTechSubmitNetworkInspection(payload) {
  verifyTechAuth_(payload.techId, payload.pin);

  var landline = String(payload.landline || '').trim();
  if (!landline) {
    throw new Error('رقم التليفون مطلوب');
  }

  var sourceDateTime = String(payload.sourceDateTime || '').trim();
  var sourceRow = Number(payload.sourceRow || 0);
  if (!sourceDateTime && !sourceRow) {
    throw new Error('يجب اختيار سجل العطل من الجدول (الرقم مع التاريخ والوقت)');
  }

  var sourceRecord = findGroundFaultSourceRecord_(sourceRow, landline, sourceDateTime);
  if (!sourceRecord) {
    throw new Error('تعذر ربط الفحص بسجل العطل المحدد — حدّث الجدول واختر السجل من جديد');
  }
  sourceDateTime = sourceRecord.dateTime || sourceDateTime;

  var fromUnrepairedTab = payload.fromUnrepairedTab === true || String(payload.fromUnrepairedTab || '') === 'true';
  if (!fromUnrepairedTab) {
    assertNoOpenNetworkInspectionForLandline_(landline);
  }

  var welderName = String(payload.welderName || '').trim();
  if (!welderName) {
    throw new Error('اللحاميين القائمين بالعمل مطلوبون');
  }

  var workClassification = normalizeNetworkWorkClassification_(payload.workClassification);
  if (!workClassification) {
    throw new Error('اختر تصنيف الأعمال من القائمة');
  }

  var repairStatus = normalizeNetworkRepairStatus_(payload.repairStatus);
  if (!repairStatus) {
    throw new Error('اختر حالة الإصلاح من القائمة');
  }

  var photoBase64 = String(payload.photoBase64 || '').trim();
  if (!photoBase64) {
    throw new Error('يجب التقاط صورة للفحص');
  }

  var location = payload.location || null;
  if (!location || location.lat == null || location.lng == null) {
    throw new Error('يجب التقاط الصورة مع الموقع — اضغط «التقاط صورة مع الموقع»');
  }
  var mapsUrl = 'https://www.google.com/maps?q=' + Number(location.lat) + ',' + Number(location.lng);

  var techId = String(payload.techId || '').trim();
  var originalTech = String(payload.originalTech || sourceRecord.tech || '').trim();
  var companionWorker = String(payload.companionWorker || '').trim();
  var materialsUsed = String(payload.materialsUsed || '').trim();
  var reportAckName = String(payload.reportAckName || '').trim();
  var inspectionNotes = String(payload.inspectionNotes || '').trim();
  var cableNumber = String(payload.cableNumber || sourceRecord.cableNumber || '').trim();
  var cabinetNumber = String(payload.cabinetNumber || sourceRecord.cabinetNumber || '').trim();
  var boxNumber = String(payload.boxNumber || sourceRecord.boxNumber || '').trim();
  var workType = deriveNetworkWorkType_(payload.connectionType || sourceRecord.connectionType);
  var photoUrl = uploadNetworkInspectionPhoto_(photoBase64, payload.photoMimeType, landline, techId);
  var now = new Date();

  var sheet = getNetworkInspectionSheet_();
  ensureNetworkInspectionSheetHeaders_(sheet);
  sheet.appendRow([
    formatPreviewDateTime_(now),
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
  ]);

  return {
    success: true,
    message: 'تم حفظ فحص العطل الأرضي في شيت فحص الشبكات بنجاح'
  };
}

/** قائمة إبلاغات الفنيين للسنترال */
function centralGetTechnicianNotes(payload) {
  verifyCentralAuth_(payload.pin);
  var sheet = getTechNotesSheet_();
  var data = sheet.getDataRange().getValues();
  var records = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (isTechNoteRowEmpty_(row)) continue;
    records.push(techNoteRowToRecord_(row, i + 1));
  }

  records.sort(function (a, b) {
    return b.row - a.row;
  });

  return {
    records: records,
    total: records.length,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID +
      '/edit?gid=' + TECH_NOTES_SHEET_GID
  };
}

function getTechNotesSheet_() {
  const ss = getSpreadsheet_();
  const byName = ss.getSheetByName(TECH_NOTES_SHEET_NAME);
  if (byName) {
    return byName;
  }
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === TECH_NOTES_SHEET_GID) {
      return sheets[i];
    }
  }
  throw new Error('لم يتم العثور على تبويب «' + TECH_NOTES_SHEET_NAME + '» في الشيت');
}

function ensureTechNotesSheetHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(TECH_NOTES_SHEET_HEADERS);
    sheet.getRange(1, 1, 1, TECH_NOTES_SHEET_HEADERS.length).setFontWeight('bold');
    return;
  }
  const width = Math.max(sheet.getLastColumn(), TECH_NOTES_SHEET_HEADERS.length);
  const firstRow = sheet.getRange(1, 1, 1, width).getValues()[0];
  const needsHeaders = TECH_NOTES_SHEET_HEADERS.every(function (_header, index) {
    return !firstRow[index];
  });
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, TECH_NOTES_SHEET_HEADERS.length).setValues([TECH_NOTES_SHEET_HEADERS]);
    sheet.getRange(1, 1, 1, TECH_NOTES_SHEET_HEADERS.length).setFontWeight('bold');
  }
}

function getTechNotesDriveRootFolder_() {
  var storedId = PropertiesService.getScriptProperties().getProperty('TECH_NOTES_DRIVE_ROOT_ID');
  if (storedId) {
    try { return DriveApp.getFolderById(storedId); } catch (err) {}
  }
  var folders = DriveApp.getFoldersByName(TECH_NOTES_DRIVE_ROOT_NAME);
  if (folders.hasNext()) {
    var existing = folders.next();
    PropertiesService.getScriptProperties().setProperty('TECH_NOTES_DRIVE_ROOT_ID', existing.getId());
    return existing;
  }
  var folder = DriveApp.createFolder(TECH_NOTES_DRIVE_ROOT_NAME);
  PropertiesService.getScriptProperties().setProperty('TECH_NOTES_DRIVE_ROOT_ID', folder.getId());
  return folder;
}

function uploadTechNotePhoto_(base64Data, mimeType, landline, techId) {
  if (!base64Data) return '';
  var bytes = Utilities.base64Decode(base64Data);
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new Error('حجم الصورة كبير جداً (الحد الأقصى 5 ميغابايت)');
  }
  var mime = String(mimeType || 'image/jpeg').split(';')[0];
  var ext = mime.indexOf('png') !== -1 ? 'png' : 'jpg';
  var stamp = Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyyMMdd_HHmmss');
  var safeLine = String(landline || '').replace(/[^\d]/g, '') || 'line';
  var fileName = 'note_' + techId + '_' + safeLine + '_' + stamp + '.' + ext;
  var root = getTechNotesDriveRootFolder_();
  var folder = root.createFolder('ملاحظة_' + safeLine + '_' + stamp);
  var file = folder.createFile(Utilities.newBlob(bytes, mime, fileName));
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {}
  return 'https://drive.google.com/file/d/' + file.getId() + '/view?usp=drivesdk';
}

function validateTechNoteLandlineOrLines_(reportType, value) {
  const type = String(reportType || '').trim();
  const raw = String(value || '').trim();
  if (type === 'اعمال صيانة') {
    const n = parseInt(raw, 10);
    if (!raw || !/^\d+$/.test(raw) || n < 1) {
      throw new Error('أدخل عدد الخطوط (رقم صحيح موجب)');
    }
    return String(n);
  }
  return validateLandline_(raw);
}

/** حفظ إبلاغ فني في تبويب ملاحظات الفنيين */
function techSubmitTechnicianNote(payload) {
  const found = verifyTechAuth_(payload.techId, payload.pin);

  const reportType = String(payload.reportType || '').trim();
  if (TECH_NOTE_REPORT_TYPES.indexOf(reportType) === -1) {
    throw new Error('اختر نوع الإبلاغ من القائمة');
  }

  const landline = validateTechNoteLandlineOrLines_(reportType, payload.landline);

  const actionTaken = String(payload.actionTaken || '').trim();
  if (TECH_NOTE_ACTIONS.indexOf(actionTaken) === -1) {
    throw new Error('اختر الإجراء المتخذ من القائمة');
  }

  const notes = String(payload.notes || '').trim();
  if (!notes) {
    throw new Error('الملاحظات مطلوبة');
  }

  const cableNumber = String(payload.cableNumber || '').trim();
  if (!cableNumber) {
    throw new Error('رقم الكابل مطلوب');
  }
  const cabinetNumber = String(payload.cabinetNumber || '').trim();
  if (!cabinetNumber) {
    throw new Error('رقم الكابينة مطلوب');
  }
  const boxNumber = String(payload.boxNumber || '').trim();
  if (!boxNumber) {
    throw new Error('رقم البكس مطلوب');
  }

  const connectionType = String(payload.connectionType || '').trim().toLowerCase();
  if (TECH_NOTE_CONNECTION_TYPES.indexOf(connectionType) === -1) {
    throw new Error('اختر النوع (msan أو ftth) من القائمة');
  }

  const photoBase64 = String(payload.photoBase64 || '').trim();
  if (!photoBase64) {
    throw new Error('يجب التقاط صورة للإبلاغ');
  }

  const location = payload.location || null;
  if (!location || location.lat == null || location.lng == null) {
    throw new Error('يجب التقاط الصورة مع الموقع — اضغط «التقاط صورة مع الموقع»');
  }

  const techId = String(payload.techId || '').trim();
  const techName = String(found.values[TECH_COL.NAME - 1] || '').trim();
  const mapsUrl = 'https://www.google.com/maps?q=' + Number(location.lat) + ',' + Number(location.lng);
  const photoUrl = uploadTechNotePhoto_(photoBase64, payload.photoMimeType, landline, techId);
  const now = new Date();

  const sheet = getTechNotesSheet_();
  ensureTechNotesSheetHeaders_(sheet);
  sheet.appendRow([
    formatPreviewDateTime_(now),
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
  ]);

  return { success: true, message: 'تم حفظ الإبلاغ في شيت ملاحظات الفنيين بنجاح' };
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
    getTechSheet_();
    getMessagesSheet_();
    getAnnouncementsSheet_();
    Logger.log('تم إعداد تبويبي الفنيين والرسائل والإعلانات');
    Logger.log('تم إعداد الشيت بنجاح');
  } catch (err) {
    Logger.log('خطأ: ' + (err.message || err));
    throw err;
  }
}
