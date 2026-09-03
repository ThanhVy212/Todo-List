import React from "react";

export const TaskSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3.5 rounded-2xl border border-border/60 bg-card p-4 shadow-sm animate-pulse"
        >
          {/* Checkbox Skeleton */}
          <div className="mt-0.5 h-5 w-5 rounded-lg bg-muted/80 flex-shrink-0" />

          {/* Content Skeleton */}
          <div className="flex-1 space-y-2.5 min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="h-4 rounded-md bg-muted/80"
                style={{ width: `${Math.floor(Math.random() * 30 + 40)}%` }}
              />
              <div className="h-4 w-12 rounded-md bg-muted/60" />
            </div>

            <div
              className="h-3 rounded-md bg-muted/50"
              style={{ width: `${Math.floor(Math.random() * 20 + 60)}%` }}
            />

            <div className="flex items-center gap-3">
              <div className="h-3 w-20 rounded bg-muted/40" />
              <div className="h-3 w-14 rounded bg-muted/40" />
            </div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex gap-1.5 opacity-60">
            <div className="h-8 w-8 rounded-xl bg-muted/60" />
            <div className="h-8 w-8 rounded-xl bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskSkeleton;
