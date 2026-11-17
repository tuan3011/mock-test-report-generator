# TRÌNH TẠO BÁO CÁO SAU MOCK TEST (MOCK TEST REPORT GENERATOR)

Ứng dụng web chuyên nghiệp hỗ trợ giáo viên trung tâm Anh ngữ soạn thảo và xuất **Báo cáo sau kỳ thi Mock Test hàng tháng** theo đúng mẫu quy chuẩn Word (.docx).

Mục tiêu chính: **Tối thiểu hóa thao tác viết thủ công của giáo viên nhờ sự hỗ trợ của Google Gemini AI, đồng thời bảo toàn trọn vẹn quan sát thực tế, quyết định sư phạm và cấu trúc văn bản mẫu chính thức.**

---

## 1. TỔNG QUAN HỆ THỐNG & TÍNH NĂNG CHÍNH

- **Giao diện 100% tiếng Việt:** Trực quan, thân thiện, dễ sử dụng cho giáo viên không rành công nghệ.
- **Bảo toàn 100% Mẫu Word chính thức (`MẪU BÁO CÁO SAU MOCK TEST.docx`):** Giữ nguyên font Times New Roman 12pt, tiêu đề, định dạng bảng kẻ viền, lề trang và thứ tự 3 mục.
- **Bảng học viên co giãn tự động:** Tự động sinh hàng cho từng học viên, cho phép bảng mở rộng qua nhiều trang mà không bị cắt xén nội dung.
- **Quy trình Phê duyệt bắt buộc (Draft → Review → Approve):**
  - Trạng thái: `Chưa tạo (NOT_GENERATED)` → `Bản nháp (DRAFT)` → `Cần xem lại (NEEDS_REVIEW)` → `Đã duyệt (APPROVED)`.
  - Giáo viên kiểm soát 100% nội dung. Khi nội dung đã duyệt bị chỉnh sửa, hệ thống tự động yêu cầu duyệt lại.
  - Chặn xuất báo cáo DOCX nếu còn bất kỳ mục nào chưa được phê duyệt.
- **Thang điểm Mock Test 0–10:** Hỗ trợ nhập và hiển thị điểm số thập phân (ví dụ: `6.5`, `7.25`, `8.75`).
- **10 nhóm tiêu chí đánh giá chuẩn:** Với 5 mức độ đánh giá cụ thể (Rất tốt, Tốt, Khá ổn, Cần cải thiện, Chưa thể hiện được).
- **Gemini AI thông minh:**
  - Mục 1: Nhận xét quá trình học xưng "con", dựa trên tiêu chí được đánh giá, không tự bịa đặt kỹ năng hay thay đổi điểm số.
  - Mục 2: Tổng hợp trung thực các hành động giáo viên đã thực hiện và nêu rõ trường hợp chưa kịp trao đổi.
  - Mục 3: Đề xuất giải pháp phân theo đối tượng (học viên, lớp học, trung tâm).
- **Chuẩn hóa tên tệp tải về:** `{CLASS_NAME}_{TEACHER_NAME}_bao-cao-mock-test.docx` (ví dụ: `KIDS-05_Nguyen-Thi-Lan_bao-cao-mock-test.docx`).

---

## 2. CÔNG NGHỆ SỬ DỤNG

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4.
- **Xử lý tài liệu Word:** `docxtemplater`, `pizzip`.
- **Trí tuệ nhân tạo (AI):** Google Gemini API (`@google/genai` SDK - model `gemini-3.8-flash`).
- **Backend / API:** Vercel Serverless Functions (`api/generate-student-comment.ts`, `api/generate-support-summary.ts`, `api/generate-recommendations.ts`).
- **Icons & UI:** `lucide-react`.

---

## 3. CẤU TRÚC BÁO CÁO QUY CHUẨN

Tệp Word xuất ra gồm 3 phần chính:

1. **Thông tin chung:**
   - Tiêu đề: `BÁO CÁO SAU MOCK TEST THÁNG ...`
   - `Tên lớp: ...`
   - `Giáo viên phụ trách: ...`
   - `Kỹ năng phụ trách: ...`
2. **Mục 1 - Học viên cần quan tâm:**
   - Bảng 3 cột: `Họ tên` | `Điểm mock test (kỹ năng giáo viên phụ trách)` | `Nhận xét về quá trình học`.
   - Hỗ trợ thêm/xóa nhiều học viên độc lập.
