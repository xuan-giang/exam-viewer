// Chuyển JSON từ tab cloudexam.pro sang tab Exam Viewer.
// Bài thi chờ trong storage.session vì service worker có thể bị tắt khi tab Exam Viewer đang tải;
// viewer.js tự lấy bài khi vừa tải xong hoặc khi được báo có bài mới.
const VIEWER_URL = 'https://xuan-giang.github.io/exam-viewer/';

const isFrom = (sender, prefix) => sender.id === chrome.runtime.id && (sender.url || '').startsWith(prefix);

async function sendExam(msg, sender) {
  await chrome.storage.session.set({ pending: { fileName: msg.fileName, json: msg.json, sourceTabId: sender.tab.id } });
  const [tab] = await chrome.tabs.query({ url: VIEWER_URL + '*' });
  if (!tab) { await chrome.tabs.create({ url: VIEWER_URL }); return; }
  await chrome.tabs.update(tab.id, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
  // Tab mở từ trước khi cài extension thì chưa có viewer.js: tải lại để viewer.js chạy
  await chrome.tabs.sendMessage(tab.id, { type: 'exam-pending' }).catch(() => chrome.tabs.reload(tab.id));
}

async function takePending() {
  const { pending } = await chrome.storage.session.get('pending');
  if (!pending) return null;
  await chrome.storage.session.remove('pending');
  await chrome.storage.session.set({ sourceTabId: pending.sourceTabId });
  return { fileName: pending.fileName, json: pending.json };
}

async function importResult(msg) {
  const { sourceTabId } = await chrome.storage.session.get('sourceTabId');
  if (sourceTabId) await chrome.tabs.sendMessage(sourceTabId, { type: 'import-result', ok: msg.ok, error: msg.error }).catch(() => {});
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  let work;
  if (msg.type === 'send-exam' && isFrom(sender, 'https://cloudexam.pro/')) work = sendExam(msg, sender);
  else if (msg.type === 'take-pending' && isFrom(sender, VIEWER_URL)) work = takePending();
  else if (msg.type === 'import-result' && isFrom(sender, VIEWER_URL)) work = importResult(msg);
  else return false;
  work.then((r) => sendResponse(r ?? null), (e) => sendResponse({ error: e.message }));
  return true;
});
