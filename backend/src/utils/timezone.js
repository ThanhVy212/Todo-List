/**
 * Convert any Date or timestamp into YYYY-MM-DD in the given timezone.
 * Uses Intl.DateTimeFormat to avoid UTC slicing bugs near midnight.
 *
 * @param {Date|string|number} date
 * @param {string} timezone - e.g. "Asia/Ho_Chi_Minh"
 * @returns {string} - "YYYY-MM-DD"
 */
export function getDateKey(date = new Date(), timezone = "Asia/Ho_Chi_Minh") {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error("Invalid date passed to getDateKey");
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(d);
}

/**
 * Get UTC Date representing the start (00:00:00.000) and end (23:59:59.999) of a local date
 * in the specified timezone.
 *
 * @param {string} dateKey - "YYYY-MM-DD"
 * @param {string} timezone - e.g. "Asia/Ho_Chi_Minh"
 * @returns {{ startOfDayUTC: Date, endOfDayUTC: Date }}
 */
export function getDateRangeInUTC(dateKey, timezone = "Asia/Ho_Chi_Minh") {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    throw new Error(`Invalid dateKey format: ${dateKey}. Expected YYYY-MM-DD.`);
  }

  const [, year, month, day] = match;
  const targetYear = parseInt(year, 10);
  const targetMonth = parseInt(month, 10);
  const targetDay = parseInt(day, 10);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  // Calculate start of day in UTC
  let utcMillis = Date.UTC(targetYear, targetMonth - 1, targetDay, 0, 0, 0, 0);
  for (let i = 0; i < 3; i++) {
    const parts = formatter.formatToParts(new Date(utcMillis));
    const partObj = {};
    for (const p of parts) {
      partObj[p.type] = p.value;
    }
    const localY = parseInt(partObj.year, 10);
    const localM = parseInt(partObj.month, 10);
    const localD = parseInt(partObj.day, 10);
    let localH = parseInt(partObj.hour, 10);
    if (localH === 24) localH = 0;
    const localMin = parseInt(partObj.minute, 10);
    const localS = parseInt(partObj.second, 10);

    const localAsUtc = Date.UTC(localY, localM - 1, localD, localH, localMin, localS);
    const targetAsUtc = Date.UTC(targetYear, targetMonth - 1, targetDay, 0, 0, 0);
    const diff = targetAsUtc - localAsUtc;
    if (diff === 0) break;
    utcMillis += diff;
  }

  const startOfDayUTC = new Date(utcMillis);
  const endOfDayUTC = new Date(startOfDayUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

  return { startOfDayUTC, endOfDayUTC };
}

/**
 * Add or subtract days from a YYYY-MM-DD dateKey
 * @param {string} dateKey - "YYYY-MM-DD"
 * @param {number} days - e.g. -1 for yesterday, 1 for tomorrow
 * @returns {string} - "YYYY-MM-DD"
 */
export function shiftDateKey(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Get all dates between fromDateKey and toDateKey inclusive
 * @param {string} fromKey - "YYYY-MM-DD"
 * @param {string} toKey - "YYYY-MM-DD"
 * @returns {string[]}
 */
export function enumerateDateKeys(fromKey, toKey) {
  const result = [];
  let current = fromKey;
  while (current <= toKey) {
    result.push(current);
    current = shiftDateKey(current, 1);
  }
  return result;
}

/**
 * Calculate difference in days between two dateKeys
 * @param {string} fromKey
 * @param {string} toKey
 * @returns {number}
 */
export function getDaysDifference(fromKey, toKey) {
  const d1 = new Date(fromKey);
  const d2 = new Date(toKey);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate activity level based on count
 * 0 task: level 0
 * 1–2 task: level 1
 * 3–4 task: level 2
 * 5–7 task: level 3
 * 8+ task: level 4
 *
 * @param {number} count
 * @returns {number} 0-4
 */
export function getActivityLevel(count) {
  if (!count || count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
}

/**
 * Calculate dominant color info for a day based on counts:
 * - Completed tasks (Green)
 * - Overdue / expired tasks (Red)
 * - Planned / To-do tasks (Light Yellow)
 * Priority order for tie-breaking: Green > Red > Yellow.
 *
 * @param {number} completedCount
 * @param {number} overdueCount
 * @param {number} todoCount
 * @returns {{ colorType: "none"|"green"|"red"|"yellow", level: number, count: number, completedCount: number, overdueCount: number, todoCount: number }}
 */
export function getDominantColorInfo(completedCount = 0, overdueCount = 0, todoCount = 0) {
  const total = (completedCount || 0) + (overdueCount || 0) + (todoCount || 0);
  if (total === 0) {
    return {
      colorType: "none",
      level: 0,
      count: 0,
      completedCount: 0,
      overdueCount: 0,
      todoCount: 0,
    };
  }

  const c = completedCount || 0;
  const o = overdueCount || 0;
  const t = todoCount || 0;

  const max = Math.max(c, o, t);

  // Priority order: Green (completed) > Red (overdue) > Yellow (todo)
  let colorType = "green";
  let count = c;

  if (c === max && c > 0) {
    colorType = "green";
    count = c;
  } else if (o === max && o > 0) {
    colorType = "red";
    count = o;
  } else if (t === max && t > 0) {
    colorType = "yellow";
    count = t;
  }

  return {
    colorType,
    level: getActivityLevel(count),
    count,
    completedCount: c,
    overdueCount: o,
    todoCount: t,
  };
}

/**
 * Calculate current streak and longest streak from completed dates
 * @param {Set<string>|Map<string, number>|Object} activeDates - dateKeys where task was completed
 * @param {string} todayKey - today's dateKey in user's timezone
 * @returns {{ currentStreak: number, longestStreak: number }}
 */
export function calculateStreaks(activeDates, todayKey) {
  const activeSet = new Set(
    activeDates instanceof Set
      ? activeDates
      : activeDates instanceof Map
      ? Array.from(activeDates.keys())
      : Object.keys(activeDates).filter((k) => activeDates[k] > 0)
  );

  if (activeSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate longest streak
  const sortedDates = Array.from(activeSet).sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDateKey = null;

  for (const dateKey of sortedDates) {
    if (!prevDateKey) {
      runningStreak = 1;
    } else {
      const expectedNext = shiftDateKey(prevDateKey, 1);
      if (dateKey === expectedNext) {
        runningStreak += 1;
      } else {
        runningStreak = 1;
      }
    }
    prevDateKey = dateKey;
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
  }

  // Calculate current streak
  let currentStreak = 0;
  let checkKey = todayKey;

  if (activeSet.has(checkKey)) {
    while (activeSet.has(checkKey)) {
      currentStreak += 1;
      checkKey = shiftDateKey(checkKey, -1);
    }
  } else {
    const yesterdayKey = shiftDateKey(todayKey, -1);
    if (activeSet.has(yesterdayKey)) {
      checkKey = yesterdayKey;
      while (activeSet.has(checkKey)) {
        currentStreak += 1;
        checkKey = shiftDateKey(checkKey, -1);
      }
    }
  }

  return { currentStreak, longestStreak };
}
