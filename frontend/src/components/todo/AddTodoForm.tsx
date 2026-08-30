import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { Project } from "@/lib/types";

interface AddTodoFormProps {
  onAdd: (
    title: string,
    description: string,
    startAt: string | null,
    endAt: string | null,
    projectId: string | null,
  ) => Promise<boolean>;
  projects: Project[];
  selectedProjectId: string | null;
}

export default function AddTodoForm({
  onAdd,
  projects,
  selectedProjectId,
}: AddTodoFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [projectId, setProjectId] = useState<string | null>(selectedProjectId);
  const [isOpen, setIsOpen] = useState(false);
  const [dateError, setDateError] = useState("");

  const handleSubmit = async () => {
    if (startAt && endAt && new Date(endAt) < new Date(startAt)) {
      setDateError(t("errors.invalidDate"));
      return;
    }
    setDateError("");
    const success = await onAdd(
      title,
      description,
      startAt || null,
      endAt || null,
      projectId,
    );
    if (success) {
      setTitle("");
      setDescription("");
      setStartAt("");
      setEndAt("");
      setProjectId(selectedProjectId);
      setIsOpen(false);
    }
  };

  return (
    <div className="mb-6">
      {!isOpen ? (
        <button
          onClick={() => {
            setIsOpen(true);
            setProjectId(selectedProjectId);
          }}
          className="w-full rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 hover:border-primary/80 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("todo.addNew")}
        </button>
      ) : (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t("todo.title")} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("todo.titlePlaceholder")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    handleSubmit();
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t("todo.description")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("todo.descriptionPlaceholder")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("todo.startAt")}
                </label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => {
                    setStartAt(e.target.value);
                    setDateError("");
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("todo.endAt")}
                </label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => {
                    setEndAt(e.target.value);
                    setDateError("");
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {dateError && (
                  <p className="mt-1 text-xs text-destructive">{dateError}</p>
                )}
              </div>
            </div>

            {projects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("details.project")}
                </label>
                <select
                  value={projectId || ""}
                  onChange={(e) => setProjectId(e.target.value || null)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t("details.noProject")}</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/90"
              >
                {t("todo.addTitle")}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setTitle("");
                  setDescription("");
                  setStartAt("");
                  setEndAt("");
                  setDateError("");
                }}
                className="px-4 py-2 rounded-md border border-input text-foreground text-sm font-medium transition-colors hover:bg-muted"
              >
                {t("todo.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
