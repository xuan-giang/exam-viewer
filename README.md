# Exam Viewer

Web tĩnh xem lại và làm lại bài thi trắc nghiệm từ file JSON kết quả.

- Tải file `.json` lên (chỉ đọc trên trình duyệt, không gửi lên server)
- Xem từng câu: đáp án đã chọn, đáp án đúng, lọc đúng/sai, tìm kiếm, bấm số câu để nhảy tới câu
- Làm lại: tất cả / câu sai / câu đúng, 10 / 20 / tùy chỉnh số câu, thi thử hoặc luyện tập, đếm ngược thời gian, xáo trộn câu và đáp án
- Tự lưu bài đang làm và lịch sử làm bài vào localStorage

## Định dạng JSON

Mảng các câu hỏi (hoặc `{ "questions": [...] }`):

```json
[
  {
    "question_no": 1,
    "question": "…",
    "answers": { "A": "…", "B": "…", "C": "…", "D": "…" },
    "selected_answer": "B",
    "correct_answer": "B",
    "is_correct": true
  }
]
```

Câu nhiều đáp án ghi dạng `"B, E"`. `is_correct` / `result` có thể bỏ trống, web sẽ tự so sánh.

## Chạy local

Mở trực tiếp `index.html`, hoặc `python -m http.server`.
