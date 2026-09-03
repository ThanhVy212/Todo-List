import mongoose from "mongoose";
import DailyActivity from "../models/DailyActivity.js";
import Task from "../models/Task.js";
import { getDateKey, enumerateDateKeys } from "../utils/timezone.js";

/**
 * Helper to update DailyActivity counter safely (non-negative)
 * @param {mongoose.Types.ObjectId|string} userId
 * @param {string} dateKey - "YYYY-MM-DD"
 * @param {object} incFields - e.g. { completedCount: 1, activityCount: 1 }
 * @param {mongoose.ClientSession} [session]
 * @param {object} [demoMeta] - { isDemo, demoExpiresAt } for demo user upserts
 */
export async function adjustDailyActivity(userId, dateKey, incFields, session = null, demoMeta = null) {
  if (!userId || !dateKey || !incFields || Object.keys(incFields).length === 0) {
    return;
  }

  const setOnInsert = {};
  if (demoMeta) {
    if (demoMeta.isDemo) setOnInsert.isDemo = true;
    if (demoMeta.demoExpiresAt) setOnInsert.demoExpiresAt = demoMeta.demoExpiresAt;
  }

  const update = { $inc: incFields };
  if (Object.keys(setOnInsert).length > 0) {
    update.$setOnInsert = setOnInsert;
  }

  const options = { upsert: true, returnDocument: "after", setDefaultsOnInsert: true };
  if (session) options.session = session;

  const doc = await DailyActivity.findOneAndUpdate(
    { userId, dateKey },
    update,
    options
  );

  // If any field dropped below 0, fix it atomically
  const fixes = {};
  if (doc.completedCount < 0) fixes.completedCount = 0;
  if (doc.activityCount < 0) fixes.activityCount = 0;
  if (doc.scheduledCount < 0) fixes.scheduledCount = 0;
  if (doc.createdCount < 0) fixes.createdCount = 0;
  if (doc.focusMinutes < 0) fixes.focusMinutes = 0;

  if (Object.keys(fixes).length > 0) {
    await DailyActivity.updateOne(
      { _id: doc._id },
      { $set: fixes },
      session ? { session } : {}
    );
  }

  return doc;
}

/**
 * Handle sync when task is created
 * @param {object} task
 * @param {string} userTimezone
 * @param {mongoose.ClientSession} [session]
 */
export async function syncTaskCreated(task, userTimezone, session = null) {
  const createdDateKey = getDateKey(task.createdAt || new Date(), userTimezone);
  const scheduledDateKey = getDateKey(task.scheduledDate, userTimezone);
  const demoMeta = task.isDemo ? { isDemo: true, demoExpiresAt: task.demoExpiresAt } : null;

  if (createdDateKey === scheduledDateKey) {
    await adjustDailyActivity(
      task.userId,
      createdDateKey,
      { createdCount: 1, scheduledCount: 1 },
      session,
      demoMeta
    );
  } else {
    await adjustDailyActivity(task.userId, createdDateKey, { createdCount: 1 }, session, demoMeta);
    await adjustDailyActivity(task.userId, scheduledDateKey, { scheduledCount: 1 }, session, demoMeta);
  }

  // If created already as completed
  if (task.status === "completed" && task.completedAt) {
    const completedDateKey = getDateKey(task.completedAt, userTimezone);
    await adjustDailyActivity(
      task.userId,
      completedDateKey,
      { completedCount: 1, activityCount: 1 },
      session,
      demoMeta
    );
  }
}

/**
 * Handle sync when task status / dates change
 * @param {object} oldTask
 * @param {object} updatedTask
 * @param {string} userTimezone
 * @param {mongoose.ClientSession} [session]
 */
export async function syncTaskUpdated(oldTask, updatedTask, userTimezone, session = null) {
  const userId = oldTask.userId;
  const demoMeta = updatedTask.isDemo ? { isDemo: true, demoExpiresAt: updatedTask.demoExpiresAt } : null;

  // 1. Scheduled date changed (and not deleted)
  if (!oldTask.isDeleted && !updatedTask.isDeleted) {
    const oldSchedKey = getDateKey(oldTask.scheduledDate, userTimezone);
    const newSchedKey = getDateKey(updatedTask.scheduledDate, userTimezone);
    if (oldSchedKey !== newSchedKey) {
      await adjustDailyActivity(userId, oldSchedKey, { scheduledCount: -1 }, session, demoMeta);
      await adjustDailyActivity(userId, newSchedKey, { scheduledCount: 1 }, session, demoMeta);
    }
  }

  // 2. Completion status changed
  const wasCompleted = oldTask.status === "completed" && !!oldTask.completedAt;
  const isCompleted = updatedTask.status === "completed" && !!updatedTask.completedAt;

  if (!wasCompleted && isCompleted) {
    // Newly completed
    const completedDateKey = getDateKey(updatedTask.completedAt, userTimezone);
    await adjustDailyActivity(
      userId,
      completedDateKey,
      { completedCount: 1, activityCount: 1 },
      session,
      demoMeta
    );
  } else if (wasCompleted && !isCompleted) {
    // Uncompleted
    const completedDateKey = getDateKey(oldTask.completedAt, userTimezone);
    await adjustDailyActivity(
      userId,
      completedDateKey,
      { completedCount: -1, activityCount: -1 },
      session,
      demoMeta
    );
  } else if (wasCompleted && isCompleted) {
    // Completed date changed
    const oldCompKey = getDateKey(oldTask.completedAt, userTimezone);
    const newCompKey = getDateKey(updatedTask.completedAt, userTimezone);
    if (oldCompKey !== newCompKey) {
      await adjustDailyActivity(
        userId,
        oldCompKey,
        { completedCount: -1, activityCount: -1 },
        session,
        demoMeta
      );
      await adjustDailyActivity(
        userId,
        newCompKey,
        { completedCount: 1, activityCount: 1 },
        session,
        demoMeta
      );
    }
  }
}

