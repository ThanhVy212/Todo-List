import mongoose from "mongoose";

/**
 * Validate MongoDB ObjectId parameter
 * @param {string} paramName - default "id"
 */
export const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: `ID không hợp lệ: ${id}`,
      });
    }
    next();
  };
};

/**
 * Validate request using Zod schema
 * @param {import("zod").ZodSchema} schema
 * @param {"body" | "query" | "params"} source
 */
export const validateRequest = (schema, source = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        message: formattedErrors[0]?.message || "Dữ liệu yêu cầu không hợp lệ",
        errors: formattedErrors,
      });
    }

    // Replace with parsed/sanitized data
    req[source] = result.data;
    next();
  };
};
