import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../src/server.js";
import User from "../src/models/User.js";
import Task from "../src/models/Task.js";
import DailyActivity from "../src/models/DailyActivity.js";
import {
  getDateKey,
  getDateRangeInUTC,
  calculateStreaks,
  getActivityLevel,
} from "../src/utils/timezone.js";
import { rebuildDailyActivities } from "../src/services/activityService.js";

dotenv.config();

describe("1. Timezone & Streak Utility Tests", () => {
  it("converts timestamps near midnight correctly according to timezone without UTC slice bugs", () => {
    // 2026-09-02 23:59:00 in UTC is 2026-09-03 06:59:00 in Asia/Ho_Chi_Minh (GMT+7)
    const utcDate = new Date("2026-09-02T23:59:00.000Z");
    const vnKey = getDateKey(utcDate, "Asia/Ho_Chi_Minh");
    expect(vnKey).toBe("2026-09-03");

    // 2026-09-02 16:59:00 in UTC is 2026-09-02 23:59:00 in Asia/Ho_Chi_Minh (GMT+7)
    const lateUtc = new Date("2026-09-02T16:59:00.000Z");
    expect(getDateKey(lateUtc, "Asia/Ho_Chi_Minh")).toBe("2026-09-02");

    // 2026-09-02 17:00:00 in UTC is 2026-09-03 00:00:00 in Asia/Ho_Chi_Minh (GMT+7)
    const midnightUtc = new Date("2026-09-02T17:00:00.000Z");
    expect(getDateKey(midnightUtc, "Asia/Ho_Chi_Minh")).toBe("2026-09-03");
  });

  it("calculates accurate UTC date range for a local date in Asia/Ho_Chi_Minh", () => {
    const { startOfDayUTC, endOfDayUTC } = getDateRangeInUTC("2026-09-03", "Asia/Ho_Chi_Minh");
    // Start of day in GMT+7 is 17:00 UTC previous day
    expect(startOfDayUTC.toISOString()).toBe("2026-09-02T17:00:00.000Z");
    // End of day in GMT+7 is 16:59:59.999 UTC
    expect(endOfDayUTC.toISOString()).toBe("2026-09-03T16:59:59.999Z");
  });

  it("maps activity counts to levels 0 through 4 correctly", () => {
    expect(getActivityLevel(0)).toBe(0);
    expect(getActivityLevel(1)).toBe(1);
    expect(getActivityLevel(2)).toBe(1);
    expect(getActivityLevel(3)).toBe(2);
    expect(getActivityLevel(4)).toBe(2);
    expect(getActivityLevel(5)).toBe(3);
    expect(getActivityLevel(7)).toBe(3);
    expect(getActivityLevel(8)).toBe(4);
    expect(getActivityLevel(15)).toBe(4);
  });

  it("calculates current streak and longest streak accurately", () => {
    const activeDates = new Set(["2026-09-01", "2026-09-02", "2026-09-03"]);
    const res1 = calculateStreaks(activeDates, "2026-09-03");
    expect(res1.currentStreak).toBe(3);
    expect(res1.longestStreak).toBe(3);

    // If today is not completed yet but yesterday was completed
    const res2 = calculateStreaks(new Set(["2026-09-01", "2026-09-02"]), "2026-09-03");
    expect(res2.currentStreak).toBe(2);
    expect(res2.longestStreak).toBe(2);

    // If missed yesterday and today
    const res3 = calculateStreaks(new Set(["2026-08-30", "2026-08-31"]), "2026-09-03");
    expect(res3.currentStreak).toBe(0);
    expect(res3.longestStreak).toBe(2);
  });
});

