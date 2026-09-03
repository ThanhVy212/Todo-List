import mongoose from "mongoose";
import { z } from "zod";
import Task from "../models/Task.js";
import { getDateRangeInUTC, getDateKey } from "../utils/timezone.js";
import {
  syncTaskCreated,
  syncTaskUpdated,
  syncTaskDeleted,
  syncTaskRestored,
} from "../services/activityService.js";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Validation Schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, "Tiêu đề công việc là bắt buộc").max(200, "Tiêu đề tối đa 200 ký tự").trim(),
  description: z.string().optional().default(""),
  status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional().default("todo"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  scheduledDate: z.string().min(1, "Ngày lên lịch là bắt buộc"),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  isAllDay: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề tối đa 200 ký tự").trim().optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  scheduledDate: z.string().optional(),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  isAllDay: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum(["todo", "in_progress", "completed", "cancelled"]),
});

/**
 * Get tasks with date, range, search, pagination, and status filters
 */
export const getTasks = async (req, res) => {
  try {
    const userId = req.userId;
    const userTimezone = req.user.timezone || "Asia/Ho_Chi_Minh";
    const {
      date,
      from,
      to,
      status,
      priority,
      search,
      page = 1,
      limit = 100,
      includeDeleted = "false",
    } = req.query;

    // Auto cleanup trash items older than 3 days (72 hours)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await Task.deleteMany({
      userId,
      isDeleted: true,
      deletedAt: { $lt: threeDaysAgo },
    });

    const query = {
      userId,
      isDeleted: includeDeleted === "true" ? true : false,
    };

    // Filter by single date
    if (date) {
      const { startOfDayUTC, endOfDayUTC } = getDateRangeInUTC(date, userTimezone);
      query.scheduledDate = {
        $gte: startOfDayUTC,
        $lte: endOfDayUTC,
      };
    } else if (from || to) {
      query.scheduledDate = {};
      if (from) {
        const { startOfDayUTC } = getDateRangeInUTC(from, userTimezone);
        query.scheduledDate.$gte = startOfDayUTC;
      }
      if (to) {
        const { endOfDayUTC } = getDateRangeInUTC(to, userTimezone);
        query.scheduledDate.$lte = endOfDayUTC;
      }
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ];
    }

    const currentPage = Math.max(1, Number(page) || 1);
    const limitPerPage = Math.min(Math.max(1, Number(limit) || 50), 200);
    const skip = (currentPage - 1) * limitPerPage;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort({ scheduledDate: 1, priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitPerPage)
        .lean(),
      Task.countDocuments(query),
    ]);

    // Check overdue status and compute precise local scheduledDateKey
    const now = new Date();
    const tasksWithMetadata = tasks.map((t) => {
      const isOverdue =
        !t.isDeleted &&
        t.status !== "completed" &&
        t.endAt &&
        new Date(t.endAt) < now;

      const scheduledDateKey = getDateKey(t.scheduledDate, userTimezone);

      return {
        ...t,
        scheduledDateKey,
        isOverdue: Boolean(isOverdue),
      };
    });

    return res.status(200).json({
      data: tasksWithMetadata,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total,
        totalPages: Math.ceil(total / limitPerPage) || 1,
      },
    });
  } catch (error) {
    console.error("getTasks error:", error);
    return res.status(500).json({ message: "Không thể lấy danh sách công việc." });
  }
};

/**
 * Get a single task by ID
 */
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userTimezone = req.user?.timezone || "Asia/Ho_Chi_Minh";
    const task = await Task.findOne({ _id: id, userId: req.userId }).lean();

    if (!task) {
      return res.status(404).json({ message: "Không tìm thấy công việc." });
    }

    const isOverdue =
      !task.isDeleted &&
      task.status !== "completed" &&
      task.endAt &&
      new Date(task.endAt) < new Date();

    const scheduledDateKey = getDateKey(task.scheduledDate, userTimezone);

    return res.status(200).json({
      data: {
        ...task,
        scheduledDateKey,
        isOverdue: Boolean(isOverdue),
      },
    });
  } catch (error) {
    console.error("getTaskById error:", error);
    return res.status(500).json({ message: "Không thể lấy thông tin công việc." });
  }
};

/**
 * Create a new task
 */
