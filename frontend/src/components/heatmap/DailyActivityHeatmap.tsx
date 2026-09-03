import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Flame, Trophy, CheckCircle2, Calendar, RefreshCw } from "lucide-react";
import type { DailyActivityItem, ActivityStats } from "@/lib/types";

interface DailyActivityHeatmapProps {
  activities: DailyActivityItem[];
  stats: ActivityStats;
  loading: boolean;
  onDateClick?: (dateKey: string) => void;
  onRefresh?: () => void;
  selectedDate?: string;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
}

export const DailyActivityHeatmap: React.FC<DailyActivityHeatmapProps> = ({
  activities,
  stats,
  loading,
  onDateClick,
  onRefresh,
  selectedDate,
  selectedYear,
  onYearChange,
}) => {
  const { t, i18n } = useTranslation();
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    item: DailyActivityItem;
    x: number;
    y: number;
  } | null>(null);

  const currentYear = new Date().getFullYear();
  const activeYear = selectedYear || currentYear;

  // Dynamic 3 most recent years
  const availableYears = useMemo(() => {
    return [currentYear, currentYear - 1, currentYear - 2];
  }, [currentYear]);

  // Compute total tasks completed in the selected year
  const totalYearCompleted = useMemo(() => {
    return activities.reduce((acc, curr) => acc + (curr.completedCount || curr.count || 0), 0);
  }, [activities]);

  // Total all tasks (completed + overdue + todo) in the selected year
  const totalYearTasks = useMemo(() => {
    return activities.reduce(
      (acc, curr) =>
        acc +
        (curr.completedCount || 0) +
        (curr.overdueCount || 0) +
        (curr.todoCount || 0),
      0
    );
  }, [activities]);

  // Format full calendar year (52-53 weeks) from Jan 1 to Dec 31
  const { weeks, monthLabels } = useMemo(() => {
    if (!activities || activities.length === 0) {
      return { weeks: [], monthLabels: [] };
    }

    const activityMap = new Map<string, DailyActivityItem>();
    activities.forEach((act) => activityMap.set(act.date, act));

    const weeksArr: (DailyActivityItem | null)[][] = [];
    let currentWeek: (DailyActivityItem | null)[] = [];

    // Jan 1 of selected year
    const startDate = new Date(Date.UTC(activeYear, 0, 1));
    // Dec 31 of selected year
    const endDate = new Date(Date.UTC(activeYear, 11, 31));

    const startDayOfWeek = startDate.getUTCDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    const monthLabelsArr: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;

    const currDate = new Date(startDate);
    while (currDate <= endDate) {
      const dateKey = currDate.toISOString().slice(0, 10);
      const month = currDate.getUTCMonth();
      const colIdx = weeksArr.length;

      if (month !== lastMonth) {
        lastMonth = month;
        const monthName = currDate.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
        monthLabelsArr.push({ label: monthName, colIndex: colIdx });
      }

      const existingAct = activityMap.get(dateKey) || {
        date: dateKey,
        count: 0,
        level: 0,
        colorType: "none",
        completedCount: 0,
        overdueCount: 0,
        todoCount: 0,
      };

      currentWeek.push(existingAct);

      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }

      currDate.setUTCDate(currDate.getUTCDate() + 1);
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeksArr.push(currentWeek);
    }

    return { weeks: weeksArr, monthLabels: monthLabelsArr };
  }, [activities, activeYear]);

  // Determine cell color with priority: Green > Red > Yellow
  const getCellClass = (item: DailyActivityItem, isSelected: boolean) => {
    let base = "";
    const colorType = item.colorType || (item.count > 0 ? "green" : "none");

    if (colorType === "red") {
      base = "bg-rose-500/85 dark:bg-rose-600 border-rose-600 dark:border-rose-400";
    } else if (colorType === "yellow") {
      base = "bg-amber-300 dark:bg-amber-500 border-amber-400 dark:border-amber-400";
    } else if (colorType === "green") {
      switch (item.level) {
        case 1:
          base = "bg-emerald-300/90 dark:bg-emerald-950 border-emerald-400 dark:border-emerald-800";
          break;
        case 2:
          base = "bg-emerald-400 dark:bg-emerald-700 border-emerald-500 dark:border-emerald-600";
          break;
        case 3:
          base = "bg-emerald-500 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-400";
          break;
        case 4:
        default:
          base = "bg-emerald-700 dark:bg-emerald-400 border-emerald-800 dark:border-emerald-300";
          break;
      }
    } else {
      base = "bg-muted/40 dark:bg-muted/20 border-border/40 hover:border-border";
    }

    if (isSelected) {
      base += " outline outline-2 outline-primary outline-offset-1 z-10";
    }

    return base;
  };

  const formatDateTooltip = (dateStr: string, item: DailyActivityItem) => {
    const d = new Date(`${dateStr}T00:00:00`);
    const dateFormatted = d.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      weekday: "short",
    });

    const completed = item.completedCount || 0;
    const overdue = item.overdueCount || 0;
    const todo = item.todoCount || 0;
    const total = completed + overdue + todo;

    if (total === 0) {
      return i18n.language === "vi"
        ? `0 task - Không có hoạt động vào ${dateFormatted}`
        : `0 tasks - No activity on ${dateFormatted}`;
    }

    const details: string[] = [];
    if (completed > 0) {
      details.push(
        i18n.language === "vi"
          ? `${completed} hoàn thành`
          : `${completed} completed`
      );
    }
    if (overdue > 0) {
      details.push(
        i18n.language === "vi"
          ? `${overdue} quá hạn`
          : `${overdue} overdue`
      );
    }
    if (todo > 0) {
      details.push(
        i18n.language === "vi"
          ? `${todo} cần làm`
          : `${todo} to-do`
      );
    }

    const taskLabel = i18n.language === "vi" ? "task" : total > 1 ? "tasks" : "task";
    return `${total} ${taskLabel} (${details.join(", ")}) - ${dateFormatted}`;
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col gap-5">
        {/* Stats Header Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-foreground">
                {stats.currentStreak} <span className="text-xs font-normal text-muted-foreground">{t("heatmap.days")}</span>
              </div>
              <div className="text-xs text-muted-foreground">{t("heatmap.currentStreak")}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-foreground">
                {stats.longestStreak} <span className="text-xs font-normal text-muted-foreground">{t("heatmap.days")}</span>
              </div>
              <div className="text-xs text-muted-foreground">{t("heatmap.longestStreak")}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-foreground">
                {stats.totalCompleted}
              </div>
              <div className="text-xs text-muted-foreground">{t("heatmap.totalCompleted")}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-foreground">
                {stats.activeDays}
              </div>
              <div className="text-xs text-muted-foreground">{t("heatmap.activeDays")}</div>
            </div>
          </div>
        </div>

        {/* Main Daily Activity Heatmap Box with Year Selector on the right */}
        <div className="flex flex-col lg:flex-row items-start gap-4">
          {/* Heatmap Area */}
          <div className="flex-1 w-full rounded-xl border border-border/80 bg-background/40 p-4 shadow-sm">
            {/* Top Title: Daily Activity Heatmap & Year Summary */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>{t("heatmap.dailyActivityTitle", "Daily Activity Heatmap")}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalYearCompleted} {t("heatmap.tasksCompletedIn")} {activeYear} (
                  {totalYearTasks} {t("heatmap.totalYearTasks", "tổng số task")})
                </p>
              </div>

              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title={t("heatmap.refresh")}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>{t("common.refresh")}</span>
                </button>
              )}
            </div>

            {loading && activities.length === 0 ? (
              <div className="flex h-36 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="overflow-x-auto pb-2 scrollbar-thin">
                <div className="inline-block min-w-full">
                  {/* Month labels (Jan -> Dec) */}
                  <div className="relative flex text-[10px] text-muted-foreground h-5 mb-1 pl-8 select-none">
                    {monthLabels.map((m, idx) => (
                      <div
                        key={idx}
                        className="absolute"
                        style={{ left: `${m.colIndex * 13 + 32}px` }}
                      >
                        {m.label}
                      </div>
                    ))}
                  </div>

                  {/* Grid: Day labels on left + 52 Week columns */}
                  <div className="flex gap-1 h-[95px]">
                    {/* Day labels (Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6) */}
                    <div className="flex flex-col justify-between text-[9px] text-muted-foreground pr-2 h-[92px] select-none font-medium">
                      <span className="h-2.5"></span>
                      <span className="h-2.5 leading-none">Mon</span>
                      <span className="h-2.5"></span>
                      <span className="h-2.5 leading-none">Wed</span>
                      <span className="h-2.5"></span>
                      <span className="h-2.5 leading-none">Fri</span>
                      <span className="h-2.5"></span>
                    </div>

                    {/* Week Columns */}
                    <div className="flex gap-[3px]">
                      {weeks.map((week, wIdx) => (
                        <div key={wIdx} className="flex flex-col gap-[3px]">
                          {week.map((day, dIdx) => {
                            if (!day) {
                              return (
                                <div
                                key={`empty-${dIdx}`}
                                className="h-2.5 w-2.5 rounded-[2px] opacity-0 pointer-events-none"
                              />
                            );
                          }

                          const isSelected = selectedDate === day.date;
                          return (
                            <div
                              key={day.date}
                              onClick={() => onDateClick && onDateClick(day.date)}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredDay({
                                  date: day.date,
                                  item: day,
                                  x: rect.left + rect.width / 2,
                                  y: rect.top,
                                });
                              }}
                              onMouseLeave={() => setHoveredDay(null)}
                              aria-label={formatDateTooltip(day.date, day)}
                              role="button"
                              tabIndex={0}
                              className={`h-2.5 w-2.5 rounded-[2px] border transition-colors cursor-pointer ${getCellClass(
                                day,
                                isSelected
                              )}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Bar: Color legend showing completed (green), overdue (red), todo (yellow) */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pt-3 border-t border-border/40">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500 border border-emerald-600 inline-block" />
                      <span>{t("todo.completed")}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-[2px] bg-rose-500 border border-rose-600 inline-block" />
                      <span>{t("todo.overdue")}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-[2px] bg-amber-300 border border-amber-400 inline-block" />
                      <span>{t("todo.pending")}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">{t("heatmap.less")}</span>
                    <div className="h-2.5 w-2.5 rounded-[2px] border bg-muted/40 border-border/40" />
                    <div className="h-2.5 w-2.5 rounded-[2px] border bg-emerald-300 dark:bg-emerald-950 border-emerald-400" />
                    <div className="h-2.5 w-2.5 rounded-[2px] border bg-emerald-400 dark:bg-emerald-700 border-emerald-500" />
                    <div className="h-2.5 w-2.5 rounded-[2px] border bg-emerald-500 dark:bg-emerald-500 border-emerald-600" />
                    <div className="h-2.5 w-2.5 rounded-[2px] border bg-emerald-700 dark:bg-emerald-400 border-emerald-800" />
                    <span className="text-[10px]">{t("heatmap.more")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic 3 Recent Years Selector */}
        <div className="flex lg:flex-col gap-1.5 w-full lg:w-28 flex-shrink-0">
          {availableYears.map((yr) => (
            <button
              key={yr}
              onClick={() => onYearChange && onYearChange(yr)}
              className={`w-full rounded-xl px-3 py-2 text-xs font-semibold text-center transition-all cursor-pointer ${
                activeYear === yr
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Detached Portal Tooltip completely outside the card DOM hierarchy to avoid any layout shifts */}
    {hoveredDay &&
      typeof document !== "undefined" &&
      createPortal(
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 rounded-lg bg-popover/95 backdrop-blur-sm px-3.5 py-2 text-xs text-popover-foreground shadow-lg border border-border animate-in fade-in zoom-in-95 duration-75"
          style={{
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y - 8}px`,
          }}
        >
          <div className="font-semibold">{formatDateTooltip(hoveredDay.date, hoveredDay.item)}</div>
        </div>,
        document.body
      )}
  </>
  );
};

export default DailyActivityHeatmap;
