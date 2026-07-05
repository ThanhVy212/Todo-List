# 📋 TodoList Application

Ứng dụng Todo full-stack với frontend React và backend Express.js với MongoDB.

## 🚀 Công Nghệ Sử Dụng

### Frontend

- **React 19** - Thư viện UI
- **TypeScript** - Kiểm tra kiểu dữ liệu
- **Vite** - Build tool và dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Router** - Điều hướng
- **Axios** - HTTP client

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM cho MongoDB
- **CORS** - Cross-origin resource sharing

## 📋 Yêu Cầu Trước Khi Cài Đặt

Trước khi chạy dự án, đảm bảo bạn đã cài đặt:

- **Node.js** (v18 hoặc cao hơn) - [Tải tại đây](https://nodejs.org/)
- **MongoDB** - [Tải tại đây](https://www.mongodb.com/try/download/community)
- **npm** (đi kèm với Node.js) hoặc **yarn**

## 🛠️ Cài Đặt

### 1. Clone repository

```bash
git clone <your-repository-url>
cd TodoList
```

### 2. Cài đặt Backend

Di chuyển vào thư mục backend:

```bash
cd backend
```

Cài đặt dependencies:

```bash
npm install
```

Tạo file `.env` trong thư mục `backend` với các biến sau:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/todolist
```

### 3. Cài đặt Frontend

Di chuyển vào thư mục frontend:

```bash
cd ../frontend
```

Cài đặt dependencies:

```bash
npm install
```

## 🏃 Chạy Ứng Dụng

### Khởi động Backend

Trong thư mục `backend`:

```bash
npm run dev
```

Backend server sẽ chạy tại `http://localhost:PORT`
setup PORT trong file `.env` của backend

### Khởi động Frontend

Trong thư mục `frontend` (mở terminal mới):

```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173`

## 📁 Cấu Trúc Dự Án

```
TodoList/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── libs/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   ├── index.html
│   └── package.json
└── README.md
```

## 🔧 Các Lệnh Có Sẵn

### Backend

- `npm run dev` - Khởi động server với nodemon (development)
- `npm start` - Khởi động server (production)
- `npm test` - Chạy tests

### Frontend

- `npm run dev` - Khởi động development server
- `npm run build` - Build cho production
- `npm run lint` - Chạy linter
- `npm run preview` - Xem trước production build

## 🌐 API Endpoints

Backend API cung cấp các endpoints sau:

- `GET /api/todos` - Lấy tất cả todos
- `POST /api/todos` - Tạo todo mới
- `PUT /api/todos/:id` - Cập nhật todo
- `DELETE /api/todos/:id` - Xóa todo

## 🐛 Xử Lý Lỗi

### Lỗi Kết Nối MongoDB

- Đảm bảo MongoDB đang chạy trên máy của bạn
- Kiểm tra `MONGODB_URI` trong file `.env`
- Xác nhận MongoDB đang lắng nghe trên port mặc định (27017)

### Port Đã Được Sử Dụng

- Thay đổi `PORT` trong file `.env` của backend
- Hoặc dừng process đang sử dụng port đó

### Lỗi Build Frontend

- Xóa `node_modules` và `package-lock.json`
- Chạy `npm install` lại
