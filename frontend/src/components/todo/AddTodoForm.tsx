import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Tag } from "lucide-react";
import type { TaskPriority } from "@/lib/types";

interface AddTodoFormProps {
  onAdd: (taskData: {
    title: string;
    description: string;
    priority: TaskPriority;
    scheduledDate: string;
    startAt: string | null;
    endAt: string | null;
    isAllDay: boolean;
    tags: string[];
  }) => Promise<boolean>;
  selectedDate: string; // YYYY-MM-DD
  timezone?: string;
}

export const AddTodoForm: React.FC<AddTodoFormProps> = ({
  onAdd,
  selectedDate,
  timezone = "Asia/Ho_Chi_Minh",
}) => {
  const { t } = useTranslation();

  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  // Default to selectedDate if it's today or future, otherwise todayKey
  const initialDate = selectedDate < todayKey ? todayKey : selectedDate;
  const [scheduledDateInput, setScheduledDateInput] = useState(initialDate);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [dateError, setDateError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ title?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setScheduledDateInput(selectedDate < todayKey ? todayKey : selectedDate);
    }
  }, [selectedDate, todayKey, isOpen]);

  const isPastDateSelected = selectedDate < todayKey;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errors: { title?: string } = {};
    let dateErr = "";
    if (!title.trim()) {
      errors.title = t("errors.titleRequired");
    }
    if (scheduledDateInput < todayKey) {
      dateErr = t("todo.pastDateError");
    } else if (startAt && endAt && new Date(endAt) < new Date(startAt)) {
      dateErr = t("errors.invalidDate");
    }
    setDateError(dateErr);
    setFieldErrors(errors);
    if (errors.title || dateErr) return;

    setSubmitting(true);

    const success = await onAdd({
      title: title.trim(),
      description: description.trim(),
      priority,
      scheduledDate: scheduledDateInput,
      startAt: startAt ? new Date(startAt).toISOString() : null,
      endAt: endAt ? new Date(endAt).toISOString() : null,
      isAllDay,
      tags,
    });

    setSubmitting(false);

    if (success) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStartAt("");
      setEndAt("");
      setIsAllDay(false);
      setTags([]);
      setIsOpen(false);
    }
  };

  return (
    <div className="mb-6">
      {!isOpen ? (
        <button
          onClick={() => {
            setScheduledDateInput(selectedDate < todayKey ? todayKey : selectedDate);
            setIsOpen(true);
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 py-4 text-sm sm:text-base font-semibold text-primary transition-all hover:border-primary/60 hover:bg-primary/10 cursor-pointer shadow-sm"
        >
          <Plus className="h-5 w-5" />
          <span>
            {isPastDateSelected
              ? t("todo.addNew")
              : t("todo.addNew")}
          </span>
        </button>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-md animate-in fade-in zoom-in-95 duration-150">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("todo.title")} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) setFieldErrors({});
                }}
                placeholder={t("todo.titlePlaceholder")}
                className={`w-full rounded-xl border bg-background px-4 py-3 text-base sm:text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow ${
                  fieldErrors.title ? "border-destructive" : "border-input"
                }`}
              />
              {fieldErrors.title && (
                <p className="text-xs font-medium text-destructive mt-1">{fieldErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("todo.description")}
              </label>
              {/* Increased font size for description input */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("todo.descriptionPlaceholder")}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t("todo.scheduledDate")}
                </label>
                <input
                  type="date"
                  min={todayKey}
                  value={scheduledDateInput}
                  onChange={(e) => {
                    setScheduledDateInput(e.target.value);
                    if (e.target.value < todayKey) {
                      setDateError(t("todo.pastDateError"));
                    } else {
                      setDateError("");
                    }
                  }}
                  className={`w-full rounded-xl border bg-background px-3.5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer ${
                    dateError ? "border-destructive" : "border-input"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t("todo.priority")}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="low">{t("todo.priorityLow")}</option>
                  <option value="medium">{t("todo.priorityMedium")}</option>
                  <option value="high">{t("todo.priorityHigh")}</option>
                </select>
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  />
                  <span>{t("todo.allDay")}</span>
                </label>
              </div>
            </div>

            {!isAllDay && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {t("todo.startAt")}
                  </label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {t("todo.endAt")}
                  </label>
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  />
                </div>
              </div>
            )}

            {dateError && <p className="text-xs font-medium text-destructive">{dateError}</p>}

            {/* Tags Input */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Tags
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder={t("todo.tagPlaceholder")}
                  className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="rounded-xl border border-input bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  {t("todo.addTag")}
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-foreground ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>{submitting ? t("common.saving") : t("todo.addTitle")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setDateError("");
                  setFieldErrors({});
                }}
                className="rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddTodoForm;