export const createTask = async (req, res) => {
  try {
    const userId = req.userId;
    const userTimezone = req.user.timezone || "Asia/Ho_Chi_Minh";
    const {
      title,
      description = "",
      status = "todo",
      priority = "medium",
      scheduledDate,
      startAt = null,
      endAt = null,
      isAllDay = false,
      tags = [],
    } = req.body;

    const todayKey = getDateKey(new Date(), userTimezone);
    const targetDateKey =
      typeof scheduledDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)
        ? scheduledDate
        : getDateKey(scheduledDate, userTimezone);

    // Disallow creating task for past dates
    if (targetDateKey < todayKey) {
      return res.status(400).json({
        message: "Không thể thêm công việc cho các ngày trong quá khứ.",
      });
    }

    const parsedStart = startAt ? new Date(startAt) : null;
    const parsedEnd = endAt ? new Date(endAt) : null;

    if (parsedStart && parsedEnd && parsedEnd < parsedStart) {
      return res.status(400).json({
        message: "Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu.",
      });
    }

    const { startOfDayUTC } = getDateRangeInUTC(targetDateKey, userTimezone);
    const schedDateObj = startOfDayUTC;

    const isCompleted = status === "completed";
    const completedAt = isCompleted ? new Date() : null;

    const taskData = {
      userId,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      scheduledDate: schedDateObj,
      startAt: parsedStart,
      endAt: parsedEnd,
      isAllDay,
      completedAt,
      tags,
    };

    if (req.user.isDemo) {
      taskData.isDemo = true;
      taskData.demoExpiresAt = req.user.demoExpiresAt;
    }

    const task = new Task(taskData);

    const savedTask = await task.save();

    // Sync DailyActivity
    await syncTaskCreated(savedTask, userTimezone);

    const taskObj = savedTask.toObject();
    taskObj.scheduledDateKey = targetDateKey;

    return res.status(201).json({
      message: "Tạo công việc thành công",
      data: taskObj,
    });
  } catch (error) {
    console.error("createTask error:", error);
    return res.status(500).json({ message: "Không thể tạo công việc." });
  }
};

/**
 * Update task
 */
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userTimezone = req.user.timezone || "Asia/Ho_Chi_Minh";

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      return res.status(404).json({ message: "Không tìm thấy công việc để cập nhật." });
    }

    const oldTaskSnapshot = task.toObject();
    const body = req.body;

    if (body.title !== undefined) task.title = body.title.trim();
    if (body.description !== undefined) task.description = body.description.trim();
    if (body.priority !== undefined) task.priority = body.priority;
    if (body.isAllDay !== undefined) task.isAllDay = body.isAllDay;
    if (body.tags !== undefined) task.tags = body.tags;

    if (body.startAt !== undefined) {
      task.startAt = body.startAt ? new Date(body.startAt) : null;
    }
    if (body.endAt !== undefined) {
      task.endAt = body.endAt ? new Date(body.endAt) : null;
    }

    if (task.startAt && task.endAt && task.endAt < task.startAt) {
      return res.status(400).json({
        message: "Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu.",
      });
    }

    if (body.scheduledDate !== undefined) {
      const targetDateKey =
        typeof body.scheduledDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.scheduledDate)
          ? body.scheduledDate
          : getDateKey(body.scheduledDate, userTimezone);

      const { startOfDayUTC } = getDateRangeInUTC(targetDateKey, userTimezone);
      task.scheduledDate = startOfDayUTC;
    }

    if (body.status !== undefined && body.status !== task.status) {
      task.status = body.status;
      if (body.status === "completed") {
        task.completedAt = task.completedAt || new Date();
      } else {
        task.completedAt = null;
      }
    }

    const updatedTask = await task.save();

    // Sync DailyActivity
    await syncTaskUpdated(oldTaskSnapshot, updatedTask, userTimezone);

    const updatedTaskObj = updatedTask.toObject();
    updatedTaskObj.scheduledDateKey = getDateKey(updatedTask.scheduledDate, userTimezone);

    return res.status(200).json({
      message: "Cập nhật công việc thành công",
      data: updatedTaskObj,
    });
  } catch (error) {
    console.error("updateTask error:", error);
    return res.status(500).json({ message: "Không thể cập nhật công việc." });
  }
};

/**
 * Change status of a task
 */
export const changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;
    const userTimezone = req.user.timezone || "Asia/Ho_Chi_Minh";

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      return res.status(404).json({ message: "Không tìm thấy công việc." });
    }

    if (task.status === status) {
      return res.status(200).json({
        message: "Trạng thái công việc không thay đổi",
        data: task,
      });
    }

    const oldTaskSnapshot = task.toObject();
    task.status = status;

    if (status === "completed") {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }

    const updatedTask = await task.save();
    await syncTaskUpdated(oldTaskSnapshot, updatedTask, userTimezone);

    return res.status(200).json({
      message: "Thay đổi trạng thái công việc thành công",
      data: updatedTask,
    });
  } catch (error) {
    console.error("changeStatus error:", error);
    return res.status(500).json({ message: "Không thể thay đổi trạng thái công việc." });
  }
};

