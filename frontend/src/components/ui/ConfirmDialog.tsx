import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "destructive" | "default";
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  variant = "destructive",
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border border-border bg-card p-6 shadow-2xl text-card-foreground max-w-md w-[calc(100%-2rem)]">
        <AlertDialogHeader className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${
                variant === "destructive"
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-primary/10 text-primary border border-primary/20"
              }`}
            >
              {variant === "destructive" ? (
                <Trash2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <AlertDialogTitle className="text-lg font-bold tracking-tight text-foreground">
              {title}
            </AlertDialogTitle>
          </div>

          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pl-13">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-5 flex flex-row items-center justify-end gap-2.5 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-input bg-background px-4 py-2 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-sm ${
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {confirmText}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
