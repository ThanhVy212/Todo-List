export interface TimezoneItem {
  value: string;
  label: string;
}

export interface TimezoneDefinition {
  value: string;
  offset: string;
  labelVi: string;
  labelEn: string;
}

export const POPULAR_TIMEZONE_DEFS: TimezoneDefinition[] = [
  { value: "Asia/Ho_Chi_Minh", offset: "GMT+07:00", labelVi: "Việt Nam (Hà Nội, TP.HCM)", labelEn: "Vietnam (Hanoi, Ho Chi Minh City)" },
  { value: "Asia/Bangkok", offset: "GMT+07:00", labelVi: "Bangkok, Jakarta", labelEn: "Bangkok, Jakarta" },
  { value: "Asia/Singapore", offset: "GMT+08:00", labelVi: "Singapore, Kuala Lumpur", labelEn: "Singapore, Kuala Lumpur" },
  { value: "Asia/Hong_Kong", offset: "GMT+08:00", labelVi: "Hong Kong, Bắc Kinh", labelEn: "Hong Kong, Beijing" },
  { value: "Asia/Taipei", offset: "GMT+08:00", labelVi: "Đài Bắc (Taipei)", labelEn: "Taipei" },
  { value: "Asia/Tokyo", offset: "GMT+09:00", labelVi: "Tokyo, Osaka", labelEn: "Tokyo, Osaka" },
  { value: "Asia/Seoul", offset: "GMT+09:00", labelVi: "Seoul", labelEn: "Seoul" },
  { value: "Asia/Kolkata", offset: "GMT+05:30", labelVi: "Ấn Độ (New Delhi, Mumbai)", labelEn: "India (New Delhi, Mumbai)" },
  { value: "Asia/Dubai", offset: "GMT+04:00", labelVi: "Dubai, Abu Dhabi (UAE)", labelEn: "Dubai, Abu Dhabi (UAE)" },
  { value: "Europe/London", offset: "GMT+00:00", labelVi: "London, Dublin", labelEn: "London, Dublin" },
  { value: "Europe/Paris", offset: "GMT+01:00", labelVi: "Paris, Berlin, Rome, Madrid", labelEn: "Paris, Berlin, Rome, Madrid" },
  { value: "Europe/Moscow", offset: "GMT+03:00", labelVi: "Moscow", labelEn: "Moscow" },
  { value: "America/New_York", offset: "GMT-05:00", labelVi: "New York, Toronto (EST)", labelEn: "New York, Toronto (EST)" },
  { value: "America/Chicago", offset: "GMT-06:00", labelVi: "Chicago (CST)", labelEn: "Chicago (CST)" },
  { value: "America/Denver", offset: "GMT-07:00", labelVi: "Denver (MST)", labelEn: "Denver (MST)" },
  { value: "America/Los_Angeles", offset: "GMT-08:00", labelVi: "Los Angeles, San Francisco (PST)", labelEn: "Los Angeles, San Francisco (PST)" },
  { value: "Australia/Sydney", offset: "GMT+10:00", labelVi: "Sydney, Melbourne", labelEn: "Sydney, Melbourne" },
  { value: "Pacific/Auckland", offset: "GMT+12:00", labelVi: "Auckland, Wellington", labelEn: "Auckland, Wellington" },
  { value: "Pacific/Honolulu", offset: "GMT-10:00", labelVi: "Honolulu, Hawaii", labelEn: "Honolulu, Hawaii" },
  { value: "UTC", offset: "GMT+00:00", labelVi: "UTC (Giờ Quốc tế chuẩn)", labelEn: "UTC (Coordinated Universal Time)" },
];

/**
 * Returns popular timezone options formatted according to current language (vi / en).
 * If user's resolved local timezone is not in the predefined list,
 * it will be prepended so it is selectable.
 */
export function getPopularTimezoneOptions(userTimezone?: string, lang: string = "vi"): TimezoneItem[] {
  const isEn = lang.startsWith("en");
  const result: TimezoneItem[] = POPULAR_TIMEZONE_DEFS.map((def) => ({
    value: def.value,
    label: `(${def.offset}) ${isEn ? def.labelEn : def.labelVi}`,
  }));

  if (userTimezone && !result.some((t) => t.value === userTimezone)) {
    const yourTzLabel = isEn ? "Your detected timezone" : "Múi giờ của bạn";
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: userTimezone,
        timeZoneName: "longOffset",
      }).formatToParts(new Date());
      const offset = parts.find((p) => p.type === "timeZoneName")?.value || "GMT";
      result.unshift({
        value: userTimezone,
        label: `(${offset}) ${userTimezone} (${yourTzLabel})`,
      });
    } catch {
      result.unshift({
        value: userTimezone,
        label: `${userTimezone} (${yourTzLabel})`,
      });
    }
  }

  return result;
}
