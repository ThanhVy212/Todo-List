export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  timezone: string;
  settings: {
    weekStartsOn: 0 | 1;
    theme: "light" | "dark" | "system";
  };
  isDemo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  _id: string;
  userId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  scheduledDate: string; // ISO date string
  startAt: string | null;
  endAt: string | null;
  isAllDay: boolean;
  completedAt: string | null;
  tags: string[];
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  scheduledDateKey?: string;
  isOverdue?: boolean;
}

export interface DailyActivityItem {
  date: string; // YYYY-MM-DD
  count: number;
  level: number; // 0, 1, 2, 3, 4
  colorType?: "none" | "green" | "red" | "yellow";
  completedCount?: number;
  overdueCount?: number;
  todoCount?: number;
}

export interface ActivityStats {
  totalCompleted: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
}

export interface ActivityResponse {
  data: DailyActivityItem[];
  stats: ActivityStats;
}

export interface Project {
  _id: string;
  name: string;
  createdAt: string;
  taskCount: number;
}
