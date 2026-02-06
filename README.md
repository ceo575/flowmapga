<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1D612vU5J4OjRcIyC2F2MgRRF6opZYwsb

## Run Frontend Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Run DOCX Parser API

Backend parser được thêm tại `server/` để xử lý upload đề thi Toán `.docx` và trả về JSON cấu trúc.

1. Chạy API:
   `npm run start:api`
2. Health check:
   `GET http://localhost:3001/health`
3. Parse đề thi:
   `POST http://localhost:3001/api/exams/parse-docx` với multipart/form-data, field file là `file`.

### JSON output chính

- `totalQuestions`: tổng số câu parse được.
- `questions[].order`: thứ tự tự đánh lại từ 1..N.
- `questions[].question`: nội dung câu hỏi.
- `questions[].options[]`: danh sách phương án (có `isCorrect`).
- `questions[].correctAnswer`: nhãn đáp án đúng.
- `questions[].questionType`: `single_choice` hoặc `true_false`.
- `questions[].explanation`: lời giải chi tiết (nếu có).

### Quy tắc parser đang hỗ trợ

- Bắt đầu câu hỏi theo mẫu `Câu <số>`, bỏ số cũ và đánh lại.
- Phương án `A. B. C. D.` hoặc `a) b) c) d)` phải có prefix in đậm.
- Phương án được gạch chân sẽ được đánh dấu là đáp án đúng.
- `Lời giải.` hoặc `Lời giải:` sẽ mở phần explanation đến trước câu kế tiếp.
- Công thức Word OMML được giữ nguyên ở dạng XML `m:oMath`/`m:oMathPara` trong `questionParts` và `explanationParts` để frontend có thể hậu xử lý sang MathJax.
