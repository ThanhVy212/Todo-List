English | [Tiếng Việt](./README.vi.md)

# 📋 TodoList App

> 🗓️ A daily planner app with activity heatmap

## ✨ Features

### 🔐 Authentication
- Register & login with email/password
- Google OAuth2 login
- JWT-based session
- Demo mode - try the app without signing up (auto-cleanup after 2 hours)

### 📝 Task Management
- Create, update, delete, restore tasks
- Statuses: todo, in progress, completed, cancelled
- Priority levels: low, medium, high
- Schedule tasks with date picker (past dates blocked)
- All-day tasks or timed tasks (start/end time)
- Tags support
- Search by title/description
- Filter by date range, status, priority
- Soft delete with trash (auto-purge after 3 days)
- Overdue detection

### 📁 Projects
- Create, rename, delete projects
- Assign tasks to projects
- Task count per project

### 📊 Activity Tracking
- Daily activity heatmap (GitHub-style contribution graph)
- Auto-sync on task create/update/delete
- Track created, completed, deleted tasks per day

### 🎨 UI/UX
- Dark/light/system theme toggle
- Multilingual (Vietnamese, English)
- Responsive design
- Toast notifications (Sonner)
- Shadcn/ui components

## 🛠️ Tech Stack

### Frontend
- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router, Axios
- i18next (multilingual)
- Sonner (notifications)

### Backend
- Node.js + Express 5
- MongoDB + Mongoose
- JWT authentication (bcryptjs, jsonwebtoken)
- Zod validation

## 📋 Prerequisites

- Node.js v18+
- MongoDB

## 🚀 Setup

```bash
git clone <repo-url>
cd TodoList
```

**Backend:**
```bash
cd backend
npm install
```

Create `.env` in `backend/`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/todolist
```

**Frontend:**
```bash
cd frontend
npm install
```

## ▶️ Run

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

## 📁 Project Structure