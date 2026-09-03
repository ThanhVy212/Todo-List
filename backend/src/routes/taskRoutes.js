import express from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  changeStatus,
  completeTask,
  uncompleteTask,
  deleteTask,
  restoreTask,
  permanentDeleteTask,
  emptyTrash,
  createTaskSchema,
  updateTaskSchema,
  changeStatusSchema,
} from "../controllers/taskController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validateRequest, validateObjectId } from "../middlewares/validate.js";

const router = express.Router();

// All task routes require authentication
router.use(requireAuth);

router.get("/", getTasks);
router.post("/", validateRequest(createTaskSchema, "body"), createTask);

// Empty trash route
router.delete("/trash/empty", emptyTrash);

router.get("/:id", validateObjectId("id"), getTaskById);
router.put("/:id", validateObjectId("id"), validateRequest(updateTaskSchema, "body"), updateTask);
router.patch("/:id", validateObjectId("id"), validateRequest(updateTaskSchema, "body"), updateTask);
router.patch("/:id/status", validateObjectId("id"), validateRequest(changeStatusSchema, "body"), changeStatus);

router.post("/:id/complete", validateObjectId("id"), completeTask);
router.patch("/:id/complete", validateObjectId("id"), completeTask);

router.post("/:id/uncomplete", validateObjectId("id"), uncompleteTask);
router.patch("/:id/uncomplete", validateObjectId("id"), uncompleteTask);

router.delete("/:id", validateObjectId("id"), deleteTask);
router.post("/:id/restore", validateObjectId("id"), restoreTask);
router.delete("/:id/permanent", validateObjectId("id"), permanentDeleteTask);

export default router;
