import React from "react";
import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal, Trash2, AlertCircle } from "lucide-react";
import type { TaskPriority, TaskStatus } from "@/lib/types";

interface TodoFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: "all" | TaskStatus | "trash";
  onStatusFilterChange: (status: "all" | TaskStatus | "trash") => void;
  priorityFilter: "all" | TaskPriority;
  onPriorityFilterChange: (priority: "all" | TaskPriority) => void;
  todoCount: number;
  onEmptyTrash?: () => void;
}

export const TodoFilters: React.FC<TodoFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  todoCount,
  onEmptyTrash,
}) => {
  const { t } = useTranslation();

  return (
    <div className="mb-6 space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("filters.search")}
          className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
        />
      </div>

      {/* Filter Tabs & Priority Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-border/50 text-xs font-semibold">
          <button
            onClick={() => onStatusFilterChange("all")}
            className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("filters.all")}
          </button>

          <button
            onClick={() => onStatusFilterChange("todo")}
            className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              statusFilter === "todo"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("filters.todo")}
          </button>

          <button
            onClick={() => onStatusFilterChange("in_progress")}
            className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              statusFilter === "in_progress"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("filters.active")}
          </button>

          <button
            onClick={() => onStatusFilterChange("completed")}
            className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              statusFilter === "completed"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("filters.completed")}
          </button>

          <button
            onClick={() => onStatusFilterChange("trash")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              statusFilter === "trash"
                ? "bg-destructive/10 text-destructive shadow-sm"
                : "text-muted-foreground hover:text-destructive"
            }`}
          >
            <Trash2 className="h-3 w-3" />
            <span>{t("filters.trash")}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority filter */}
          <div className="flex items-center gap-1 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value as "all" | TaskPriority)}
              className="rounded-xl border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="all">{t("filters.allPriorities")}</option>
              <option value="high">{t("filters.highPriority")}</option>
              <option value="medium">{t("filters.mediumPriority")}</option>
              <option value="low">{t("filters.lowPriority")}</option>
            </select>
          </div>

          <div className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1.5 rounded-xl">
            {todoCount} {t("filters.tasks")}
          </div>
        </div>
      </div>

      {/* Warning banner and Empty Trash button when viewing trash */}
      {statusFilter === "trash" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{t("todo.trashWarning")}</span>
          </div>

          {todoCount > 0 && onEmptyTrash && (
            <button
              onClick={onEmptyTrash}
              className="flex items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer ml-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t("todo.emptyTrash")}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TodoFilters;
