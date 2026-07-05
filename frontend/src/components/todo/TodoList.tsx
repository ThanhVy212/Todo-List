import type { Todo } from "@/lib/types";
import TodoItem from "./TodoItem";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string | null) => void;
  onUpdate: (
    id: string,
    title: string,
    description: string,
  ) => Promise<boolean>;
  editingId: string | null;
}

export default function TodoList({
  todos,
  onToggle,
  onDelete,
  onEdit,
  onUpdate,
  editingId,
}: TodoListProps) {
  return (
    <div className="space-y-3 mt-6">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={() => onToggle(todo.id)}
          onDelete={() => onDelete(todo.id)}
          onEdit={() => onEdit(todo.id)}
          onUpdate={(title, description) =>
            onUpdate(todo.id, title, description)
          }
          isEditing={editingId === todo.id}
          onEditCancel={() => onEdit(null)}
        />
      ))}
    </div>
  );
}
