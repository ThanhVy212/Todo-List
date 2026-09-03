import express from "express";
import { getActivities, handleRebuildActivities } from "../controllers/activityController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getActivities);
router.post("/rebuild", handleRebuildActivities);

export default router;
