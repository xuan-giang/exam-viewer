# Exam Viewer

Web tĩnh xem lại và làm lại bài thi trắc nghiệm từ file JSON kết quả.

- Tải file `.json` lên (chỉ đọc trên trình duyệt, không gửi lên server)
- Xem từng câu: đáp án đã chọn, đáp án đúng, lọc đúng/sai, tìm kiếm, bấm số câu để nhảy tới câu
- Làm lại: tất cả / câu sai / câu đúng, 10 / 20 / tùy chỉnh số câu, thi thử hoặc luyện tập, đếm ngược thời gian, xáo trộn câu và đáp án
- Đánh dấu câu **đã chữa**, lọc câu chưa chữa/đã chữa, làm lại riêng các câu sai chưa chữa
- Tự lưu bài đang làm, câu đã chữa và lịch sử các lượt làm lại vào localStorage (theo từng đề)
- **Export** toàn bộ dữ liệu ra file JSON để import lại trên máy khác

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

## File export

Cùng định dạng với file đề (import lại được), thêm dữ liệu ôn tập:

```json
{
  "app": "exam-viewer", "version": 1, "exported_at": "…", "source_file": "…",
  "questions": [
    { "question_no": 2, "…các trường gốc…": "…",
      "reviewed": true, "reviewed_at": "2026-09-29T03:24:47.997Z",
      "retry_stats": { "times": 3, "correct": 2 } }
  ],
  "attempts": [
    { "id": "…", "started_at": "…", "finished_at": "…", "mode": "exam", "duration_sec": 1200,
      "timeout": false, "settings": { "…": "…" }, "score": { "correct": 4, "total": 10 },
      "answers": [ { "question_no": 14, "option_order": "A, B, D, C", "selected_answer": "D",
                     "correct_answer": "D", "is_correct": true } ] }
  ]
}
```

Import file export vào trình duyệt đã có dữ liệu của cùng đề thì hai bên được gộp (câu đã chữa gộp lại, lượt làm không bị trùng).

## Chạy local

Mở trực tiếp `index.html`, hoặc `python -m http.server`.
