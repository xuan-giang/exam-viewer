# Extension gửi bài thi sang Exam Viewer

Thêm nút **"➜ Gửi sang Exam Viewer"** ở góc dưới bên phải trang review của cloudexam.pro (`/course-review`). Bấm nút, extension đọc bài thi (câu đánh dấu, đáp án đã chọn, đáp án đúng, giải thích) rồi nạp vào https://xuan-giang.github.io/exam-viewer/.

## Cài đặt (Chrome, Edge)

1. Mở `chrome://extensions`.
2. Bật **Developer mode** ở góc trên bên phải.
3. Bấm **Load unpacked**, chọn thư mục `extension` này.
4. Tải lại trang review đang mở.

Sau khi sửa code: bấm nút tải lại của extension trong `chrome://extensions`, rồi tải lại trang review.

## Các file

- `cloudexam.js`: hiện nút và đọc bài thi từ DOM của trang review.
- `background.js`: giữ bài đang chờ, mở hoặc chuyển sang tab Exam Viewer, báo kết quả về tab cloudexam.
- `viewer.js`: nạp bài vào Exam Viewer qua ô chọn file có sẵn của trang.

Extension không gửi dữ liệu đi đâu khác ngoài tab Exam Viewer. Nếu Exam Viewer đang có bài làm dở, extension báo lỗi chứ không nạp đè.

## Dữ liệu gửi kèm để nhận biết các lần làm

Mỗi câu có thêm `exam_key` (`cloudexam:<course>:<exam>`), `exam_name` và `attempt_id` lấy từ URL và tiêu đề trang review. Exam Viewer dùng các trường này để gom các lần làm của cùng một đề và sắp đúng thứ tự, kể cả khi gửi lượt cũ sau lượt mới.
