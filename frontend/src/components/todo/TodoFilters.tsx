import { Search } from "lucide-react";

interface TodoFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: "all" | "active" | "completed";
  onStatusFilterChange: (status: "all" | "active" | "completed") => void;
  todoCount: number;
  itemsPerPage: number;
  onItemsPerPageChange: (limit: number) => void;
}

export default function TodoFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  todoCount,
  itemsPerPage,
  onItemsPerPageChange,
}: TodoFiltersProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Search Field */}
      <div className="search-field">
        <Search className="search-icon" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm công việc..."
          className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Status Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex gap-2">
          {[
            { value: "all" as const, label: "Tất cả" },
            { value: "active" as const, label: "Đang làm" },
            { value: "completed" as const, label: "Đã hoàn thành" },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => onStatusFilterChange(filter.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="text-sm text-muted-foreground flex items-center ml-auto gap-4">
          <div className="flex items-center gap-1.5">
            <span>Hiển thị:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div>
            <span className="font-medium text-foreground">{todoCount}</span>
            <span className="ml-1">công việc</span>
          </div>
        </div>
      </div>
    </div>
  );
}
