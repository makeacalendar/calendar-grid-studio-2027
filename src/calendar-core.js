export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const COMMON_MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function assertYear(year) {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new RangeError("Year must be an integer from 1 to 9999.");
  }
}

function assertMonth(month) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError("Month must be an integer from 1 to 12.");
  }
}

export function isLeapYear(year) {
  assertYear(year);
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year, month) {
  assertYear(year);
  assertMonth(month);
  if (month === 2 && isLeapYear(year)) return 29;
  return COMMON_MONTH_LENGTHS[month - 1];
}

export function weekday(year, month, day) {
  assertYear(year);
  assertMonth(month);
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError("Day is outside the selected month.");
  }
  const previousYear = year - 1;
  const daysBeforeYear = 365 * previousYear
    + Math.floor(previousYear / 4)
    - Math.floor(previousYear / 100)
    + Math.floor(previousYear / 400);
  let daysBeforeMonth = 0;
  for (let currentMonth = 1; currentMonth < month; currentMonth += 1) {
    daysBeforeMonth += daysInMonth(year, currentMonth);
  }
  // 0001-01-01 was a Monday; the public convention is Sunday = 0.
  return (daysBeforeYear + daysBeforeMonth + day) % 7;
}

export function isoWeekday(year, month, day) {
  const sundayFirst = weekday(year, month, day);
  return sundayFirst === 0 ? 7 : sundayFirst;
}

export function dayOfYear(year, month, day) {
  assertYear(year);
  assertMonth(month);
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError("Day is outside the selected month.");
  }
  let ordinal = day;
  for (let currentMonth = 1; currentMonth < month; currentMonth += 1) {
    ordinal += daysInMonth(year, currentMonth);
  }
  return ordinal;
}

export function isoWeeksInYear(year) {
  assertYear(year);
  const jan1 = weekday(year, 1, 1);
  return jan1 === 4 || (jan1 === 3 && isLeapYear(year)) ? 53 : 52;
}

export function isoWeek(year, month, day) {
  const ordinal = dayOfYear(year, month, day);
  const isoDay = isoWeekday(year, month, day);
  let week = Math.floor((ordinal - isoDay + 10) / 7);
  let weekYear = year;
  if (week < 1) {
    weekYear -= 1;
    week = isoWeeksInYear(weekYear);
  } else if (week > isoWeeksInYear(year)) {
    weekYear += 1;
    week = 1;
  }
  return { week, weekYear };
}

export function monthGrid(year, month, options = {}) {
  assertYear(year);
  assertMonth(month);
  const weekStart = options.weekStart ?? 0;
  if (weekStart !== 0 && weekStart !== 1) {
    throw new RangeError("Week start must be 0 (Sunday) or 1 (Monday).");
  }
  const fixedRows = Boolean(options.fixedRows);
  const monthLength = daysInMonth(year, month);
  const firstOffset = (weekday(year, month, 1) - weekStart + 7) % 7;
  const rowCount = fixedRows ? 6 : Math.ceil((firstOffset + monthLength) / 7);
  return Array.from({ length: rowCount }, (_, row) => Array.from({ length: 7 }, (_, column) => {
    const dateNumber = row * 7 + column - firstOffset + 1;
    if (dateNumber < 1 || dateNumber > monthLength) return null;
    return {
      year,
      month,
      day: dateNumber,
      weekday: weekday(year, month, dateNumber),
      iso: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(dateNumber).padStart(2, "0")}`,
      isoWeek: isoWeek(year, month, dateNumber),
    };
  }));
}

export function monthFacts(year, month, weekStart = 1) {
  assertYear(year);
  assertMonth(month);
  if (weekStart !== 0 && weekStart !== 1) {
    throw new RangeError("Week start must be 0 (Sunday) or 1 (Monday).");
  }
  const lastDay = daysInMonth(year, month);
  return {
    year,
    month,
    monthName: MONTHS[month - 1],
    days: lastDay,
    firstWeekday: weekday(year, month, 1),
    lastWeekday: weekday(year, month, lastDay),
    leapYear: isLeapYear(year),
    variableRows: monthGrid(year, month, { weekStart }).length,
    fixedRows: 6,
    firstISOWeek: isoWeek(year, month, 1),
    lastISOWeek: isoWeek(year, month, lastDay),
  };
}

export function parseISODate(input) {
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return { valid: false, reason: "Enter a date in YYYY-MM-DD format." };
  }
  const [year, month, day] = input.split("-").map(Number);
  if (year < 1 || year > 9999) return { valid: false, reason: "Year must be from 0001 to 9999." };
  if (month < 1 || month > 12) return { valid: false, reason: "Month must be from 01 to 12." };
  const limit = daysInMonth(year, month);
  if (day < 1 || day > limit) {
    return { valid: false, reason: `${MONTHS[month - 1]} ${year} has ${limit} days.` };
  }
  const weekdayIndex = weekday(year, month, day);
  return {
    valid: true,
    year,
    month,
    day,
    weekday: weekdayIndex,
    weekdayName: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekdayIndex],
    isoWeek: isoWeek(year, month, day),
  };
}

export function monthDates(year, month) {
  assertYear(year);
  assertMonth(month);
  return Array.from({ length: daysInMonth(year, month) }, (_, index) => {
    const day = index + 1;
    const week = isoWeek(year, month, day);
    const dayOfWeek = weekday(year, month, day);
    return {
      date: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      year,
      month,
      day,
      weekday: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek],
      weekdayIndex: dayOfWeek,
      isoWeek: week.week,
      isoWeekYear: week.weekYear,
      weekend: dayOfWeek === 0 || dayOfWeek === 6,
    };
  });
}

function csvEscape(value) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCSV(year, month) {
  const rows = [
    ["date", "year", "month", "day", "weekday", "iso_week", "iso_week_year", "weekend"],
    ...monthDates(year, month).map((item) => [
      item.date, item.year, item.month, item.day, item.weekday,
      item.isoWeek, item.isoWeekYear, item.weekend,
    ]),
  ];
  return `${rows.map((row) => row.map(csvEscape).join(",")).join("\r\n")}\r\n`;
}

export function toJSON(year, month) {
  return JSON.stringify({
    year,
    month,
    monthName: MONTHS[month - 1],
    calendar: "proleptic Gregorian",
    dates: monthDates(year, month),
  }, null, 2);
}
