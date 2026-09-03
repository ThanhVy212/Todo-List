# 📋 TodoList App

> 🗓️ App lên lịch cho ngày của bạn với activity heatmap từng ngày

## ✨ Tính Năng

### 🔐 Xác Thực
- Đăng ký & đăng nhập bằng email/password
- Đăng nhập Google OAuth2
- Phiên bản JWT
- Chế độ Demo - dùng thử mà không cần đăng ký (tự xóa sau 2 giờ)

### 📝 Quản Lý Công Việc
- Tạo, cập nhật, xóa, khôi phục công việc
- Trạng thái: cần làm, đang làm, hoàn thành, hủy
- Mức độ ưu tiên: thấp, trung bình, cao
- Lịch công việc với date picker (không cho chọn ngày quá khứ)
- Công việc cả ngày hoặc có giờ bắt đầu/kết thúc
- Hỗ trợ gắn thẻ
- Tìm kiếm theo tiêu đề/mô tả
- Lọc theo khoảng ngày, trạng thái, ưu tiên
- Xóa mềm với thùng rác (tự xóa sau 3 ngày)
- Phát hiện quá hạn

### 📁 Dự Án
- Tạo, đổi tên, xóa dự án
- Gán công việc vào dự án
- Đếm số công việc mỗi dự án

### 📊 Theo Dõi Hoạt Động
- Biểu đồ nhiệt hoạt động hàng ngày
- Tự đồng bộ khi tạo/cập nhật/xóa công việc
- Theo dõi công việc tạo, hoàn thành, xóa theo ngày

### 🎨 Giao Diện
- Chế độ tối/sáng/tự động
- Đa ngôn ngữ (Tiếng Việt, English)
- Thiết kế Responsive
- Thông báo Toast (Sonner)
- Components Shadcn/ui

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router, Axios
- i18next (đa ngôn ngữ)
- Sonner (thông báo)

### Backend
- Node.js + Express 5
- MongoDB + Mongoose
- Xác thực JWT (bcryptjs, jsonwebtoken)
- Zod validation

## 📋 Yêu Cầu

- Node.js v18+
- MongoDB

## 🚀 Cài Đặt

```bash
git clone <repo-url>
cd TodoList
```

**Backend:**
```bash
cd backend
npm install
```

Tạo file `.env` trong `backend/`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/todolist
```

**Frontend:**
```bash
cd frontend
npm install
```

## ▶️ Chạy Ứng Dụng

```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

- Backend: `http://localhost:{PORT}`
- Frontend: `http://localhost:5173`

## 📁 Cấu Trúc Dự Án

```
TodoList/
├── backend/
│   └── src/
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── server.js
└── frontend/
    └── src/
        ├── components/
        ├── context/
        ├── hooks/
        ├── i18n/
        ├── pages/
        └── lib/
```