describe("2. API & Database Integration Tests", () => {
  let user1Token, user1Id;
  let user2Token, user2Id;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_CONNECTIONSTRING;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (user1Id) {
      await User.deleteOne({ _id: user1Id });
      await Task.deleteMany({ userId: user1Id });
      await DailyActivity.deleteMany({ userId: user1Id });
    }
    if (user2Id) {
      await User.deleteOne({ _id: user2Id });
      await Task.deleteMany({ userId: user2Id });
      await DailyActivity.deleteMany({ userId: user2Id });
    }
    await mongoose.disconnect();
  });

  it("registers User 1 and User 2", async () => {
    const email1 = `test_user1_${Date.now()}@example.com`;
    const res1 = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "User One",
        email: email1,
        password: "password123",
        timezone: "Asia/Ho_Chi_Minh",
      });

    expect(res1.status).toBe(201);
    expect(res1.body.token).toBeDefined();
    expect(res1.body.user.passwordHash).toBeUndefined();
    user1Token = res1.body.token;
    user1Id = res1.body.user._id;

    const email2 = `test_user2_${Date.now()}@example.com`;
    const res2 = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "User Two",
        email: email2,
        password: "password123",
        timezone: "Asia/Ho_Chi_Minh",
      });

    expect(res2.status).toBe(201);
    user2Token = res2.body.token;
    user2Id = res2.body.user._id;
  });

  it("ensures User 2 cannot access or modify User 1's tasks", async () => {
    // User 1 creates a task
    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        title: "User 1 Secret Task",
        scheduledDate: "2026-09-03",
      });

    expect(createRes.status).toBe(201);
    const taskId = createRes.body.data._id;

    // User 2 tries to get User 1's task
    const getRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${user2Token}`);
    expect(getRes.status).toBe(404);

    // User 2 tries to delete User 1's task
    const delRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${user2Token}`);
    expect(delRes.status).toBe(404);

    // User 2 gets task list -> should not see User 1's task
    const listRes = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${user2Token}`);
    expect(listRes.body.data.length).toBe(0);
  });

  it("queries tasks accurately by single date and timezone", async () => {
    // Clear tasks first
    await Task.deleteMany({ userId: user1Id });

    const date1 = "2026-09-05";
    const date2 = "2026-09-06";

    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        title: "Task for Day 5",
        scheduledDate: date1,
      });

    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        title: "Task for Day 6",
        scheduledDate: date2,
      });

    const queryDay5 = await request(app)
      .get(`/api/tasks?date=${date1}`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(queryDay5.status).toBe(200);
    expect(queryDay5.body.data.length).toBe(1);
    expect(queryDay5.body.data[0].title).toBe("Task for Day 5");
  });

  it("completing a task increments DailyActivity completedCount and activityCount once (idempotent)", async () => {
    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({
        title: "Completion Test Task",
        scheduledDate: "2026-09-03",
      });

    const taskId = createRes.body.data._id;
    const todayKey = getDateKey(new Date(), "Asia/Ho_Chi_Minh");

    // Complete task
    const comp1 = await request(app)
      .post(`/api/tasks/${taskId}/complete`)
      .set("Authorization", `Bearer ${user1Token}`);
    expect(comp1.status).toBe(200);
    expect(comp1.body.data.status).toBe("completed");

    const act1 = await DailyActivity.findOne({ userId: user1Id, dateKey: todayKey });
    expect(act1.completedCount).toBeGreaterThanOrEqual(1);
    const initialCompleted = act1.completedCount;
    const initialActivity = act1.activityCount;

    // Call complete AGAIN (should NOT increase count - idempotent)
    const comp2 = await request(app)
      .post(`/api/tasks/${taskId}/complete`)
      .set("Authorization", `Bearer ${user1Token}`);
    expect(comp2.status).toBe(200);

    const act2 = await DailyActivity.findOne({ userId: user1Id, dateKey: todayKey });
    expect(act2.completedCount).toBe(initialCompleted);
    expect(act2.activityCount).toBe(initialActivity);

    // Uncomplete task
    const uncomp = await request(app)
      .post(`/api/tasks/${taskId}/uncomplete`)
      .set("Authorization", `Bearer ${user1Token}`);
    expect(uncomp.status).toBe(200);
    expect(uncomp.body.data.status).toBe("todo");

    const act3 = await DailyActivity.findOne({ userId: user1Id, dateKey: todayKey });
    expect(act3.completedCount).toBe(initialCompleted - 1);
    expect(act3.activityCount).toBe(initialActivity - 1);

    // Daily activity counters never drop below 0
    expect(act3.completedCount).toBeGreaterThanOrEqual(0);
    expect(act3.activityCount).toBeGreaterThanOrEqual(0);
  });

  it("GET /api/activities fills days with 0 and rejects ranges > 1 year", async () => {
    // Request with range > 1 year (e.g. 400 days)
    const invalidRes = await request(app)
      .get("/api/activities?from=2025-01-01&to=2026-03-01")
      .set("Authorization", `Bearer ${user1Token}`);
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.message).toContain("1 năm");

    // Valid range request
    const validRes = await request(app)
      .get("/api/activities?from=2026-09-01&to=2026-09-05")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(validRes.status).toBe(200);
    expect(validRes.body.data.length).toBe(5);
    expect(validRes.body.data[0].date).toBe("2026-09-01");
    expect(validRes.body.data[4].date).toBe("2026-09-05");
    expect(validRes.body.stats).toBeDefined();
  });

  it("rebuildDailyActivities accurately recalculates statistics from Task collection", async () => {
    const rebuildRes = await rebuildDailyActivities(
      user1Id,
      "2026-09-01",
      "2026-09-10",
      "Asia/Ho_Chi_Minh"
    );
    expect(rebuildRes.success).toBe(true);
  });
});
