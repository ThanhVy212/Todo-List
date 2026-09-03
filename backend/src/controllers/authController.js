import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import User from "../models/User.js";
import Task from "../models/Task.js";
import DailyActivity from "../models/DailyActivity.js";
import { JWT_SECRET } from "../middlewares/auth.js";

const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || "http://localhost:8000/api/auth/callback/google";

// In-memory OAuth state store (single-server only)
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const oauthStateStore = new Map();

function generateOAuthState() {
  const state = crypto.randomBytes(32).toString("hex");
  oauthStateStore.set(state, Date.now() + OAUTH_STATE_TTL_MS);
  return state;
}

function consumeOAuthState(state) {
  if (!state) return false;
  const expiresAt = oauthStateStore.get(state);
  if (expiresAt === undefined) return false;
  oauthStateStore.delete(state);
  return Date.now() <= expiresAt;
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const pair of header.split(";")) {
    const [name, ...rest] = pair.split("=");
    const value = rest.join("=").trim();
    if (name) cookies[name.trim()] = decodeURIComponent(value);
  }
  return cookies;
}

// One-time auth code store for OAuth token exchange (single-server only)
const AUTH_CODE_TTL_MS = 60 * 1000; // 60 seconds
const authCodeStore = new Map(); // code → { token, expiresAt }

function generateAuthCode(token) {
  const code = crypto.randomBytes(24).toString("hex");
  authCodeStore.set(code, { token, expiresAt: Date.now() + AUTH_CODE_TTL_MS });
  return code;
}

function consumeAuthCode(code) {
  if (!code) return null;
  const entry = authCodeStore.get(code);
  if (!entry) return null;
  authCodeStore.delete(code);
  if (Date.now() > entry.expiresAt) return null;
  return entry.token;
}

// Validation Schemas
export const registerSchema = z.object({
  fullName: z.string().min(1, "Họ và tên là bắt buộc").trim(),
  email: z.string().email("Email không hợp lệ").toLowerCase().trim(),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  timezone: z.string().optional().default("Asia/Ho_Chi_Minh"),
  avatarUrl: z.string().optional().default(""),
  settings: z
    .object({
      weekStartsOn: z.union([z.literal(0), z.literal(1)]).optional().default(1),
      theme: z.enum(["light", "dark", "system"]).optional().default("system"),
    })
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ").toLowerCase().trim(),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

export const updateMeSchema = z.object({
  fullName: z.string().min(1, "Họ và tên không được để trống").trim().optional(),
  avatarUrl: z.string().optional(),
  timezone: z.string().optional(),
  settings: z
    .object({
      weekStartsOn: z.union([z.literal(0), z.literal(1)]).optional(),
      theme: z.enum(["light", "dark", "system"]).optional(),
    })
    .optional(),
});

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { fullName, email, password, timezone, avatarUrl, settings } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email này đã được đăng ký tài khoản." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      passwordHash,
      timezone: timezone || "Asia/Ho_Chi_Minh",
      avatarUrl: avatarUrl || "",
      settings: settings || { weekStartsOn: 1, theme: "system" },
    });

    const savedUser = await newUser.save();

    const token = jwt.sign(
      { userId: savedUser._id, email: savedUser.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.status(201).json({
      message: "Đăng ký tài khoản thành công",
      token,
      user: savedUser.toJSON(),
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi đăng ký tài khoản." });
  }
};

/**
 * Login existing user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác." });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        message: "Tài khoản này được tạo bằng Google. Vui lòng đăng nhập với Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không chính xác." });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi đăng nhập." });
  }
};

/**
 * Get current user profile
 */
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      user: req.user.toJSON(),
    });
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({ message: "Không thể lấy thông tin người dùng." });
  }
};

/**
 * Update current user profile
 */
export const updateMe = async (req, res) => {
  try {
    const { fullName, avatarUrl, timezone, settings } = req.body;
    const user = req.user;

    if (fullName !== undefined) user.fullName = fullName;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (timezone !== undefined) user.timezone = timezone;
    if (settings !== undefined) {
      user.settings = { ...user.settings, ...settings };
    }

    const updatedUser = await user.save();
    return res.status(200).json({
      message: "Cập nhật thông tin thành công",
      user: updatedUser.toJSON(),
    });
  } catch (error) {
    console.error("updateMe error:", error);
    return res.status(500).json({ message: "Không thể cập nhật thông tin người dùng." });
  }
};

/**
 * Redirect user to Google OAuth2 consent screen
 */
