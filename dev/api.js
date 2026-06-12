const sheets = require('./sheets');

async function proxyToAppsScript(fnName, payload) {
  const url = (process.env.APPS_SCRIPT_URL || '').trim();
  if (!url) {
    throw new Error('APPS_SCRIPT_URL غير مضبوط');
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: fnName, payload }),
      redirect: 'follow'
    });
  } catch (err) {
    const detail = err.cause && (err.cause.code || err.cause.message);
    throw new Error(
      detail
        ? 'تعذر الاتصال بـ Apps Script (' + detail + ') — أعد تشغيل الخادم أو تحقق من الاتصال بالإنترنت'
        : 'تعذر الاتصال بـ Apps Script — أعد تشغيل الخادم (npm run dev) أو تحقق من APPS_SCRIPT_URL'
    );
  }

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_err) {
    throw new Error(
      'APPS_SCRIPT_URL غير صالح أو غير منشور. افتح Deploy → Manage deployments في Apps Script وتأكد أن الرابط ينتهي بـ /exec'
    );
  }
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

function useAppsScriptProxy() {
  return Boolean(process.env.APPS_SCRIPT_URL);
}

async function submitReport(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('submitReport', payload);
  }
  return sheets.submitReport(payload);
}

async function getStatus(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('getStatus', payload);
  }
  return sheets.getStatus(payload.landline, payload.mobile);
}

async function submitRating(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('submitRating', payload);
  }
  return sheets.submitRating(payload);
}

async function reopenTicket(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('reopenTicket', payload);
  }
  return sheets.reopenTicket(payload);
}

async function submitNewComplaint(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('submitNewComplaint', payload);
  }
  return sheets.submitNewComplaint(payload);
}

async function changeCustomerMobile(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('changeCustomerMobile', payload);
  }
  throw new Error('تغيير رقم الموبايل متاح فقط عبر Apps Script');
}

async function centralListTickets(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('centralListTickets', payload);
  }
  return sheets.centralListTickets(payload);
}

async function centralGetTicket(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('centralGetTicket', payload);
  }
  return sheets.centralGetTicket(payload);
}

async function centralUpdateTicket(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('centralUpdateTicket', payload);
  }
  return sheets.centralUpdateTicket(payload);
}

async function centralAddRepairedLandline(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('centralAddRepairedLandline', payload);
  }
  return sheets.centralAddRepairedLandline(payload);
}

function getBackendMode() {
  if (useAppsScriptProxy()) {
    return 'apps-script';
  }
  if (sheets.hasCredentials()) {
    return 'google-sheets';
  }
  return 'missing';
}

module.exports = {
  submitReport,
  getStatus,
  submitRating,
  reopenTicket,
  submitNewComplaint,
  changeCustomerMobile,
  centralListTickets,
  centralGetTicket,
  centralUpdateTicket,
  centralAddRepairedLandline,
  getBackendMode
};
