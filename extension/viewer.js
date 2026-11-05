// Chạy trên Exam Viewer: nhận bài thi và nạp qua ô chọn file có sẵn của trang,
// để đi đúng luồng như khi người dùng tự mở file (gồm cả lưu cục bộ và đồng bộ cloud).
(function () {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function importExam({ fileName, json }) {
    if (!$('quiz').hidden) throw new Error('Exam Viewer đang có bài làm dở, hãy nộp bài rồi gửi lại');
    const dt = new DataTransfer();
    dt.items.add(new File([json], fileName, { type: 'application/json' }));
    $('err').textContent = '';
    $('file').files = dt.files;
    $('file').dispatchEvent(new Event('change', { bubbles: true }));
    for (let i = 0; i < 50; i++) {
      if ($('err').textContent) throw new Error($('err').textContent);
      if (!$('review').hidden && $('fname').textContent === fileName) return;
      await sleep(100);
    }
    throw new Error('Exam Viewer không nạp được bài thi');
  }

  async function checkPending() {
    const exam = await chrome.runtime.sendMessage({ type: 'take-pending' });
    if (!exam?.json) return;
    const result = await importExam(exam).then(() => ({ ok: true }), (e) => ({ ok: false, error: e.message }));
    await chrome.runtime.sendMessage({ type: 'import-result', ...result });
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'exam-pending') { checkPending(); sendResponse(true); }
  });
  checkPending();
})();
