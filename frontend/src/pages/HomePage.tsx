import { useState, useEffect } from "react";
import TodoList from "@/components/todo/TodoList";
import AddTodoForm from "@/components/todo/AddTodoForm";
import TodoFilters from "@/components/todo/TodoFilters";
import type { Todo } from "@/lib/types";
import api from "@/lib/axios";
import { toast } from "sonner";

const HomePage = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Debounce search query to limit API requests
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

  // Fetch todos from backend
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
        },
      });

      const { data, pagination } = response.data;

      const mappedTodos: Todo[] = data.map((item: any) => ({
        id: item._id,
        title: item.title,
        description: item.description || "",
        completed: item.status === "complete",
        createdAt: new Date(item.createdAt),
      }));

      setTodos(mappedTodos);
      setTotalPages(pagination.totalPages || 1);
      setTotalCount(pagination.total || 0);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Không thể tải danh sách công việc",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [currentPage, statusFilter, debouncedSearchQuery, itemsPerPage]);

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
  ): Promise<boolean> => {
    try {
      await api.post("/tasks", {
        title,
        description,
      });
      toast.success("Thêm công việc thành công");
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
          "Không thể thêm công việc",
      );
      return false;
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const response = await api.delete(`/tasks/${id}`);
      toast.success(response.data?.message || "Xóa công việc thành công");
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
          "Không thể xóa công việc",
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
          ? "Đã hoàn thành công việc"
          : "Đã mở lại công việc",
      );
      fetchTodos();
    } catch (error: any) {
      console.error("Error toggling task:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Không thể cập nhật trạng thái",
      );
    }
  };

  const updateTodo = async (
    id: string,
    title: string,
    description: string,
  ): Promise<boolean> => {
    try {
      await api.put(`/tasks/${id}`, {
        title,
        description,
      });
      toast.success("Cập nhật công việc thành công");
      setEditingId(null);
      fetchTodos();
      return true;
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Không thể cập nhật công việc",
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

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="page-title mb-2">Danh Sách Công Việc</h1>
          <p className="text-muted-foreground">
            Quản lý công việc của bạn một cách hiệu quả
          </p>
        </div>

        {/* Add Todo Form */}
        <AddTodoForm onAdd={addTodo} />

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
              Đang tải danh sách...
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
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Trang <span className="font-semibold">{currentPage}</span> /{" "}
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
                    Trước
                  </button>

                  {/* Page Numbers */}
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
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-12 rounded-lg border border-dashed border-border bg-muted/50 py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "Không tìm thấy công việc nào phù hợp"
                : "Chưa có công việc nào. Hãy thêm công việc mới!"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default HomePage;
