import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import TodoList from "@/components/todo/TodoList";
import AddTodoForm from "@/components/todo/AddTodoForm";
import TodoFilters from "@/components/todo/TodoFilters";
import ProjectSidebar from "@/components/projects/ProjectSidebar";
import TaskDetailsModal from "@/components/todo/TaskDetailsModal";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import type { Todo, Project } from "@/lib/types";
import api from "@/lib/axios";
import { toast } from "sonner";

const HomePage = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const response = await api.get("/projects");
      setProjects(response.data.data);
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          t("errors.fetchProjects"),
      );
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      let status: "active" | "complete" | undefined = undefined;
      if (statusFilter === "active") status = "active";
      else if (statusFilter === "completed") status = "complete";

      const response = await api.get("/tasks", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          status,
          search: debouncedSearchQuery || undefined,
          projectId: selectedProjectId || undefined,
        },
      });

      const { data, pagination } = response.data;

      const mappedTodos: Todo[] = data.map((item: any) => ({
        id: item._id,
        title: item.title,
        description: item.description || "",
        completed: item.status === "complete",
        projectId: item.projectId || null,
        startAt: item.startAt ? new Date(item.startAt) : null,
        endAt: item.endAt ? new Date(item.endAt) : null,
        createdAt: new Date(item.createdAt),
        completedAt: item.completedAt ? new Date(item.completedAt) : null,
      }));

      setTodos(mappedTodos);
      setTotalPages(pagination.totalPages || 1);
      setTotalCount(pagination.total || 0);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          t("errors.fetchTasks"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [currentPage, statusFilter, debouncedSearchQuery, itemsPerPage, selectedProjectId]);

  const handleFilterChange = (newFilter: "all" | "active" | "completed") => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const addTodo = async (
    title: string,
    description: string,
    startAt: string | null,
    endAt: string | null,
    projectId: string | null,
  ): Promise<boolean> => {
    try {
      await api.post("/tasks", {
        title,
        description,
        startAt,
        endAt,
        projectId,
      });
      toast.success(t("success.taskCreated"));
      fetchProjects();
      if (currentPage === 1) {
        fetchTodos();
      } else {
        setCurrentPage(1);
      }
      return true;
    } catch (error: any) {
      console.error("Error adding task:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          t("errors.createTask"),
      );
      return false;
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const response = await api.delete(`/tasks/${id}`);
      toast.success(response.data?.message || t("success.taskDeleted"));
      fetchProjects();
      if (todos.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchTodos();
      }
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          t("errors.deleteTask"),
      );
    }
  };

  const toggleTodo = async (id: string) => {
    const todoToToggle = todos.find((todo) => todo.id === id);
    if (!todoToToggle) return;

    const newStatus = todoToToggle.completed ? "active" : "complete";

    try {
      await api.put(`/tasks/${id}`, {
        status: newStatus,
      });
      toast.success(
        newStatus === "complete"
          ? t("success.taskCompleted")
          : t("success.taskReactivated"),
      );
      fetchTodos();
    } catch (error: any) {
      console.error("Error toggling task:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          t("errors.updateTask"),
      );
    }
  };

  const updateTodo = async (
    id: string,
    title: string,
    description: string,
    startAt: string | null,
    endAt: string | null,
  ): Promise<boolean> => {
    try {
      await api.put(`/tasks/${id}`, {
        title,
        description,
        startAt,
        endAt,
      });
      toast.success(t("success.taskUpdated"));
      setEditingId(null);
      fetchTodos();
      return true;
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          t("errors.updateTask"),
      );
      return false;
    }
  };

  const addProject = async (name: string): Promise<boolean> => {
    try {
      await api.post("/projects", { name });
      toast.success(t("success.projectCreated"));
      fetchProjects();
      return true;
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          t("errors.createProject"),
      );
      return false;
    }
  };

  const updateProject = async (id: string, name: string): Promise<boolean> => {
    try {
      await api.put(`/projects/${id}`, { name });
      toast.success(t("success.projectUpdated"));
      fetchProjects();
      return true;
    } catch (error: any) {
      console.error("Error updating project:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          t("errors.updateProject"),
      );
      return false;
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/projects/${id}`);
      toast.success(t("success.projectDeleted"));
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
      }
      fetchProjects();
      return true;
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          t("errors.deleteProject"),
      );
      return false;
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);

    if (startPage <= 3) {
      startPage = 2;
    }
    if (endPage >= totalPages - 2) {
      endPage = totalPages - 1;
    }

    const pages: (number | string)[] = [];

    pages.push(1);

    if (startPage > 2) {
      pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  const selectedTodo = todos.find((todo) => todo.id === selectedTodoId) || null;
  const selectedProjectName = selectedProjectId
    ? projects.find((p) => p._id === selectedProjectId)?.name || ""
    : "";

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="page-title mb-2">{t("app.title")}</h1>
            <p className="text-muted-foreground">{t("app.subtitle")}</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <LanguageSelector />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <ProjectSidebar
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              setCurrentPage(1);
            }}
            onAddProject={addProject}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            loading={projectsLoading}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {selectedProjectId && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedProjectName}
                </h2>
              </div>
            )}

            {/* Add Todo Form */}
            <AddTodoForm
              onAdd={addTodo}
              projects={projects}
              selectedProjectId={selectedProjectId}
            />

            {/* Filters and Search */}
            <TodoFilters
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              statusFilter={statusFilter}
              onStatusFilterChange={handleFilterChange}
              todoCount={totalCount}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                setCurrentPage(1);
              }}
            />

            {/* Todo List */}
            {loading && todos.length === 0 ? (
              <div className="mt-12 flex flex-col items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {t("common.loading")}
                </p>
              </div>
            ) : todos.length > 0 ? (
              <div
                className={
                  loading
                    ? "opacity-50 pointer-events-none transition-opacity"
                    : "transition-opacity"
                }
              >
                <TodoList
                  todos={todos}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onEdit={setEditingId}
                  onUpdate={updateTodo}
                  editingId={editingId}
                  onViewDetails={setSelectedTodoId}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {t("pagination.page")}{" "}
                      <span className="font-semibold">{currentPage}</span>{" "}
                      {t("pagination.of")}{" "}
                      <span className="font-semibold">{totalPages}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                      >
                        {t("pagination.prev")}
                      </button>

                      <div className="flex gap-1">
                        {getPageNumbers().map((page, idx) => {
                          if (page === "...") {
                            return (
                              <span
                                key={`ellipsis-${idx}`}
                                className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground select-none"
                              >
                                ...
                              </span>
                            );
                          }

                          return (
                            <button
                              key={`page-${page}`}
                              onClick={() => setCurrentPage(page as number)}
                              className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? "bg-primary text-primary-foreground"
                                  : "border border-input bg-background hover:bg-muted"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                      >
                        {t("pagination.next")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-12 rounded-lg border border-dashed border-border bg-muted/50 py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? t("empty.noTasksFiltered")
                    : t("empty.noTasks")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        todo={selectedTodo}
        projects={projects}
        onClose={() => setSelectedTodoId(null)}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
        onEdit={(id) => {
          setEditingId(id);
          setSelectedTodoId(null);
        }}
      />
    </main>
  );
};

export default HomePage;
