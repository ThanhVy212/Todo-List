export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  projectId: string | null;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface Project {
  _id: string;
  name: string;
  createdAt: Date;
  taskCount: number;
}
