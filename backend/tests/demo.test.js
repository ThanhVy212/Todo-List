import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../src/server.js";
import User from "../src/models/User.js";
import Task from "../src/models/Task.js";
import DailyActivity from "../src/models/DailyActivity.js";

dotenv.config();

describe("Demo Session - Isolated Guest Sandbox", () => {
  let demoToken1, demoId1;
  let demoToken2, demoId2;
  let permanentToken, permanentId;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_CONNECTIONSTRING;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    if (demoId1) {
      await Task.deleteMany({ userId: demoId1 });
      await DailyActivity.deleteMany({ userId: demoId1 });
      await User.deleteOne({ _id: demoId1 });
    }
    if (demoId2) {
      await Task.deleteMany({ userId: demoId2 });
      await DailyActivity.deleteMany({ userId: demoId2 });
      await User.deleteOne({ _id: demoId2 });
    }
    if (permanentId) {
      await Task.deleteMany({ userId: permanentId });
      await DailyActivity.deleteMany({ userId: permanentId });
      await User.deleteOne({ _id: permanentId });
    }
    await mongoose.disconnect();
  });

  describe("1. Isolated demo sessions", () => {
    it("creates an isolated demo user with isDemo flag and sample tasks", async () => {
      const res = await request(app).post("/api/auth/demo-login");
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.isDemo).toBe(true);
      expect(res.body.user.demoExpiresAt).toBeUndefined();

      demoToken1 = res.body.token;
      demoId1 = res.body.user._id;

      const user = await User.findById(demoId1);
      expect(user.isDemo).toBe(true);
      expect(user.demoExpiresAt).toBeInstanceOf(Date);
      expect(user.passwordHash).toBeNull();
    });

    it("creates an empty task list for a fresh demo session", async () => {
      const res = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${demoToken1}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it("tasks created by demo users have isDemo and demoExpiresAt", async () => {
      const createRes = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${demoToken1}`)
        .send({ title: "Demo Task", scheduledDate: "2026-09-10" });
      expect(createRes.status).toBe(201);
      const taskInDb = await Task.findById(createRes.body.data._id);
      expect(taskInDb.isDemo).toBe(true);
      expect(taskInDb.demoExpiresAt).toBeInstanceOf(Date);
    });

    it("creates a second isolated demo user with separate data", async () => {
      const res = await request(app).post("/api/auth/demo-login");
      expect(res.status).toBe(201);

      demoToken2 = res.body.token;
      demoId2 = res.body.user._id;

      expect(demoId2).not.toBe(demoId1);
    });

    it("prevents demo user 2 from seeing demo user 1 tasks", async () => {
      const res = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${demoToken2}`);
      expect(res.status).toBe(200);
      const tasks = res.body.data;
      for (const t of tasks) {
        expect(t.userId).toBe(demoId2);
      }
    });

    it("prevents demo user 2 from accessing demo user 1 tasks by ID", async () => {
      const user1Tasks = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${demoToken1}`);
      if (user1Tasks.body.data.length > 0) {
        const taskId = user1Tasks.body.data[0]._id;
        const res = await request(app)
          .get(`/api/tasks/${taskId}`)
          .set("Authorization", `Bearer ${demoToken2}`);
        expect(res.status).toBe(404);
      }
    });
  });

  describe("2. Manual demo cleanup", () => {
    it("deletes all demo data on cleanup", async () => {
      const res = await request(app)
        .post("/api/auth/demo-cleanup")
        .set("Authorization", `Bearer ${demoToken2}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain("success");

      const user = await User.findById(demoId2);
      expect(user).toBeNull();

      const tasks = await Task.find({ userId: demoId2 });
      expect(tasks.length).toBe(0);

      const activities = await DailyActivity.find({ userId: demoId2 });
      expect(activities.length).toBe(0);
    });

    it("is idempotent — repeated cleanup does not crash the server", async () => {
      const res = await request(app)
        .post("/api/auth/demo-cleanup")
        .set("Authorization", `Bearer ${demoToken2}`);
      // After user deletion, auth middleware returns 401 (user not found)
      expect(res.status).toBe(401);
    });
  });

  describe("3. Protection of permanent users", () => {
    it("registers a permanent user", async () => {
      const email = `perm_user_${Date.now()}@example.com`;
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          fullName: "Permanent User",
          email,
          password: "password123",
        });
      expect(res.status).toBe(201);
      permanentToken = res.body.token;
      permanentId = res.body.user._id;
    });

    it("rejects cleanup for non-demo users", async () => {
      const res = await request(app)
        .post("/api/auth/demo-cleanup")
        .set("Authorization", `Bearer ${permanentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toContain("only for demo accounts");

      const user = await User.findById(permanentId);
      expect(user).not.toBeNull();
    });
  });

  describe("4. Unauthorized cleanup attempts", () => {
    it("rejects cleanup without a token", async () => {
      const res = await request(app).post("/api/auth/demo-cleanup");
      expect(res.status).toBe(401);
    });

    it("rejects cleanup with an invalid token", async () => {
      const res = await request(app)
        .post("/api/auth/demo-cleanup")
        .set("Authorization", "Bearer invalid_token_here");
      expect(res.status).toBe(401);
    });
  });

  describe("5. Demo user cannot mutate permanent user data", () => {
    let demoToken3, demoId3, permTaskId;

    beforeAll(async () => {
      const demoRes = await request(app).post("/api/auth/demo-login");
      demoToken3 = demoRes.body.token;
      demoId3 = demoRes.body.user._id;

      const taskRes = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${permanentToken}`)
        .send({ title: "Permanent Task", scheduledDate: "2026-09-10" });
      permTaskId = taskRes.body.data._id;
    });

    afterAll(async () => {
      if (demoId3) {
        await request(app)
          .post("/api/auth/demo-cleanup")
          .set("Authorization", `Bearer ${demoToken3}`);
      }
    });

    it("demo user cannot read a permanent user task by ID", async () => {
      const res = await request(app)
        .get(`/api/tasks/${permTaskId}`)
        .set("Authorization", `Bearer ${demoToken3}`);
      expect(res.status).toBe(404);
    });

    it("demo user cannot update a permanent user task", async () => {
      const res = await request(app)
        .put(`/api/tasks/${permTaskId}`)
        .set("Authorization", `Bearer ${demoToken3}`)
        .send({ title: "Hacked" });
      expect(res.status).toBe(404);
    });

    it("demo user cannot delete a permanent user task", async () => {
      const res = await request(app)
        .delete(`/api/tasks/${permTaskId}`)
        .set("Authorization", `Bearer ${demoToken3}`);
      expect(res.status).toBe(404);
    });
  });
});
