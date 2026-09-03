import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { DailyActivityHeatmap } from "@/components/heatmap/DailyActivityHeatmap";
import { DatePickerNav } from "@/components/todo/DatePickerNav";
import { AddTodoForm } from "@/components/todo/AddTodoForm";
import { TodoList } from "@/components/todo/TodoList";
import { TodoFilters } from "@/components/todo/TodoFilters";
import { TaskDetailsModal } from "@/components/todo/TaskDetailsModal";
import { TaskSkeleton } from "@/components/todo/TaskSkeleton";
import { AuthModal } from "@/components/auth/AuthModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import api from "@/lib/axios";
import type { Task, DailyActivityItem, ActivityStats, TaskPriority, TaskStatus } from "@/lib/types";
import { toast } from "@/components/ui/toast";
import { LogIn, LogOut, Sparkles, AlertTriangle } from "lucide-react";

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, token, logout, demoLogin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const userTimezone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh";
  const getTodayKey = () =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: userTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

  const todayKey = getTodayKey();
  const selectedDate = searchParams.get("date") || todayKey;
  const isPastDate = selectedDate < todayKey;

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const handleDateChange = (newDate: string) => {
    setSearchParams({ date: newDate });
  };

  // State
  const [tasks, setTasks] = useState<(Task & { isOverdue?: boolean })[]>([]);
  const [activities, setActivities] = useState<DailyActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    totalCompleted: 0,
    activeDays: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  const activitiesAbortRef = useRef<AbortController | null>(null);
  const tasksAbortRef = useRef<AbortController | null>(null);

  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus | "trash">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // AlertDialog confirm states
  const [permanentDeleteTargetId, setPermanentDeleteTargetId] = useState<string | null>(null);
  const [isEmptyTrashConfirmOpen, setIsEmptyTrashConfirmOpen] = useState(false);

  // Fetch Activities for Heatmap (by selected year)
  const fetchActivities = useCallback(async () => {
    if (!token) return;
    activitiesAbortRef.current?.abort();
    const controller = new AbortController();
    activitiesAbortRef.current = controller;
    setLoadingActivities(true);
    try {
      const res = await api.get("/activities", {
        params: { year: selectedYear },
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        setActivities(res.data.data);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err: any) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        console.error("fetchActivities error:", err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingActivities(false);
      }
    }
  }, [token, selectedYear]);

  // Fetch Tasks for the selected date
  const fetchTasks = useCallback(async () => {
    if (!token) return;
    tasksAbortRef.current?.abort();
    const controller = new AbortController();
    tasksAbortRef.current = controller;
    setLoadingTasks(true);
    try {
      const params: Record<string, any> = {
        date: statusFilter === "trash" ? undefined : selectedDate,
        includeDeleted: statusFilter === "trash" ? "true" : "false",
      };

      if (statusFilter !== "all" && statusFilter !== "trash") {
        params.status = statusFilter;
      }

      if (priorityFilter !== "all") {
        params.priority = priorityFilter;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.get("/tasks", { params, signal: controller.signal });
      if (!controller.signal.aborted) {
        setTasks(res.data.data);
      }
    } catch (err: any) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        console.error("fetchTasks error:", err);
        toast.add({ title: err.response?.data?.message || t("errors.fetchTasks"), type: "error" });
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingTasks(false);
      }
    }
  }, [token, selectedDate, statusFilter, priorityFilter, searchQuery, t]);

  useEffect(() => {
    if (token) {
      fetchActivities();
    } else {
      setActivities([]);
    }
  }, [token, selectedYear, fetchActivities]);

  useEffect(() => {
    if (token) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [token, selectedDate, statusFilter, priorityFilter, searchQuery, fetchTasks]);

  // Create task
  const handleAddTask = async (taskData: {
    title: string;
    description: string;
    priority: TaskPriority;
    scheduledDate: string;
    startAt: string | null;
    endAt: string | null;
    isAllDay: boolean;
    tags: string[];
  }): Promise<boolean> => {
    if (!token) {
      setIsAuthModalOpen(true);
      return false;
    }

    try {
      await api.post("/tasks", taskData);
      toast.add({ title: t("success.taskCreated"), type: "success" });
      fetchTasks();
      fetchActivities();
      return true;
    } catch (err: any) {
      console.error("handleAddTask error:", err);
      toast.add({ title: err.response?.data?.message || t("errors.createTask"), type: "error" });
      return false;
    }
  };

  // Toggle complete / uncomplete with optimistic UI update
  const handleToggleTask = async (id: string) => {
    const task = tasks.find((t) => t._id === id);
    if (!task) return;

    const isCurrentlyCompleted = task.status === "completed";
    const newStatus: TaskStatus = isCurrentlyCompleted ? "todo" : "completed";

    const previousTasks = [...tasks];
    setTasks(
      tasks.map((t) =>
        t._id === id
          ? {
              ...t,
              status: newStatus,
              completedAt: isCurrentlyCompleted ? null : new Date().toISOString(),
            }
          : t
      )
    );

    try {
      const endpoint = isCurrentlyCompleted ? `/tasks/${id}/uncomplete` : `/tasks/${id}/complete`;
      await api.post(endpoint);
      toast.add({
        title: isCurrentlyCompleted ? t("success.taskReactivated") : t("success.taskCompleted"),
        type: "success",
      });
      fetchActivities();
    } catch (err: any) {
      setTasks(previousTasks);
      toast.add({ title: err.response?.data?.message || t("errors.updateTask"), type: "error" });
    }
  };

  // Update task
  const handleUpdateTask = async (id: string, updates: Partial<Task>): Promise<boolean> => {
    try {
      await api.put(`/tasks/${id}`, updates);
      toast.add({ title: t("success.taskUpdated"), type: "success" });
      setEditingId(null);
      fetchTasks();
      fetchActivities();
      return true;
    } catch (err: any) {
      toast.add({ title: err.response?.data?.message || t("errors.updateTask"), type: "error" });
      return false;
    }
  };

  // Soft delete task
  const handleDeleteTask = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      toast.add({ title: t("success.taskDeleted"), type: "success" });
      fetchTasks();
      fetchActivities();
    } catch (err: any) {
      toast.add({ title: err.response?.data?.message || t("errors.deleteTask"), type: "error" });
    }
  };

  // Restore task
  const handleRestoreTask = async (id: string) => {
    try {
      await api.post(`/tasks/${id}/restore`);
      toast.add({ title: t("todo.restoreSuccess"), type: "success" });
      fetchTasks();
      fetchActivities();
    } catch (err: any) {
      toast.add({ title: err.response?.data?.message || t("errors.updateTask"), type: "error" });
    }
  };

  // Confirm and permanently delete single task
  const confirmPermanentDelete = async () => {
    if (!permanentDeleteTargetId) return;
    try {
      await api.delete(`/tasks/${permanentDeleteTargetId}/permanent`);
      toast.add({ title: t("success.permanentDeleted"), type: "success" });
      setPermanentDeleteTargetId(null);
      fetchTasks();
    } catch (err: any) {
      toast.add({ title: err.response?.data?.message || t("errors.permanentDelete"), type: "error" });
    }
  };

  // Confirm and empty all trash
  const confirmEmptyTrash = async () => {
    try {
      await api.delete("/tasks/trash/empty");
      toast.add({ title: t("success.trashEmptied"), type: "success" });
      setIsEmptyTrashConfirmOpen(false);
      fetchTasks();
    } catch (err: any) {
      toast.add({ title: err.response?.data?.message || t("errors.emptyTrash"), type: "error" });
    }
  };

  const selectedTask = tasks.find((t) => t._id === selectedTaskId) || null;

  return (
    <main className="min-h-screen bg-background pt-6 pb-28 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <span>{t("app.title")}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {t("app.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <LanguageSelector />

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-foreground">{user.fullName}</div>
                  <div className="text-[10px] text-muted-foreground">{user.email}</div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title={t("app.logout")}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("app.logout")}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{t("app.loginRegister")}</span>
                </button>
                <button
                  onClick={demoLogin}
                  className="hidden sm:flex items-center gap-1 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-2.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t("app.demo")}</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Demo Account Warning Banner */}
        {user?.isDemo && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{t("app.demoWarning")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("app.demoWarningSignUp")}</p>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{t("app.loginRegister")}</span>
            </button>
          </div>
        )}

        {/* Not Logged In Banner */}
        {!user && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center shadow-sm">
            <h2 className="text-lg font-bold text-foreground">{t("app.welcomeTitle")}</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              {t("app.welcomeDesc")}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-sm"
              >
                <LogIn className="h-4 w-4" />
                <span>{t("app.loginRegister")}</span>
              </button>
              <button
                onClick={demoLogin}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>{t("app.tryDemo")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Daily Activity Heatmap Component */}
        {user && (
          <DailyActivityHeatmap
            activities={activities}
            stats={stats}
            loading={loadingActivities}
            onDateClick={handleDateChange}
            onRefresh={() => {
              fetchActivities();
              fetchTasks();
            }}
            selectedDate={selectedDate}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
        )}

        {/* Daily Todo Section */}
        <section className="space-y-4">
          {/* Date Navigation (Hidden in Trash mode) */}
          {statusFilter !== "trash" && (
            <DatePickerNav
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              timezone={userTimezone}
            />
          )}

          {/* Add Todo Form (Hidden when viewing Past Dates or in Trash mode) */}
          {statusFilter !== "trash" && !isPastDate && (
            <AddTodoForm
              onAdd={handleAddTask}
              selectedDate={selectedDate}
              timezone={userTimezone}
            />
          )}

          {/* Filters */}
          <TodoFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            todoCount={tasks.length}
            onEmptyTrash={() => setIsEmptyTrashConfirmOpen(true)}
          />

          {/* Task List with TaskSkeleton during loading */}
          {loadingTasks && tasks.length === 0 ? (
            <TaskSkeleton />
          ) : (
            <TodoList
              todos={tasks}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onRestore={handleRestoreTask}
              onPermanentDelete={(id) => setPermanentDeleteTargetId(id)}
              onEdit={setEditingId}
              onUpdate={handleUpdateTask}
              editingId={editingId}
              onViewDetails={setSelectedTaskId}
              isTrashView={statusFilter === "trash"}
            />
          )}
        </section>
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        todo={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onToggle={handleToggleTask}
        onDelete={handleDeleteTask}
        onRestore={handleRestoreTask}
        onPermanentDelete={(id) => {
          setSelectedTaskId(null);
          setPermanentDeleteTargetId(id);
        }}
        onEdit={(id) => {
          setEditingId(id);
          setSelectedTaskId(null);
        }}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Shadcn AlertDialog for Permanent Delete Single Task */}
      <ConfirmDialog
        open={Boolean(permanentDeleteTargetId)}
        onOpenChange={(open) => !open && setPermanentDeleteTargetId(null)}
        title={t("todo.permanentDeleteTitle")}
        description={t("todo.permanentDeleteConfirm")}
        confirmText={t("todo.permanentDelete")}
        cancelText={t("common.cancel")}
        onConfirm={confirmPermanentDelete}
        variant="destructive"
      />

      {/* Shadcn AlertDialog for Empty Trash */}
      <ConfirmDialog
        open={isEmptyTrashConfirmOpen}
        onOpenChange={setIsEmptyTrashConfirmOpen}
        title={t("todo.emptyTrashTitle")}
        description={t("todo.emptyTrashConfirm")}
        confirmText={t("todo.emptyTrash")}
        cancelText={t("common.cancel")}
        onConfirm={confirmEmptyTrash}
        variant="destructive"
      />
    </main>
  );
};

export default HomePage;
