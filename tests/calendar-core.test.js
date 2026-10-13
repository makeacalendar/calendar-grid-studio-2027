import test from "node:test";
import assert from "node:assert/strict";
import {
  daysInMonth,
  isLeapYear,
  isoWeek,
  isoWeeksInYear,
  monthDates,
  monthFacts,
  monthGrid,
  parseISODate,
  toCSV,
  toJSON,
  weekday,
} from "../src/calendar-core.js";

test("Gregorian leap years handle divisible-by-four, century and 400-year rules", () => {
  for (const year of [2000, 2024, 2400]) assert.equal(isLeapYear(year), true, `${year} should be a leap year`);
  for (const year of [1900, 2100, 2023, 2027]) assert.equal(isLeapYear(year), false, `${year} should not be a leap year`);
});

test("month lengths include leap February and validate boundaries", () => {
  assert.equal(daysInMonth(2000, 2), 29);
  assert.equal(daysInMonth(1900, 2), 28);
  assert.equal(daysInMonth(2024, 2), 29);
  assert.equal(daysInMonth(2100, 2), 28);
  assert.equal(daysInMonth(2027, 1), 31);
  assert.equal(daysInMonth(2027, 4), 30);
  assert.throws(() => daysInMonth(2027, 0), RangeError);
  assert.throws(() => daysInMonth(0, 1), RangeError);
});

test("weekday calculation matches known Gregorian dates without Date objects", () => {
  assert.equal(weekday(1, 1, 1), 1); // Monday
  assert.equal(weekday(1900, 1, 1), 1);
  assert.equal(weekday(2000, 1, 1), 6); // Saturday
  assert.equal(weekday(2024, 2, 29), 4); // Thursday
  assert.equal(weekday(2027, 1, 1), 5); // Friday
  assert.equal(weekday(2027, 12, 31), 5); // Friday
  assert.equal(weekday(2100, 1, 1), 5); // Friday
  assert.throws(() => weekday(2027, 2, 29), RangeError);
});

test("2027 month grids align correctly for Monday and Sunday starts", () => {
  const januaryMonday = monthGrid(2027, 1, { weekStart: 1 });
  const januarySunday = monthGrid(2027, 1, { weekStart: 0 });
  assert.equal(januaryMonday.length, 5);
  assert.equal(januarySunday.length, 6);
  assert.equal(januaryMonday[0][4].iso, "2027-01-01");
  assert.equal(januarySunday[0][5].iso, "2027-01-01");
  assert.equal(januaryMonday.flat().filter(Boolean).length, 31);
  assert.equal(monthGrid(2027, 2, { weekStart: 1 }).length, 4);
  assert.equal(monthGrid(2027, 2, { weekStart: 0 }).length, 5);
  assert.equal(monthGrid(2027, 5, { weekStart: 1 }).length, 6);
  assert.equal(monthGrid(2027, 5, { weekStart: 1, fixedRows: true }).length, 6);
  assert.equal(monthGrid(2027, 2, { weekStart: 1, fixedRows: true }).length, 6);
  assert.throws(() => monthGrid(2027, 1, { weekStart: 2 }), RangeError);
});

test("all 2027 atlas months contain every Gregorian date exactly once", () => {
  let totalDays = 0;
  for (let month = 1; month <= 12; month += 1) {
    const dates = monthDates(2027, month);
    assert.equal(dates.length, daysInMonth(2027, month));
    assert.equal(dates[0].date, `2027-${String(month).padStart(2, "0")}-01`);
    assert.equal(dates.at(-1).day, daysInMonth(2027, month));
    totalDays += dates.length;
  }
  assert.equal(totalDays, 365);
});

test("ISO weeks preserve week-year boundaries", () => {
  assert.deepEqual(isoWeek(2021, 1, 1), { week: 53, weekYear: 2020 });
  assert.deepEqual(isoWeek(2021, 1, 4), { week: 1, weekYear: 2021 });
  assert.deepEqual(isoWeek(2027, 1, 1), { week: 53, weekYear: 2026 });
  assert.deepEqual(isoWeek(2027, 12, 31), { week: 52, weekYear: 2027 });
  assert.equal(isoWeeksInYear(2020), 53);
  assert.equal(isoWeeksInYear(2021), 52);
});

test("month facts describe first, last, length, rows and ISO week span", () => {
  const facts = monthFacts(2027, 1, 1);
  assert.equal(facts.days, 31);
  assert.equal(facts.firstWeekday, 5);
  assert.equal(facts.lastWeekday, 0);
  assert.equal(facts.variableRows, 5);
  assert.equal(facts.fixedRows, 6);
  assert.deepEqual(facts.firstISOWeek, { week: 53, weekYear: 2026 });
});

test("date verification accepts valid dates and explains invalid input", () => {
  assert.deepEqual(parseISODate("2024-02-29").weekdayName, "Thursday");
  assert.equal(parseISODate("2024-02-29").isoWeek.weekYear, 2024);
  assert.equal(parseISODate("1900-02-29").valid, false);
  assert.equal(parseISODate("2100-02-29").valid, false);
  assert.equal(parseISODate("2027-13-01").valid, false);
  assert.equal(parseISODate("2027-01-00").valid, false);
  assert.equal(parseISODate("27-01-01").valid, false);
  assert.equal(parseISODate("0000-01-01").valid, false);
});

test("CSV and JSON exports contain one valid record for each date", () => {
  const csv = toCSV(2027, 1).trimEnd().split("\r\n");
  assert.equal(csv.length, 32);
  assert.equal(csv[0], "date,year,month,day,weekday,iso_week,iso_week_year,weekend");
  assert.equal(csv[1], "2027-01-01,2027,1,1,Friday,53,2026,false");
  assert.equal(csv.at(-1), "2027-01-31,2027,1,31,Sunday,4,2027,true");
  const json = JSON.parse(toJSON(2027, 2));
  assert.equal(json.monthName, "February");
  assert.equal(json.dates.length, 28);
  assert.equal(json.dates[0].date, "2027-02-01");
  assert.equal(json.dates.at(-1).date, "2027-02-28");
});