/**
 * Handle sync when task is soft deleted
 * @param {object} task
 * @param {string} userTimezone
 * @param {mongoose.ClientSession} [session]
 */
export async function syncTaskDeleted(task, userTimezone, session = null) {
  const userId = task.userId;
  const demoMeta = task.isDemo ? { isDemo: true, demoExpiresAt: task.demoExpiresAt } : null;
  const schedKey = getDateKey(task.scheduledDate, userTimezone);
  await adjustDailyActivity(userId, schedKey, { scheduledCount: -1 }, session, demoMeta);

  if (task.status === "completed" && task.completedAt) {
    const compKey = getDateKey(task.completedAt, userTimezone);
    await adjustDailyActivity(
      userId,
      compKey,
      { completedCount: -1, activityCount: -1 },
      session,
      demoMeta
    );
  }
}

/**
 * Handle sync when task is restored
 * @param {object} task
 * @param {string} userTimezone
 * @param {mongoose.ClientSession} [session]
 */
export async function syncTaskRestored(task, userTimezone, session = null) {
  const userId = task.userId;
  const demoMeta = task.isDemo ? { isDemo: true, demoExpiresAt: task.demoExpiresAt } : null;
  const schedKey = getDateKey(task.scheduledDate, userTimezone);
  await adjustDailyActivity(userId, schedKey, { scheduledCount: 1 }, session, demoMeta);

  if (task.status === "completed" && task.completedAt) {
    const compKey = getDateKey(task.completedAt, userTimezone);
    await adjustDailyActivity(
      userId,
      compKey,
      { completedCount: 1, activityCount: 1 },
      session,
      demoMeta
    );
  }
}

/**
 * Rebuild daily activities from source-of-truth Task collection
 * @param {mongoose.Types.ObjectId|string} userId
 * @param {string} [fromDate] - optional "YYYY-MM-DD"
 * @param {string} [toDate] - optional "YYYY-MM-DD"
 * @param {string} [userTimezone] - default "Asia/Ho_Chi_Minh"
 */
export async function rebuildDailyActivities(
  userId,
  fromDate = null,
  toDate = null,
  userTimezone = "Asia/Ho_Chi_Minh"
) {
  // Find all non-deleted tasks of this user
  const tasks = await Task.find({ userId, isDeleted: false });

  // Compute map of counts per dateKey
  const activityMap = new Map();

  function getEntry(dateKey) {
    if (!activityMap.has(dateKey)) {
      activityMap.set(dateKey, {
        userId,
        dateKey,
        scheduledCount: 0,
        createdCount: 0,
        completedCount: 0,
        activityCount: 0,
        focusMinutes: 0,
      });
    }
    return activityMap.get(dateKey);
  }

  for (const task of tasks) {
    // Created count
    const createdKey = getDateKey(task.createdAt, userTimezone);
    getEntry(createdKey).createdCount += 1;

    // Scheduled count
    const schedKey = getDateKey(task.scheduledDate, userTimezone);
    getEntry(schedKey).scheduledCount += 1;

    // Completed count
    if (task.status === "completed" && task.completedAt) {
      const compKey = getDateKey(task.completedAt, userTimezone);
      const entry = getEntry(compKey);
      entry.completedCount += 1;
      entry.activityCount += 1;
    }
  }

  // If range specified, filter or enumerate
  if (fromDate && toDate) {
    const rangeKeys = enumerateDateKeys(fromDate, toDate);
    // Delete existing records in this range for clean rebuild
    await DailyActivity.deleteMany({
      userId,
      dateKey: { $gte: fromDate, $lte: toDate },
    });

    const bulkOps = [];
    for (const dKey of rangeKeys) {
      const data = activityMap.get(dKey) || {
        userId,
        dateKey: dKey,
        scheduledCount: 0,
        createdCount: 0,
        completedCount: 0,
        activityCount: 0,
        focusMinutes: 0,
      };

      bulkOps.push({
        updateOne: {
          filter: { userId, dateKey: dKey },
          update: { $set: data },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      await DailyActivity.bulkWrite(bulkOps);
    }
  } else {
    // Full rebuild for all active dates of this user
    await DailyActivity.deleteMany({ userId });

    const bulkOps = [];
    for (const [dKey, data] of activityMap.entries()) {
      bulkOps.push({
        updateOne: {
          filter: { userId, dateKey: dKey },
          update: { $set: data },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      await DailyActivity.bulkWrite(bulkOps);
    }
  }

  return { success: true, rebuiltDatesCount: activityMap.size };
}