3. **Mục 2 - Chia sẻ và nhìn nhận từ giáo viên về quá trình theo sát hỗ trợ lớp và những cách giải quyết mà giáo viên đã thực hiện:**
   - Trình bày mạch lạc những hành động giáo viên đã làm và những tồn đọng chưa giải quyết.
4. **Mục 3 - Giáo viên có đề xuất nào cho lớp và cách giải quyết học viên có vấn đề như thế nào không?:**
   - Đề xuất giải pháp cho học viên, lớp học và sự phối hợp từ trung tâm.

---

## 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY LOCAL

### Yêu cầu hệ thống:
- Node.js version 18 trở lên.
- Trình quản lý gói npm.

### Bước 1: Cài đặt thư viện
```bash
npm install
```

### Bước 2: Cấu hình biến môi trường
Tạo tệp `.env` (hoặc `.env.local`) từ `.env.example`:
```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Model Gemini sử dụng (Mặc định: gemini-3.8-flash)
GEMINI_MODEL=gemini-3.8-flash
```
> **Mẹo tiện lợi:** Bạn cũng có thể cấu hình API Key trực tiếp trong giao diện ứng dụng bằng cách nhấn nút **"API Key"** ở góc trên bên phải màn hình.

### Bước 3: Khởi chạy máy chủ phát triển
```bash
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:5173`

### Bước 4: Kiểm thử tự động
Chạy bộ kiểm thử toàn diện 41 kịch bản:
```bash
npx tsx scripts/test-workflow.js
```

### Bước 5: Đóng gói bản Production
```bash
npm run build
```

---

## 5. HƯỚNG DẪN TRIỂN KHAI LÊN VERCEL (DEPLOYMENT)

Ứng dụng được thiết kế tương thích hoàn toàn với nền tảng Vercel:

1. Đẩy mã nguồn lên kho lưu trữ GitHub của bạn:
   ```bash
   git init
   git add .
   git commit -m "feat: Mock Test Report Generator completed"
   git remote add origin <URL_REPO_CUA_BAN>
   git push -u origin main
   ```
2. Đăng nhập vào [Vercel Dashboard](https://vercel.com) và chọn **"Add New Project"**.
3. Chọn Repository vừa tạo trên GitHub.
4. Trong mục **Environment Variables**, thêm:
   - `GEMINI_API_KEY`: Khóa API Gemini của bạn.
   - `GEMINI_MODEL`: `gemini-3.8-flash` (tùy chọn).
5. Nhấn **Deploy**. Vercel sẽ tự động build ứng dụng và cung cấp URL production hoạt động trực tuyến.

---

## 6. QUY TRÌNH SỬ DỤNG 5 BƯỚC CHO GIÁO VIÊN

1. **Bước 1 - Thông tin báo cáo:** Nhập Tên lớp, Giáo viên phụ trách, chọn Kỹ năng phụ trách và Tháng báo cáo.
2. **Bước 2 - Học viên cần quan tâm:**
   - Nhấn **"+ Thêm học viên"**.
   - Nhập Họ tên và Điểm Mock Test (thang 0–10, ví dụ: 6.5, 7.25).
   - Đánh giá các tiêu chí theo 10 nhóm (chọn mức từ 1 đến 5).
   - Nhấn **"Tạo nhận xét AI"** → Gemini AI viết đoạn nhận xét xưng "con".
   - Giáo viên đọc, chỉnh sửa (nếu cần) và nhấn **"Duyệt nhận xét này"**.
3. **Bước 3 - Hoạt động hỗ trợ:**
   - Tích chọn các hành động giáo viên đã thực hiện trên lớp / với học viên.
   - Nhập thêm chi tiết thực tế (nếu có).
   - Nhấn **"Tạo nội dung AI"** → Chỉnh sửa → Nhấn **"Duyệt nội dung Mục 2"**.
4. **Bước 4 - Đề xuất giải pháp:**
   - Tích chọn các đề xuất cho học viên, lớp học và trung tâm.
   - Nhấn **"Tạo đề xuất AI"** → Chỉnh sửa → Nhấn **"Duyệt nội dung Mục 3"**.
5. **Bước 5 - Xem trước & Xuất Word:**
   - Kiểm tra bản xem trước văn bản định dạng chuẩn Word.
   - Hệ thống xác thực toàn bộ các mục đã được duyệt `APPROVED`.
   - Nhấn **"TẢI XUỐNG BÁO CÁO WORD (.DOCX)"** để nhận tệp báo cáo hoàn chỉnh.
