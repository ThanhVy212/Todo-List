import React from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Calendar,
  Clock,
  Tag,
  CheckCircle2,
  Trash2,
  Edit2,
  Flag,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import type { Task, TaskPriority } from "@/lib/types";

interface TaskDetailsModalProps {
  todo: (Task & { isOverdue?: boolean }) | null;
  onClose: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onEdit: (id: string) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  todo,
  onClose,
  onToggle,
  onDelete,
  onRestore,
  onPermanentDelete,
  onEdit,
}) => {
  const { t, i18n } = useTranslation();

  if (!todo) return null;

  const isCompleted = todo.status === "completed";
  const isOverdue =
    Boolean(todo.isOverdue) ||
    (!todo.isDeleted &&
      !isCompleted &&
      todo.endAt &&
      new Date(todo.endAt) < new Date());

  const formatDateTimeStr = (iso: string | null) => {
    if (!iso) return t("details.noTimeSet");
    const d = new Date(iso);
    return d.toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityLabel = (p: TaskPriority) => {
    switch (p) {
      case "high":
        return t("todo.priorityHigh");
      case "medium":
        return t("todo.priorityMedium");
      case "low":
      default:
        return t("todo.priorityLow");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Status & Priority Badge */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isCompleted
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : todo.isDeleted
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : isOverdue
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                : "bg-primary/10 text-primary border border-primary/20"
            }`}
          >
            {isOverdue && !isCompleted && !todo.isDeleted ? (
              <AlertTriangle className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {isCompleted
              ? t("todo.completed")
              : todo.isDeleted
              ? t("details.inTrash")
              : isOverdue
              ? t("todo.overdue")
              : t("todo.active")}
          </span>

          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
            <Flag className="h-3 w-3 text-muted-foreground" />
            {getPriorityLabel(todo.priority)}
          </span>
        </div>

        {/* Title */}
        <h3
          className={`text-xl font-bold tracking-tight text-foreground mb-3 ${
            isCompleted ? "line-through text-muted-foreground" : ""
          }`}
        >
          {todo.title}
        </h3>

        {/* Description */}
        <div className="mb-6 rounded-xl border border-border/60 bg-muted/20 p-3.5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {t("details.description")}
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {todo.description || (
              <span className="italic text-muted-foreground">
                {t("details.noDescription")}
              </span>
            )}
          </p>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              {t("todo.scheduledDate")}:{" "}
              <strong className="text-foreground">
                {todo.scheduledDateKey || (todo.scheduledDate ? new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(todo.scheduledDate)) : "")}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              {t("todo.startAt")}:{" "}
              <strong className="text-foreground">
                {formatDateTimeStr(todo.startAt)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              {t("todo.endAt")}:{" "}
              <strong className="text-foreground">
                {formatDateTimeStr(todo.endAt)}
              </strong>
            </span>
          </div>

          {todo.completedAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>
                {t("details.completedAt")}:{" "}
                <strong className="text-foreground">
                  {formatDateTimeStr(todo.completedAt)}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {todo.tags && todo.tags.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {todo.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-foreground"
                >
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2">
            {!todo.isDeleted ? (
              <>
                <button
                  onClick={() => onToggle(todo._id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    isCompleted
                      ? "border border-input bg-background text-foreground hover:bg-muted"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {isCompleted ? t("todo.reactivate") : t("todo.complete")}
                  </span>
                </button>

                <button
                  onClick={() => onEdit(todo._id)}
                  className="flex items-center gap-1.5 rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>{t("common.edit")}</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {onRestore && (
                  <button
                    onClick={() => {
                      onRestore(todo._id);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>{t("todo.restore")}</span>
                  </button>
                )}
                {onPermanentDelete && (
                  <button
                    onClick={() => {
                      onPermanentDelete(todo._id);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-destructive px-3.5 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{t("todo.permanentDelete")}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {!todo.isDeleted && (
            <button
              onClick={() => {
                onDelete(todo._id);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-background px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t("common.delete")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
