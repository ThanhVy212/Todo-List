import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

interface DatePickerNavProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  timezone?: string;
}

export const DatePickerNav: React.FC<DatePickerNavProps> = ({
  selectedDate,
  onDateChange,
  timezone = "Asia/Ho_Chi_Minh",
}) => {
  const { t, i18n } = useTranslation();

  // Compute today's dateKey
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const isToday = selectedDate === todayKey;

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    dateObj.setUTCDate(dateObj.getUTCDate() - 1);
    onDateChange(dateObj.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    dateObj.setUTCDate(dateObj.getUTCDate() + 1);
    onDateChange(dateObj.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    onDateChange(todayKey);
  };

  // Format date display
  const dateObj = new Date(`${selectedDate}T00:00:00`);
  const formattedDay = dateObj.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-3.5 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevDay}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-background text-foreground hover:bg-muted transition-colors cursor-pointer"
          title={t("todo.prevDay", "Ngày trước")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={handleNextDay}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-background text-foreground hover:bg-muted transition-colors cursor-pointer"
          title={t("todo.nextDay", "Ngày sau")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {!isToday && (
          <button
            onClick={handleToday}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t("todo.today", "Hôm nay")}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-semibold text-foreground capitalize">
            {isToday ? `${t("todo.today", "Hôm nay")}, ` : ""}
            {formattedDay}
          </div>
          <div className="text-[11px] text-muted-foreground">{selectedDate}</div>
        </div>

        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
