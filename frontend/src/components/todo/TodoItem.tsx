import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Edit2, Check, X, AlertTriangle } from "lucide-react";
import type { Todo } from "@/lib/types";
import { formatDateTime, toDateTimeLocal, datetimeLocalToISO } from "@/lib/dateUtils";

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onUpdate: (
    title: string,
    description: string,
    startAt: string | null,
    endAt: string | null,
  ) => Promise<boolean>;
  isEditing: boolean;
  onEditCancel: () => void;
  onViewDetails: () => void;
}

export default function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
  onUpdate,
  isEditing,
  onEditCancel,
  onViewDetails,
}: TodoItemProps) {
  const { t, i18n } = useTranslation();
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description);
  const [editStartAt, setEditStartAt] = useState(toDateTimeLocal(todo.startAt));
  const [editEndAt, setEditEndAt] = useState(toDateTimeLocal(todo.endAt));
  const [dateError, setDateError] = useState("");

  const isOverdue =
    !todo.completed && todo.endAt && new Date(todo.endAt) < new Date();

  const handleSave = () => {
    if (editStartAt && editEndAt && new Date(editEndAt) < new Date(editStartAt)) {
      setDateError(t("errors.invalidDate"));
      return;
    }
    setDateError("");
    onUpdate(
      editTitle,
      editDescription,
      datetimeLocalToISO(editStartAt),
      datetimeLocalToISO(editEndAt),
    );
  };

  const statusColor = todo.completed
    ? "bg-green-100 border-green-200 dark:bg-green-950 dark:border-green-800"
    : isOverdue
      ? "bg-red-100 border-red-200 dark:bg-red-950 dark:border-red-800"
      : "bg-card border-border";

  if (isEditing) {
    return (
      <div className={`rounded-lg border ${statusColor} p-4 transition-colors`}>
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder={t("todo.titlePlaceholder")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder={t("todo.descriptionPlaceholder")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t("todo.startAt")}
              </label>
              <input
                type="datetime-local"
                value={editStartAt}
                onChange={(e) => {
                  setEditStartAt(e.target.value);
                  setDateError("");
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t("todo.endAt")}
              </label>
              <input
                type="datetime-local"
                value={editEndAt}
                onChange={(e) => {
                  setEditEndAt(e.target.value);
                  setDateError("");
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {dateError && (
                <p className="mt-1 text-xs text-destructive">{dateError}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium transition-colors hover:bg-primary/90"
            >
              <Check className="h-4 w-4" />
              {t("todo.save")}
            </button>
            <button
              onClick={onEditCancel}
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4" />
              {t("todo.cancel")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border ${statusColor} p-4 transition-all hover:shadow-md cursor-pointer`}
      onClick={onViewDetails}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
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
          <div className="flex items-center gap-2">
            <h3
              className={`text-base font-semibold transition-colors ${
                todo.completed
                  ? "line-through text-foreground/50"
                  : "text-foreground"
              }`}
            >
              {todo.title}
            </h3>
            {isOverdue && (
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
          </div>
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
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-foreground/40">
            <span>
              {formatDateTime(todo.createdAt, i18n.language)}
            </span>
            {todo.startAt && (
              <span className="text-blue-500">
                {t("todo.startAt")}: {formatDateTime(todo.startAt, i18n.language)}
              </span>
            )}
            {todo.endAt && (
              <span className={isOverdue ? "text-red-500" : "text-blue-500"}>
                {t("todo.endAt")}: {formatDateTime(todo.endAt, i18n.language)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex gap-2 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background text-foreground p-2 transition-colors hover:bg-muted"
            aria-label={t("todo.edit")}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center justify-center rounded-md border border-destructive bg-background text-destructive p-2 transition-colors hover:bg-destructive/10"
            aria-label={t("todo.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
