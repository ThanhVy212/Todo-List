import DailyActivity from "../models/DailyActivity.js";
import Task from "../models/Task.js";
import {
  getDateKey,
  shiftDateKey,
  enumerateDateKeys,
  getDaysDifference,
  getDominantColorInfo,
  calculateStreaks,
} from "../utils/timezone.js";
import { rebuildDailyActivities } from "../services/activityService.js";

/**
 * GET /api/activities?year=2026 or ?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export const getActivities = async (req, res) => {
  try {
    const userId = req.userId;
    const userTimezone = req.user.timezone || "Asia/Ho_Chi_Minh";

    const todayKey = getDateKey(new Date(), userTimezone);
    const currentYear = todayKey.slice(0, 4);

    let { from, to, year } = req.query;

    if (year && /^\d{4}$/.test(year)) {
      from = `${year}-01-01`;
      to = `${year}-12-31`;
    } else {
      if (!to && !from) {
        from = `${currentYear}-01-01`;
        to = `${currentYear}-12-31`;
      } else {
        if (!to) to = todayKey;
        if (!from) from = shiftDateKey(to, -364);
      }
    }

    // Validate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return res.status(400).json({
        message: "Định dạng ngày không hợp lệ. Vui lòng dùng YYYY-MM-DD hoặc year=YYYY.",
      });
    }

    if (from > to) {
      return res.status(400).json({
        message: "Ngày bắt đầu ('from') phải trước hoặc bằng ngày kết thúc ('to').",
      });
    }

    const diffDays = getDaysDifference(from, to) + 1;
    if (diffDays > 366) {
      return res.status(400).json({
        message: "Khoảng thời gian yêu cầu không được vượt quá 1 năm (366 ngày).",
      });
    }

    // Fetch DailyActivity documents for this user in this range
    const [activities, tasksInRange] = await Promise.all([
      DailyActivity.find({
        userId,
        dateKey: { $gte: from, $lte: to },
      }).lean(),
      Task.find({
        userId,
        isDeleted: false,
      })
        .select("scheduledDate status completedAt endAt")
        .lean(),
    ]);

    const activityMap = new Map();
    for (const act of activities) {
      activityMap.set(act.dateKey, act);
    }

    // Count live overdue and todo tasks per dateKey
    const liveTaskCounts = new Map();
    const now = new Date();

    for (const task of tasksInRange) {
      const schedKey = getDateKey(task.scheduledDate, userTimezone);
      if (!liveTaskCounts.has(schedKey)) {
        liveTaskCounts.set(schedKey, { completedCount: 0, overdueCount: 0, todoCount: 0 });
      }
      const counts = liveTaskCounts.get(schedKey);

      if (task.status === "completed") {
        counts.completedCount += 1;
      } else {
        const isOverdue =
          (task.endAt && new Date(task.endAt) < now) || schedKey < todayKey;
        if (isOverdue) {
          counts.overdueCount += 1;
        } else {
          counts.todoCount += 1;
        }
      }
    }

    // Enumerate all dates
    const allDateKeys = enumerateDateKeys(from, to);
    let totalCompleted = 0;
    let activeDays = 0;

    const data = allDateKeys.map((dateKey) => {
      const act = activityMap.get(dateKey);
      const live = liveTaskCounts.get(dateKey) || {
        completedCount: 0,
        overdueCount: 0,
        todoCount: 0,
      };

      const completedCount = Math.max(act?.completedCount || 0, live.completedCount);
      const overdueCount = Math.max(act?.overdueCount || 0, live.overdueCount);
      const todoCount = Math.max(act?.todoCount || 0, live.todoCount);

      if (completedCount > 0) {
        totalCompleted += completedCount;
        activeDays += 1;
      }

      const dominant = getDominantColorInfo(completedCount, overdueCount, todoCount);

      return {
        date: dateKey,
        count: dominant.count,
        level: dominant.level,
        colorType: dominant.colorType, // "green" | "red" | "yellow" | "none"
        completedCount,
        overdueCount,
        todoCount,
      };
    });

    // Compute user streaks
    const allUserActivities = await DailyActivity.find({
      userId,
      completedCount: { $gt: 0 },
    })
      .select("dateKey completedCount")
      .lean();

    const allActiveDatesSet = new Set(allUserActivities.map((a) => a.dateKey));

    // Also include live completed dates
    for (const [dKey, val] of liveTaskCounts.entries()) {
      if (val.completedCount > 0) {
        allActiveDatesSet.add(dKey);
      }
    }

    const { currentStreak, longestStreak } = calculateStreaks(allActiveDatesSet, todayKey);

    return res.status(200).json({
      data,
      stats: {
        totalCompleted,
        activeDays,
        currentStreak,
        longestStreak,
      },
      year: year || from.slice(0, 4),
    });
  } catch (error) {
    console.error("getActivities error:", error);
    return res.status(500).json({ message: "Không thể lấy dữ liệu hoạt động." });
  }
};

/**
 * POST /api/activities/rebuild
 */
export const handleRebuildActivities = async (req, res) => {
  try {
    const userId = req.userId;
    const userTimezone = req.user.timezone || "Asia/Ho_Chi_Minh";
    const { from, to } = req.body || {};

    const result = await rebuildDailyActivities(userId, from, to, userTimezone);
    return res.status(200).json({
      message: "Tính toán lại dữ liệu hoạt động thành công",
      result,
    });
  } catch (error) {
    console.error("handleRebuildActivities error:", error);
    return res.status(500).json({ message: "Không thể tính toán lại dữ liệu hoạt động." });
  }
};
