import mongoose from "mongoose";

const dailyActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    scheduledCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    activityCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    overdueCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    todoCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    focusMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDemo: {
      type: Boolean,
      default: false,
      index: true,
    },
    demoExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index so each user only has one activity document per dateKey
dailyActivitySchema.index({ userId: 1, dateKey: 1 }, { unique: true });

// TTL index for demo data auto-cleanup
dailyActivitySchema.index(
  { demoExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { isDemo: true } }
);

const DailyActivity = mongoose.model("DailyActivity", dailyActivitySchema);

export default DailyActivity;
