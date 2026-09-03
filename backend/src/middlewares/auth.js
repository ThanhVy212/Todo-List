import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const JWT_SECRET = process.env.JWT_SECRET || "todolist_jwt_secret_key_2026";

/**
 * Authentication middleware
 * Extracts Bearer token from header, validates it, and fetches the user.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    }

    if (!token) {
      return res.status(401).json({
        message: "Chưa đăng nhập. Vui lòng cung cấp token hợp lệ.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        message: "Người dùng không tồn tại.",
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    console.error("requireAuth error:", error);
    return res.status(500).json({ message: "Lỗi xác thực người dùng." });
  }
};
