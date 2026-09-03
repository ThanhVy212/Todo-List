import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  Tag,
  AlertCircle,
  RotateCcw,
  Flag,
  AlertTriangle,
} from "lucide-react";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";

interface TodoItemProps {
  todo: Task & { isOverdue?: boolean };
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onEdit: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<boolean>;
  isEditing: boolean;
  onEditCancel: () => void;
  onViewDetails: (id: string) => void;
}

function toLocalDatetime(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onRestore,
  onPermanentDelete,
  onEdit,
  onUpdate,
  isEditing,
  onEditCancel,
  onViewDetails,
}) => {
  const { t, i18n } = useTranslation();

  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description);
  const [editPriority, setEditPriority] = useState<TaskPriority>(todo.priority);
  const [editStatus, setEditStatus] = useState<TaskStatus>(todo.status);
  const [editStartAt, setEditStartAt] = useState(toLocalDatetime(todo.startAt));
  const [editEndAt, setEditEndAt] = useState(toLocalDatetime(todo.endAt));
  const [dateError, setDateError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ title?: string }>({});

  const isCompleted = todo.status === "completed";
  const isOverdue =
    Boolean(todo.isOverdue) ||
    (!todo.isDeleted &&
      !isCompleted &&
      todo.endAt &&
      new Date(todo.endAt) < new Date());

  const handleSave = async () => {
    const errors: { title?: string } = {};
    if (!editTitle.trim()) {
      errors.title = t("errors.titleRequired");
    }
    let dateErr = "";
    if (editStartAt && editEndAt && new Date(editEndAt) < new Date(editStartAt)) {
      dateErr = t("errors.invalidDate");
    }
    setDateError(dateErr);
    setFieldErrors(errors);
    if (errors.title || dateErr) return;

    await onUpdate(todo._id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      status: editStatus,
      startAt: editStartAt ? new Date(editStartAt).toISOString() : null,
      endAt: editEndAt ? new Date(editEndAt).toISOString() : null,
    });
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Flag className="h-3 w-3 fill-current" />
            {t("todo.priorityHigh")}
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Flag className="h-3 w-3 fill-current" />
            {t("todo.priorityMedium")}
          </span>
        );
      case "low":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-500/10 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Flag className="h-3 w-3" />
            {t("todo.priorityLow")}
          </span>
        );
    }
  };

  const formatTimeRange = () => {
    if (todo.isAllDay) {
      return (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" /> {t("todo.allDay")}
        </span>
      );
    }
    if (!todo.startAt && !todo.endAt) return null;

    const formatT = (iso: string) => {
      const d = new Date(iso);
      return d.toLocaleTimeString(i18n.language === "vi" ? "vi-VN" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <span className={`flex items-center gap-1 text-[11px] ${isOverdue ? "text-rose-500 font-medium" : "text-muted-foreground"}`}>
        <Clock className="h-3 w-3" />
        {todo.startAt ? formatT(todo.startAt) : ""}
        {todo.startAt && todo.endAt ? " - " : ""}
        {todo.endAt ? formatT(todo.endAt) : ""}
      </span>
    );
  };

  if (isEditing) {
    return (
      <div className="rounded-2xl border border-primary/40 bg-card p-5 shadow-sm space-y-3.5">
        <div>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => {
              setEditTitle(e.target.value);
              if (fieldErrors.title) setFieldErrors({});
            }}
            placeholder={t("todo.titlePlaceholder")}
            className={`w-full rounded-xl border bg-background px-4 py-2.5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary ${
              fieldErrors.title ? "border-destructive" : "border-input"
            }`}
          />
          {fieldErrors.title && (
            <p className="text-xs font-medium text-destructive mt-1">{fieldErrors.title}</p>
          )}
        </div>
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder={t("todo.descriptionPlaceholder")}
          className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={2}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              {t("todo.priority")}
            </label>
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
              className="w-full rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">{t("todo.priorityLow")}</option>
              <option value="medium">{t("todo.priorityMedium")}</option>
              <option value="high">{t("todo.priorityHigh")}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              {t("todo.status")}
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
              className="w-full rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="todo">{t("todo.pending")}</option>
              <option value="in_progress">{t("todo.active")}</option>
              <option value="completed">{t("todo.completed")}</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              {t("todo.startAt")}
            </label>
            <input
              type="datetime-local"
              value={editStartAt}
              onChange={(e) => setEditStartAt(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              {t("todo.endAt")}
            </label>
            <input
              type="datetime-local"
              value={editEndAt}
              onChange={(e) => setEditEndAt(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {dateError && <p className="text-xs text-destructive">{dateError}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Check className="h-4 w-4" />
            {t("common.save")}
          </button>
          <button
            onClick={onEditCancel}
            className="flex items-center gap-1.5 rounded-xl border border-input bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
            {t("common.cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onViewDetails(todo._id)}
      className={`group relative flex items-start gap-3.5 rounded-2xl border p-4 transition-all hover:shadow-md cursor-pointer ${
        isCompleted
          ? "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20"
          : todo.isDeleted
          ? "border-destructive/30 bg-destructive/5 opacity-75"
          : isOverdue
          ? "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/15"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      {/* Checkbox button */}
      {!todo.isDeleted ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(todo._id);
          }}
          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
            isCompleted
              ? "border-emerald-600 bg-emerald-600 text-white"
              : isOverdue
              ? "border-rose-400 bg-background hover:border-rose-600"
              : "border-muted-foreground/40 bg-background hover:border-primary"
          }`}
          title={isCompleted ? t("todo.reactivate") : t("todo.complete")}
        >
          {isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
        </button>
      ) : (
        <AlertCircle className="mt-0.5 h-5 w-5 text-destructive flex-shrink-0" />
      )}

      {/* Main Task Information */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h4
            className={`text-sm sm:text-base font-semibold tracking-tight transition-all ${
              isCompleted
                ? "line-through text-muted-foreground/60"
                : todo.isDeleted
                ? "line-through text-destructive"
                : "text-foreground"
            }`}
          >
            {todo.title}
          </h4>

          {getPriorityBadge(todo.priority)}

          {isOverdue && !isCompleted && !todo.isDeleted && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
              <AlertTriangle className="h-3 w-3" />
              {t("todo.overdue")}
            </span>
          )}

          {todo.status === "in_progress" && !isOverdue && (
            <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400 border border-sky-500/20">
              {t("todo.active")}
            </span>
          )}
        </div>

        {todo.description && (
          <p
            className={`text-xs sm:text-sm mb-2 line-clamp-2 ${
              isCompleted ? "text-muted-foreground/50" : "text-muted-foreground"
            }`}
          >
            {todo.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {formatTimeRange()}

          {todo.tags && todo.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {todo.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 rounded-md bg-muted/70 px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {!todo.isDeleted ? (
          <>
            <button
              onClick={() => onEdit(todo._id)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title={t("common.edit")}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(todo._id)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-destructive/30 bg-background text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              title={t("common.delete")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            {onRestore && (
              <button
                onClick={() => onRestore(todo._id)}
                className="flex items-center gap-1 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                title={t("todo.restore")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t("todo.restore")}</span>
              </button>
            )}
            {onPermanentDelete && (
              <button
                onClick={() => onPermanentDelete(todo._id)}
                className="flex items-center gap-1 rounded-xl border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                title={t("todo.permanentDelete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{t("todo.permanentDelete")}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoItem;
