import Task from "../models/Task.js";

export const getTasks = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, projectId } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const limitPerPage = Math.min(Math.max(1, Number(limit) || 10), 100);

    const skip = (currentPage - 1) * limitPerPage;

    const query = {};

    if (status) {
      const validStatus = ["active", "complete"];

      if (!validStatus.includes(status)) {
        return res.status(400).json({
          message:
            "Trạng thái không hợp lệ. Chỉ chấp nhận 'active' hoặc 'complete'",
        });
      }

      query.status = status;
    }

    if (projectId) {
      query.projectId = projectId;
    }

    if (search?.trim()) {
      query.$or = [
        {
          title: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          description: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    const [tasks, total] = await Promise.all([
      Task.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitPerPage),
      Task.countDocuments(query),
    ]);

    return res.status(200).json({
      data: tasks,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total,
        totalPages: Math.ceil(total / limitPerPage),
      },
    });
  } catch (error) {
    console.error("getTasks controller error:", error);
    res.status(500).json({ error: "Failed to get tasks" });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, startAt, endAt, projectId } = req.body;
    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Tiêu đề công việc là bắt buộc" });
    }

    if (startAt && endAt && new Date(endAt) < new Date(startAt)) {
      return res.status(400).json({
        message: "Thời gian kết thúc phải sau thời gian bắt đầu",
      });
    }

    const newTask = new Task({
      title: title.trim(),
      description: description?.trim() || "",
      startAt: startAt || null,
      endAt: endAt || null,
      projectId: projectId || null,
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("createTask controller error:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, status, description, startAt, endAt, projectId } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Không tìm thấy công việc" });
    }

    if (title !== undefined) {
      if (title.trim() === "") {
        return res
          .status(400)
          .json({ message: "Tiêu đề công việc không được để trống" });
      }
      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description = description.trim();
    }

    if (status !== undefined) {
      if (status !== "active" && status !== "complete") {
        return res.status(400).json({
          message: "Trạng thái không hợp lệ. Phải là 'active' hoặc 'complete'",
        });
      }
      if (status !== task.status) {
        task.status = status;
        task.completedAt = status === "complete" ? new Date() : null;
      }
    }

    if (startAt !== undefined) {
      task.startAt = startAt || null;
    }

    if (endAt !== undefined) {
      task.endAt = endAt || null;
    }

    const effectiveStart = startAt !== undefined ? startAt : task.startAt;
    const effectiveEnd = endAt !== undefined ? endAt : task.endAt;

    if (effectiveStart && effectiveEnd && new Date(effectiveEnd) < new Date(effectiveStart)) {
      return res.status(400).json({
        message: "Thời gian kết thúc phải sau thời gian bắt đầu",
      });
    }

    if (projectId !== undefined) {
      task.projectId = projectId || null;
    }

    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("updateTask controller error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy công việc để xóa" });
    }

    res.status(200).json({ message: "Xóa công việc thành công", id });
  } catch (error) {
    console.error("deleteTask controller error:", error);
    res.status(500).json({ error: "Failed to delete task " });
  }
};