export const redirectToGoogle = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID") {
    return res.status(500).json({
      message:
        "Google OAuth chưa được cấu hình. Vui lòng điền GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong backend/.env",
    });
  }

  const state = generateOAuthState();

  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: OAUTH_STATE_TTL_MS,
  });

  const scope = encodeURIComponent("openid profile email");
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    GOOGLE_CALLBACK_URL
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account&state=${encodeURIComponent(state)}`;

  return res.redirect(googleAuthUrl);
};

/**
 * Handle Google OAuth callback
 */
export const handleGoogleCallback = async (req, res) => {
  const { code, error, state } = req.query;

  const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";

  const cookies = parseCookies(req.headers.cookie);
  const cookieState = cookies.oauth_state;

  res.clearCookie("oauth_state", { httpOnly: true, sameSite: "lax" });

  if (!state || !cookieState || state !== cookieState || !consumeOAuthState(state)) {
    console.error("Google OAuth state mismatch or reused state");
    return res.redirect(`${frontendUrl}/?error=google_auth_invalid_state`);
  }

  if (error || !code) {
    console.error("Google OAuth error or cancelled:", error);
    return res.redirect(`${frontendUrl}/?error=google_auth_failed`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret || !process.env.JWT_SECRET) {
      throw new Error("Missing Google OAuth or JWT environment variables");
    }

    console.log("Google OAuth callback URL:", GOOGLE_CALLBACK_URL);

    const tokenResponse = await fetch(
        "https://oauth2.googleapis.com/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            code: String(code),
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: GOOGLE_CALLBACK_URL,
            grant_type: "authorization_code",
          }),
        }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Failed to exchange Google token:", tokenData);
      return res.redirect(
          `${frontendUrl}/?error=google_token_exchange_failed`
      );
    }

    const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
    );

    if (!userInfoResponse.ok) {
      console.error(
          "Failed to fetch Google user:",
          await userInfoResponse.text()
      );

      return res.redirect(
          `${frontendUrl}/?error=google_user_info_failed`
      );
    }

    const profile = await userInfoResponse.json();

    if (!profile.email || !profile.email_verified) {
      return res.redirect(
          `${frontendUrl}/?error=google_email_not_verified`
      );
    }

    const normalizedEmail = profile.email.toLowerCase();

    let user = await User.findOne({
      $or: [
        { googleId: profile.sub },
        { email: normalizedEmail },
      ],
    });

    if (!user) {
      user = await User.create({
        fullName: profile.name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        googleId: profile.sub,
        avatarUrl: profile.picture || "",
        timezone: "Asia/Ho_Chi_Minh",
        settings: {
          weekStartsOn: 1,
          theme: "system",
        },
      });
    } else {
      let modified = false;

      if (!user.googleId) {
        user.googleId = profile.sub;
        modified = true;
      }

      if (!user.avatarUrl && profile.picture) {
        user.avatarUrl = profile.picture;
        modified = true;
      }

      if (modified) {
        await user.save();
      }
    }

    const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "30d",
        }
    );

    const authCode = generateAuthCode(token);

    return res.redirect(
        `${frontendUrl}/?auth_code=${encodeURIComponent(authCode)}`
    );
  } catch (err) {
    console.error("handleGoogleCallback error:", err);

    return res.redirect(
        `${frontendUrl}/?error=google_auth_server_error`
    );
  }
};

/**
 * Exchange a short-lived one-time auth code for the JWT token
 */
export const exchangeAuthCode = async (req, res) => {
  const { code } = req.body || {};

  const token = consumeAuthCode(code);
  if (!token) {
    return res.status(400).json({ message: "Mã xác thực không hợp lệ hoặc đã hết hạn." });
  }

  return res.status(200).json({ token });
};

const DEMO_SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Create an isolated demo session with a temporary user and seed data
 */
export const demoLogin = async (req, res) => {
  try {
    const uuid = crypto.randomUUID();
    const demoEmail = `demo_${uuid}@demo.app`;
    const demoExpiresAt = new Date(Date.now() + DEMO_SESSION_DURATION_MS);

    const newUser = await User.create({
      fullName: "Demo User",
      email: demoEmail,
      passwordHash: null,
      timezone: "Asia/Ho_Chi_Minh",
      settings: { weekStartsOn: 1, theme: "system" },
      isDemo: true,
      demoExpiresAt,
    });

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, isDemo: true },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(201).json({
      message: "Demo session created",
      token,
      user: newUser.toJSON(),
    });
  } catch (error) {
    console.error("demoLogin error:", error);
    return res.status(500).json({ message: "Failed to create demo session." });
  }
};

/**
 * Clean up all data owned by a demo user. Idempotent.
 * Authenticates via ?token= query parameter (used by sendBeacon on page unload).
 */
export const demoCleanup = async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      return res.status(401).json({ message: "Token is required." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    if (!user.isDemo) {
      return res.status(403).json({ message: "This endpoint is only for demo accounts." });
    }

    const userId = user._id;

    await Task.deleteMany({ userId });
    await DailyActivity.deleteMany({ userId });
    await User.deleteOne({ _id: userId });

    return res.status(200).json({ message: "Demo session cleaned up successfully." });
  } catch (error) {
    console.error("demoCleanup error:", error);
    return res.status(500).json({ message: "Failed to clean up demo session." });
  }
};
