// Chạy trên cloudexam.pro: hiện nút ở trang review, đọc bài thi từ DOM rồi gửi sang Exam Viewer.
(function () {
  const HEADER_SEL = 'div.bg-orange-400';
  const BLOCK_SEL = 'div.border.border-solid.border-\\[\\#d1d7dc\\]';
  const BTN_ID = '__exam_viewer_send';
  const BTN_LABEL = '➜ Gửi sang Exam Viewer';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const getQuestionNo = (header) => {
    const m = (header?.innerText || '').match(/Question\s+(\d+):/i);
    return m ? parseInt(m[1], 10) : null;
  };
  const headerNos = () => [...document.querySelectorAll(HEADER_SEL)].map(getQuestionNo).filter((n) => n !== null);

  // Trang chỉ render câu hỏi của tab đang chọn; số trên tab ("11 Marked") cho biết khi nào render xong
  async function openTab(re) {
    const tab = [...document.querySelectorAll('[role="tab"]')].find((t) => re.test(t.innerText));
    if (!tab) throw new Error('Không tìm thấy tab câu hỏi trên trang');
    const count = parseInt(tab.innerText, 10);
    tab.click();
    for (let i = 0; i < 50; i++) {
      if (tab.getAttribute('aria-selected') === 'true' && headerNos().length === count) return;
      await sleep(100);
    }
    throw new Error(`Tab "${tab.innerText.replace(/\s+/g, ' ').trim()}" không hiện đủ câu hỏi`);
  }

  // Định danh đề và lượt thi từ URL + tiêu đề trang: Exam Viewer dùng để gom các lần làm của cùng một đề
  function examIdentity() {
    const p = new URLSearchParams(location.search);
    const titleParts = document.title.split('|').map((s) => s.trim());
    const course = titleParts.length >= 3 ? titleParts[titleParts.length - 2] : '';
    const test = (document.querySelector('h1, h2')?.innerText || '').replace(/-\s*Results.*$/i, '').trim();
    return {
      course, test,
      exam_key: `cloudexam:${p.get('course')}:${p.get('exam')}`,
      exam_name: [course, test].filter(Boolean).join(' · '),
      attempt_id: p.get('attempt') || ''
    };
  }

  // HTML giải thích giữ nguyên cấu trúc của trang gốc, chỉ bỏ class/style của trang
  function cleanHtml(el) {
    if (!el) return '';
    const copy = el.cloneNode(true);
    copy.querySelectorAll('*').forEach((e) => [...e.attributes].forEach((a) => {
      if (!['href', 'src', 'alt'].includes(a.name)) e.removeAttribute(a.name);
    }));
    return copy.innerHTML.trim();
  }

  function readQuestion(block, markedSet, exportedAt, identity) {
    const header = block.querySelector(HEADER_SEL);
    const questionNo = getQuestionNo(header);
    if (questionNo === null) return null;

    const result = /Incorrect/i.test(header.innerText) ? 'incorrect'
      : /Skipped/i.test(header.innerText) ? 'skipped' : 'correct';
    const questionEl = block.querySelector('p.text-\\[15px\\]');

    // Câu 1 đáp án dùng role="radio" (chính là khung đáp án).
    // Câu nhiều đáp án dùng role="checkbox" (chỉ là ô tick), khung đáp án là div.group bọc ngoài.
    const checkboxes = [...block.querySelectorAll('[role="checkbox"]')];
    const isMulti = checkboxes.length > 0;
    const options = isMulti
      ? checkboxes.map((cb) => ({ box: cb.closest('div.group') || cb.parentElement, input: cb }))
      : [...block.querySelectorAll('[role="radio"]')].map((r) => ({ box: r, input: r }));

    const answers = {};
    const selected = [];
    const correct = [];
    options.forEach(({ box, input }) => {
      const labelSpan = [...box.querySelectorAll('span')].find((s) => /^[A-Z]\.$/.test(s.innerText.trim()));
      if (!labelSpan) return;
      const label = labelSpan.innerText.trim().replace('.', '');
      const text = (labelSpan.nextElementSibling?.innerText || '').trim();
      answers[label] = text;

      // Radio trên trang review luôn có aria-checked="false", nên dựa vào icon trong ô tròn:
      // tick xanh #197557 = chọn đúng, X đỏ #f2532f = chọn sai
      const fill = input.firstElementChild?.querySelector('svg')?.getAttribute('fill') || '';
      const isChecked = input.getAttribute('aria-checked') === 'true' ||
        (!isMulti && (fill === '#197557' || fill === '#f2532f' || box.className.includes('bg-[#f5d9d3]')));
      if (isChecked) selected.push({ label, text });
      if (box.className.includes('bg-[#d7f3e7]')) correct.push({ label, text });
    });
    selected.sort((a, b) => a.label.localeCompare(b.label));
    correct.sort((a, b) => a.label.localeCompare(b.label));

    const expBox = block.querySelector(':scope > div.bg-neutral-700');
    const expBody = expBox?.querySelector(':scope > div') || expBox;

    return {
      question_no: questionNo,
      result,
      is_correct: result === 'correct',
      question: (questionEl?.innerText || '').trim(),
      answers,
      selected_answer: selected.map((x) => x.label).join(', '),
      selected_answer_text: selected.map((x) => x.text).join(' | '),
      correct_answer: correct.map((x) => x.label).join(', '),
      correct_answer_text: correct.map((x) => x.text).join(' | '),
      marked_for_review: markedSet.has(questionNo),
      explanation: (expBody?.innerText || '').replace(/\n{3,}/g, '\n\n').trim(),
      explanation_html: cleanHtml(expBody),
      explanation_links: [...(expBody?.querySelectorAll('a[href]') || [])].map((a) => ({ text: a.innerText.trim(), url: a.href })),
      explanation_images: [...(expBody?.querySelectorAll('img[src]') || [])].map((img) => img.src),
      question_images: [...(questionEl?.querySelectorAll('img[src]') || [])].map((img) => img.src),
      exam_key: identity.exam_key,
      exam_name: identity.exam_name,
      attempt_id: identity.attempt_id,
      exported_at: exportedAt
    };
  }

  // Tên file cố định theo lượt thi, gửi lại cùng lượt không sinh tên mới
  function examFileName({ course, test, attempt_id: attempt }) {
    return [slug(course), slug(test), attempt && `attempt-${attempt}`].filter(Boolean).join('_') + '.json';
  }

  async function collectExam() {
    await openTab(/Marked/i);
    const markedSet = new Set(headerNos());
    await openTab(/All questions/i);

    const exportedAt = new Date().toISOString();
    const identity = examIdentity();
    const questions = [...document.querySelectorAll(BLOCK_SEL)]
      .map((block) => readQuestion(block, markedSet, exportedAt, identity))
      .filter(Boolean)
      .sort((a, b) => a.question_no - b.question_no);
    if (!questions.length) throw new Error('Không đọc được câu hỏi nào');

    const fileName = examFileName(identity);
    const json = JSON.stringify({ app: 'exam-viewer', version: 1, exported_at: exportedAt, source_file: fileName, questions, attempts: [] });
    return { fileName, json, total: questions.length, marked: markedSet.size };
  }

  let done = null; // gọi khi có kết quả từ tab Exam Viewer

  async function onSend(btn) {
    const setState = (text, color) => { btn.textContent = text; btn.style.background = color; };
    btn.disabled = true;
    setState('Đang đọc bài thi…', '#8c57ff');
    try {
      const { fileName, json, total, marked } = await collectExam();
      setState(`Đang gửi ${total} câu…`, '#8c57ff');
      const result = new Promise((resolve, reject) => {
        done = resolve;
        setTimeout(() => reject(new Error('Exam Viewer không phản hồi, hãy xem lại tab Exam Viewer')), 30000);
      });
      result.catch(() => {}); // lỗi gửi ở dưới sẽ thoát trước khi chờ kết quả
      const sent = await chrome.runtime.sendMessage({ type: 'send-exam', fileName, json });
      if (sent?.error) throw new Error(sent.error);
      const r = await result;
      if (!r.ok) throw new Error(r.error);
      setState(`✓ Đã gửi ${total} câu (${marked} đánh dấu)`, '#197557');
    } catch (e) {
      const msg = /Extension context invalidated/i.test(e.message) ? 'Extension vừa cập nhật, hãy tải lại trang này' : e.message;
      setState(`✗ ${msg}`, '#cc5c41');
    }
    btn.disabled = false;
    done = null;
  }

  chrome.runtime.onMessage.addListener((msg) => { if (msg.type === 'import-result') done?.(msg); });

  // Web chuyển trang không tải lại nên phải kiểm tra định kỳ để hiện/ẩn nút
  function syncButton() {
    const show = location.pathname.startsWith('/course-review') && document.querySelector(HEADER_SEL);
    const btn = document.getElementById(BTN_ID);
    if (!show) { btn?.remove(); return; }
    if (btn) return;
    const b = document.createElement('button');
    b.id = BTN_ID;
    b.type = 'button';
    b.textContent = BTN_LABEL;
    b.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483647;max-width:360px;padding:12px 18px;' +
      'background:#8c57ff;color:#fff;font:600 15px sans-serif;border:0;border-radius:8px;' +
      'box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer';
    b.addEventListener('click', () => onSend(b));
    document.body.appendChild(b);
  }
  syncButton();
  setInterval(syncButton, 1000);
})();
