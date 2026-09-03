import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed", "cancelled"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    startAt: {
      type: Date,
      default: null,
    },
    endAt: {
      type: Date,
      default: null,
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
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

// Compound indexes for optimal querying
taskSchema.index({ userId: 1, scheduledDate: 1, isDeleted: 1 });
taskSchema.index({ userId: 1, status: 1, completedAt: 1, isDeleted: 1 });

// TTL index for demo data auto-cleanup (expire after demoExpiresAt)
taskSchema.index(
  { demoExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { isDemo: true } }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
