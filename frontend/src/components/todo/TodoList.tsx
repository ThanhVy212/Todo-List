import React from "react";
import { useTranslation } from "react-i18next";
import { TodoItem } from "./TodoItem";
import type { Task } from "@/lib/types";

interface TodoListProps {
  todos: (Task & { isOverdue?: boolean })[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onEdit: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<boolean>;
  editingId: string | null;
  onViewDetails: (id: string) => void;
  isTrashView?: boolean;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onToggle,
  onDelete,
  onRestore,
  onPermanentDelete,
  onEdit,
  onUpdate,
  editingId,
  onViewDetails,
  isTrashView,
}) => {
  const { t } = useTranslation();

  if (todos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {isTrashView ? t("empty.emptyTrash") : t("empty.noTasks")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <TodoItem
          key={todo._id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
          onEdit={onEdit}
          onUpdate={onUpdate}
          isEditing={editingId === todo._id}
          onEditCancel={() => onEdit("")}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};

export default TodoList;
