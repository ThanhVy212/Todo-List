import express from "express";
import {
  register,
  login,
  getMe,
  updateMe,
  redirectToGoogle,
  handleGoogleCallback,
  exchangeAuthCode,
  demoLogin,
  demoCleanup,
  registerSchema,
  loginSchema,
  updateMeSchema,
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate.js";

const router = express.Router();

router.post("/register", validateRequest(registerSchema, "body"), register);
router.post("/login", validateRequest(loginSchema, "body"), login);

router.get("/me", requireAuth, getMe);
router.put(
    "/me",
    requireAuth,
    validateRequest(updateMeSchema, "body"),
    updateMe
);

// Google OAuth
router.get("/google", redirectToGoogle);
router.get("/callback/google", handleGoogleCallback);
router.post("/google/exchange", exchangeAuthCode);

// Demo session
router.post("/demo-login", demoLogin);
router.post("/demo-cleanup", demoCleanup);

export default router;