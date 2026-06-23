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

function isUnknownFunctionError(err) {
  const msg = String(err && err.message || '');
  return msg.indexOf('غير معروف') !== -1 || msg.indexOf('غير موجود') !== -1;
}

async function proxyToAppsScriptWithSheetsFallback(fnName, payload, sheetsFn) {
  if (!useAppsScriptProxy()) {
    return sheetsFn(payload);
  }
  try {
    return await proxyToAppsScript(fnName, payload);
  } catch (err) {
    if (isUnknownFunctionError(err) && sheets.hasCredentials()) {
      return sheetsFn(payload);
    }
    throw err;
  }
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

async function startChat(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('startChat', payload);
  }
  return sheets.startChat(payload);
}

async function getConversation(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('getConversation', payload);
  }
  return sheets.getConversation(payload);
}

async function sendCustomerMessage(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('sendCustomerMessage', payload);
  }
  return sheets.sendCustomerMessage(payload);
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

async function centralForwardTechPhoto(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('centralForwardTechPhoto', payload);
  }
  return sheets.centralForwardTechPhoto(payload);
}

async function centralAddRepairedLandline(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('centralAddRepairedLandline', payload);
  }
  return sheets.centralAddRepairedLandline(payload);
}

async function centralListRatedTickets(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('centralListRatedTickets', payload);
  }
  return sheets.centralListRatedTickets(payload);
}

async function techList(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('techList', payload);
  }
  return sheets.techList(payload);
}

async function techAdd(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('techAdd', payload);
  }
  return sheets.techAdd(payload);
}

async function techUpdateStatus(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('techUpdateStatus', payload);
  }
  return sheets.techUpdateStatus(payload);
}

async function assignTechnician(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('assignTechnician', payload);
  }
  return sheets.assignTechnician(payload);
}

async function techLogin(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('techLogin', payload);
  }
  return sheets.techLogin(payload);
}

async function techListTasks(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('techListTasks', payload);
  }
  return sheets.techListTasks(payload);
}

async function techGetTask(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('techGetTask', payload);
  }
  return sheets.techGetTask(payload);
}

async function techSendMessage(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('techSendMessage', payload);
  }
  return sheets.techSendMessage(payload);
}

async function centralSendTechMessage(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('centralSendTechMessage', payload);
  }
  return sheets.centralSendTechMessage(payload);
}

async function centralCreateTechInspection(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('centralCreateTechInspection', payload);
  }
  return sheets.centralCreateTechInspection(payload);
}

async function centralListTechInspections(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('centralListTechInspections', payload);
  }
  return sheets.centralListTechInspections(payload);
}

async function centralGetTechInspection(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('centralGetTechInspection', payload);
  }
  return sheets.centralGetTechInspection(payload);
}

async function centralCloseTechInspection(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('centralCloseTechInspection', payload);
  }
  return sheets.centralCloseTechInspection(payload);
}

async function techSearchSerialData(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('techSearchSerialData', payload);
  }
  return sheets.techSearchSerialData(payload);
}

async function techSubmitPreviewInspection(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('techSubmitPreviewInspection', payload);
  }
  return sheets.techSubmitPreviewInspection(payload);
}

async function centralGetPreviewInspections(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('centralGetPreviewInspections', payload);
  }
  return sheets.centralGetPreviewInspections(payload);
}

async function centralGetTechnicianNotes(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('centralGetTechnicianNotes', payload);
  }
  return sheets.centralGetTechnicianNotes(payload);
}

async function techSubmitTechnicianNote(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('techSubmitTechnicianNote', payload);
  }
  return sheets.techSubmitTechnicianNote(payload);
}

async function netTechGetGroundFaults(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('netTechGetGroundFaults', payload);
  }
  return sheets.netTechGetGroundFaults(payload);
}

async function techSearchLandlineData(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('techSearchLandlineData', payload);
  }
  return sheets.techSearchLandlineData(payload);
}

async function netTechSubmitNetworkInspection(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('netTechSubmitNetworkInspection', payload);
  }
  return sheets.netTechSubmitNetworkInspection(payload);
}

async function centralGetGroundRepairs(payload) {
  return proxyToAppsScriptWithSheetsFallback(
    'centralGetGroundRepairs',
    payload,
    sheets.centralGetGroundRepairs
  );
}

async function netTechGetNetworkArchive(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('netTechGetNetworkArchive', payload);
  }
  return sheets.netTechGetNetworkArchive(payload);
}

async function netTechGetUnrepairedInspections(payload) {
  if (useAppsScriptProxy()) {
    return proxyToAppsScript('netTechGetUnrepairedInspections', payload);
  }
  return sheets.netTechGetUnrepairedInspections(payload);
}

async function netTechCheckOpenNetworkInspection(payload) {
  return proxyToAppsScriptWithSheetsFallback(
    'netTechCheckOpenNetworkInspection',
    payload,
    sheets.netTechCheckOpenNetworkInspection
  );
}

async function netTechGetNetworkInspectionHistory(payload) {
  return proxyToAppsScriptWithSheetsFallback(
    'netTechGetNetworkInspectionHistory',
    payload,
    sheets.netTechGetNetworkInspectionHistory
  );
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
  startChat,
  getConversation,
  sendCustomerMessage,
  submitRating,
  reopenTicket,
  submitNewComplaint,
  changeCustomerMobile,
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
  getBackendMode
};