/**
 * Mark task as completed (Idempotent)
 */
export const completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userTimezone = req.user.timezone || "Asia/Ho_Chi_Minh";

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      return res.status(404).json({ message: "Không tìm thấy công việc." });
    }

    if (task.status === "completed" && task.completedAt) {
      return res.status(200).json({
        message: "Công việc đã được hoàn thành trước đó",
        data: task,
      });
    }

    const oldTaskSnapshot = task.toObject();
    task.status = "completed";
    task.completedAt = new Date();

    const updatedTask = await task.save();
    await syncTaskUpdated(oldTaskSnapshot, updatedTask, userTimezone);

    return res.status(200).json({
      message: "Đã đánh dấu hoàn thành công việc",
      data: updatedTask,
    });
  } catch (error) {
    console.error("completeTask error:", error);
    return res.status(500).json({ message: "Không thể đánh dấu hoàn thành công việc." });
  }
};

/**
 * Unmark task completion (Idempotent)
 */
export const uncompleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userTimezone = req.user.timezone || "Asia/Ho_Chi_Minh";

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      return res.status(404).json({ message: "Không tìm thấy công việc." });
    }

    if (task.status !== "completed" && !task.completedAt) {
      return res.status(200).json({
        message: "Công việc chưa hoàn thành",
        data: task,
      });
    }

    const oldTaskSnapshot = task.toObject();
    task.status = "todo";
    task.completedAt = null;

    const updatedTask = await task.save();
    await syncTaskUpdated(oldTaskSnapshot, updatedTask, userTimezone);

    return res.status(200).json({
      message: "Đã bỏ đánh dấu hoàn thành công việc",
      data: updatedTask,
    });
  } catch (error) {
    console.error("uncompleteTask error:", error);
    return res.status(500).json({ message: "Không thể bỏ đánh dấu hoàn thành công việc." });
  }
};

/**
 * Soft delete a task
 */
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userTimezone = req.user.timezone || "Asia/Ho_Chi_Minh";

    const task = await Task.findOne({ _id: id, userId, isDeleted: false });
    if (!task) {
      return res.status(404).json({ message: "Không tìm thấy công việc để xóa." });
    }

    task.isDeleted = true;
    task.deletedAt = new Date();

    const savedTask = await task.save();
    await syncTaskDeleted(savedTask, userTimezone);

    return res.status(200).json({
      message: "Xóa công việc thành công (đã chuyển vào thùng rác)",
      data: savedTask,
    });
  } catch (error) {
    console.error("deleteTask error:", error);
    return res.status(500).json({ message: "Không thể xóa công việc." });
  }
};

/**
 * Restore a soft-deleted task
 */
export const restoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userTimezone = req.user.timezone || "Asia/Ho_Chi_Minh";

    const task = await Task.findOne({ _id: id, userId, isDeleted: true });
    if (!task) {
      return res.status(404).json({ message: "Không tìm thấy công việc trong thùng rác." });
    }

    task.isDeleted = false;
    task.deletedAt = null;

    const savedTask = await task.save();
    await syncTaskRestored(savedTask, userTimezone);

    return res.status(200).json({
      message: "Khôi phục công việc thành công",
      data: savedTask,
    });
  } catch (error) {
    console.error("restoreTask error:", error);
    return res.status(500).json({ message: "Không thể khôi phục công việc." });
  }
};

/**
 * Permanently delete a task from trash
 */
export const permanentDeleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const task = await Task.findOneAndDelete({ _id: id, userId, isDeleted: true });
    if (!task) {
      return res.status(404).json({ message: "Không tìm thấy công việc trong thùng rác." });
    }

    return res.status(200).json({
      message: "Đã xóa vĩnh viễn công việc khỏi hệ thống.",
      id,
    });
  } catch (error) {
    console.error("permanentDeleteTask error:", error);
    return res.status(500).json({ message: "Không thể xóa vĩnh viễn công việc." });
  }
};

/**
 * Empty all items in trash permanently
 */
export const emptyTrash = async (req, res) => {
  try {
    const userId = req.userId;
    const result = await Task.deleteMany({ userId, isDeleted: true });

    return res.status(200).json({
      message: `Đã dọn sạch thùng rác (${result.deletedCount} công việc).`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("emptyTrash error:", error);
    return res.status(500).json({ message: "Không thể dọn sạch thùng rác." });
  }
};
