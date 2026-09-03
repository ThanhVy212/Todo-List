import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
      index: true,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    timezone: {
      type: String,
      default: "Asia/Ho_Chi_Minh",
    },
    settings: {
      weekStartsOn: {
        type: Number,
        enum: [0, 1],
        default: 1,
      },
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
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

// TTL index: auto-delete expired demo users (only where demoExpiresAt is set)
userSchema.index(
  { demoExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { isDemo: true } }
);

// Method to safely return user object without passwordHash
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.demoExpiresAt;
  return user;
};

const User = mongoose.model("User", userSchema);

export default User;
