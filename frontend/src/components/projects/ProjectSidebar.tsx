import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  ListTodo,
} from "lucide-react";
import type { Project } from "@/lib/types";

interface ProjectSidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onAddProject: (name: string) => Promise<boolean>;
  onUpdateProject: (id: string, name: string) => Promise<boolean>;
  onDeleteProject: (id: string) => Promise<boolean>;
  loading: boolean;
}

export default function ProjectSidebar({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  loading,
}: ProjectSidebarProps) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const success = await onAddProject(newName.trim());
    if (success) {
      setNewName("");
      setIsAdding(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    const success = await onUpdateProject(id, editName.trim());
    if (success) {
      setEditingId(null);
      setEditName("");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("project.deleteConfirm"))) return;
    await onDeleteProject(id);
  };

  const totalTasks = projects.reduce((sum, p) => sum + p.taskCount, 0);

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            {t("project.title")}
          </h2>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            aria-label={t("project.addNew")}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {isAdding && (
          <div className="mb-3 rounded-md border border-border bg-background p-2 space-y-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("project.namePlaceholder")}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewName("");
                }
              }}
              autoFocus
            />
            <div className="flex gap-1">
              <button
                onClick={handleAdd}
                className="flex-1 rounded-md bg-primary text-primary-foreground px-2 py-1 text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                {t("common.save")}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewName("");
                }}
                className="flex-1 rounded-md border border-input px-2 py-1 text-xs font-medium hover:bg-muted transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}

        <nav className="space-y-1">
          <button
            onClick={() => onSelectProject(null)}
            className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              selectedProjectId === null
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <ListTodo className="h-4 w-4" />
            <span className="flex-1 text-left">{t("project.allTasks")}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                selectedProjectId === null
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {totalTasks}
            </span>
          </button>

          {loading && projects.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              {t("common.loading")}
            </p>
          )}

          {!loading && projects.length === 0 && !isAdding && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">
                {t("project.noProjects")}
              </p>
              <button
                onClick={() => setIsAdding(true)}
                className="text-xs text-primary hover:underline"
              >
                {t("project.createFirst")}
              </button>
            </div>
          )}

          {projects.map((project) => (
            <div key={project._id} className="group">
              {editingId === project._id ? (
                <div className="rounded-md border border-border bg-background p-2 space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(project._id);
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditName("");
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleUpdate(project._id)}
                      className="flex-1 rounded-md bg-primary text-primary-foreground px-2 py-1 text-xs font-medium hover:bg-primary/90 transition-colors"
                    >
                      {t("common.save")}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditName("");
                      }}
                      className="flex-1 rounded-md border border-input px-2 py-1 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onSelectProject(project._id)}
                  className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors group/project ${
                    selectedProjectId === project._id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <FolderKanban className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">
                    {project.name}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      selectedProjectId === project._id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {project.taskCount}
                  </span>
                  <div
                    className={`flex gap-0.5 flex-shrink-0 ${
                      selectedProjectId === project._id
                        ? "opacity-100"
                        : "opacity-0 group-hover/project:opacity-100"
                    } transition-opacity`}
                  >
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(project._id);
                        setEditName(project.name);
                      }}
                      className="inline-flex items-center justify-center rounded p-0.5 hover:bg-primary-foreground/20 cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project._id);
                      }}
                      className="inline-flex items-center justify-center rounded p-0.5 hover:bg-destructive/20 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </span>
                  </div>
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
