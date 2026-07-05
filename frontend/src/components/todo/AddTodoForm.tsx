import { useState } from "react";
import { Plus } from "lucide-react";

interface AddTodoFormProps {
  onAdd: (title: string, description: string) => Promise<boolean>;
}

export default function AddTodoForm({ onAdd }: AddTodoFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async () => {
    const success = await onAdd(title, description);
    if (success) {
      setTitle("");
      setDescription("");
      setIsOpen(false);
    }
  };

  return (
    <div className="mb-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 hover:border-primary/80 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm công việc mới
        </button>
      ) : (
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Tiêu đề <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề công việc"
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
                Mô tả (tùy chọn)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả chi tiết"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/90"
              >
                Thêm công việc
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setTitle("");
                  setDescription("");
                }}
                className="px-4 py-2 rounded-md border border-input text-foreground text-sm font-medium transition-colors hover:bg-muted"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
