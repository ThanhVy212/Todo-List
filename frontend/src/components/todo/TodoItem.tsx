import { useState } from "react";
import { Trash2, Edit2, Check, X } from "lucide-react";
import type { Todo } from "@/lib/types";

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onUpdate: (title: string, description: string) => Promise<boolean>;
  isEditing: boolean;
  onEditCancel: () => void;
}

export default function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
  onUpdate,
  isEditing,
  onEditCancel,
}: TodoItemProps) {
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description);

  const handleSave = () => {
    onUpdate(editTitle, editDescription);
  };

  const statusColor = todo.completed
    ? "bg-green-100 border-green-200"
    : "bg-red-100 border-red-200";

  if (isEditing) {
    return (
      <div className={`rounded-lg border ${statusColor} p-4 transition-colors`}>
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Tiêu đề công việc"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Mô tả chi tiết (tùy chọn)"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium transition-colors hover:bg-primary/90"
            >
              <Check className="h-4 w-4" />
              Lưu
            </button>
            <button
              onClick={onEditCancel}
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4" />
              Hủy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border ${statusColor} p-4 transition-all hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            todo.completed
              ? "border-green-500 bg-green-500"
              : "border-foreground/20 bg-background hover:border-primary"
          }`}
        >
          {todo.completed && <Check className="h-4 w-4 text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-base font-semibold transition-colors ${
              todo.completed
                ? "line-through text-foreground/50"
                : "text-foreground"
            }`}
          >
            {todo.title}
          </h3>
          {todo.description && (
            <p
              className={`mt-1 text-sm transition-colors ${
                todo.completed
                  ? "line-through text-foreground/40"
                  : "text-foreground/60"
              }`}
            >
              {todo.description}
            </p>
          )}
          <p className="mt-2 text-xs text-foreground/40">
            {new Date(todo.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            -{" "}
            {new Date(todo.createdAt).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background text-foreground p-2 transition-colors hover:bg-muted"
            aria-label="Chỉnh sửa"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center justify-center rounded-md border border-destructive bg-background text-destructive p-2 transition-colors hover:bg-destructive/10"
            aria-label="Xóa"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
