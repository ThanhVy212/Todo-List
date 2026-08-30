import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Calendar, Clock, AlertTriangle, FolderKanban } from "lucide-react";
import type { Todo, Project } from "@/lib/types";

interface TaskDetailsModalProps {
  todo: Todo | null;
  projects: Project[];
  onClose: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

function formatDateTime(date: Date | null, locale: string): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TaskDetailsModal({
  todo,
  projects,
  onClose,
  onToggle,
  onDelete,
  onEdit,
}: TaskDetailsModalProps) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (todo) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [todo, onClose]);

  if (!todo) return null;

  const isOverdue =
    !todo.completed && todo.endAt && new Date(todo.endAt) < new Date();
  const projectName = todo.projectId
    ? projects.find((p) => p._id === todo.projectId)?.name || ""
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-bold text-foreground">
              {t("details.title")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-5">
          {/* Title & Status */}
          <div>
            <h3
              className={`text-xl font-semibold ${
                todo.completed
                  ? "line-through text-foreground/50"
                  : "text-foreground"
              }`}
            >
              {todo.title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  todo.completed
                    ? "bg-green-100 text-green-700"
                    : isOverdue
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {todo.completed
                  ? t("todo.completed")
                  : isOverdue
                    ? t("todo.overdue")
                    : t("todo.active")}
              </span>
              {isOverdue && (
                <span className="inline-flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {t("details.description")}
            </p>
            <p className="text-sm text-foreground">
              {todo.description || (
                <span className="italic text-muted-foreground">
                  {t("details.noDescription")}
                </span>
              )}
            </p>
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {t("details.startAt")}
              </p>
              <p className="text-sm text-foreground">
                {todo.startAt ? (
                  formatDateTime(todo.startAt, i18n.language)
                ) : (
                  <span className="italic text-muted-foreground">
                    {t("details.noTimeSet")}
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t("details.endAt")}
              </p>
              <p className="text-sm text-foreground">
                {todo.endAt ? (
                  formatDateTime(todo.endAt, i18n.language)
                ) : (
                  <span className="italic text-muted-foreground">
                    {t("details.noTimeSet")}
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t("details.createdAt")}
              </p>
              <p className="text-sm text-foreground">
                {formatDateTime(todo.createdAt, i18n.language)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t("details.completedAt")}
              </p>
              <p className="text-sm text-foreground">
                {todo.completedAt ? (
                  formatDateTime(todo.completedAt, i18n.language)
                ) : (
                  <span className="italic text-muted-foreground">
                    {t("details.notCompletedYet")}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Project */}
          {projectName && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <FolderKanban className="h-3 w-3" />
                {t("details.project")}
              </p>
              <p className="text-sm text-foreground">{projectName}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onToggle(todo.id)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                todo.completed
                  ? "border border-input bg-background hover:bg-muted"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {todo.completed ? t("todo.reactivate") : t("todo.complete")}
            </button>
            <button
              onClick={() => {
                onEdit(todo.id);
                onClose();
              }}
              className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              {t("todo.edit")}
            </button>
            <button
              onClick={() => {
                onDelete(todo.id);
                onClose();
              }}
              className="rounded-md border border-destructive bg-background px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              {t("todo.delete")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
