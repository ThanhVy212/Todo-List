import Project from "../models/Project.js";
import Task from "../models/Task.js";

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ name: 1 });

    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ projectId: project._id });
        return {
          ...project.toObject(),
          taskCount,
        };
      }),
    );

    return res.status(200).json({ data: projectsWithCounts });
  } catch (error) {
    console.error("getProjects controller error:", error);
    res.status(500).json({ error: "Failed to get projects" });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Tên dự án là bắt buộc" });
    }

    const existing = await Project.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "Tên dự án đã tồn tại" });
    }

    const newProject = new Project({ name: name.trim() });
    const savedProject = await newProject.save();

    res.status(201).json({ ...savedProject.toObject(), taskCount: 0 });
  } catch (error) {
    console.error("createProject controller error:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Tên dự án không được để trống" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Không tìm thấy dự án" });
    }

    const existing = await Project.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: "Tên dự án đã tồn tại" });
    }

    project.name = name.trim();
    const updatedProject = await project.save();

    const taskCount = await Task.countDocuments({ projectId: id });
    res.status(200).json({ ...updatedProject.toObject(), taskCount });
  } catch (error) {
    console.error("updateProject controller error:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Không tìm thấy dự án để xóa" });
    }

    await Task.updateMany({ projectId: id }, { projectId: null });
    await Project.findByIdAndDelete(id);

    res.status(200).json({ message: "Xóa dự án thành công", id });
  } catch (error) {
    console.error("deleteProject controller error:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
};
