import {
  MONTHS,
  daysInMonth,
  isLeapYear,
  isoWeek,
  monthDates,
  monthFacts,
  monthGrid,
  parseISODate,
  toCSV,
  toJSON,
  weekday,
} from "./calendar-core.js";

const $ = (selector) => document.querySelector(selector);
const ui = {
  month: $("#month-input"), year: $("#year-input"), weekStart: $("#week-start"), fixedRows: $("#fixed-rows"),
  paper: $("#paper-size"), orientation: $("#orientation"), margin: $("#margin-size"), guides: $("#show-guides"),
  theme: $("#theme-select"), typeSize: $("#type-size"), cellGap: $("#cell-gap"), gridWeight: $("#grid-weight"),
  dayAlign: $("#day-align"), headerText: $("#header-text"), includeHeader: $("#include-header"),
  footerText: $("#footer-text"), includeFooter: $("#include-footer"), weekends: $("#weekend-highlight"),
  paperNode: $("#calendar-paper"), grid: $("#calendar-grid"), monthTitle: $("#paper-month-title"),
  paperYear: $("#paper-year"), paperSubtitle: $("#paper-subtitle"), paperHeader: $("#paper-header"),
  paperFooter: $("#paper-footer"), previewMeta: $("#preview-meta"), proofMeasure: $("#proof-measure"),
  overflowStatus: $("#overflow-status"), toast: $("#toast"),
};

const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdayLong = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const defaultState = {
  year: 2027, month: 1, weekStart: 1, fixedRows: false, paper: "a4", orientation: "portrait", margin: 12,
  guides: true, theme: "midnight", typeSize: 18, cellGap: 5, gridWeight: 1, dayAlign: "start",
  headerText: "Calendar Grid Studio", includeHeader: true, footerText: "Designed for the page · 2027",
  includeFooter: true, weekends: true,
};
const monthNames = MONTHS;
let currentState = { ...defaultState };
let toastTimer;

function populateMonthSelect(select) {
  select.innerHTML = monthNames.map((name, index) => `<option value="${index + 1}">${name}</option>`).join("");
}

function selectControls(state) {
  ui.year.value = state.year;
  ui.month.value = state.month;
  ui.weekStart.value = state.weekStart;
  ui.fixedRows.checked = state.fixedRows;
  ui.paper.value = state.paper;
  ui.orientation.value = state.orientation;
  ui.margin.value = state.margin;
  ui.guides.checked = state.guides;
  ui.theme.value = state.theme;
  ui.typeSize.value = state.typeSize;
  ui.cellGap.value = state.cellGap;
  ui.gridWeight.value = state.gridWeight;
  ui.dayAlign.value = state.dayAlign;
  ui.headerText.value = state.headerText;
  ui.includeHeader.checked = state.includeHeader;
  ui.footerText.value = state.footerText;
  ui.includeFooter.checked = state.includeFooter;
  ui.weekends.checked = state.weekends;
}

function readState() {
  const year = Number(ui.year.value);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    ui.overflowStatus.textContent = "Choose a whole year from 1900 to 2100.";
    ui.overflowStatus.parentElement.classList.add("is-warning");
    return null;
  }
  ui.overflowStatus.parentElement.classList.remove("is-warning");
  return {
    year,
    month: Number(ui.month.value),
    weekStart: Number(ui.weekStart.value),
    fixedRows: ui.fixedRows.checked,
    paper: ui.paper.value,
    orientation: ui.orientation.value,
    margin: Number(ui.margin.value),
    guides: ui.guides.checked,
    theme: ui.theme.value,
    typeSize: Number(ui.typeSize.value),
    cellGap: Number(ui.cellGap.value),
    gridWeight: Number(ui.gridWeight.value),
    dayAlign: ui.dayAlign.value,
    headerText: ui.headerText.value.trim(),
    includeHeader: ui.includeHeader.checked,
    footerText: ui.footerText.value.trim(),
    includeFooter: ui.includeFooter.checked,
    weekends: ui.weekends.checked,
  };
}

function renderCalendarGrid(state) {
  const grid = monthGrid(state.year, state.month, { weekStart: state.weekStart, fixedRows: state.fixedRows });
  const rowCount = grid.length;
  const headings = Array.from({ length: 7 }, (_, column) => {
    const dayIndex = (state.weekStart + column) % 7;
    return `<div class="calendar-weekday" role="columnheader" aria-label="${weekdayLong[dayIndex]}">${weekdayShort[dayIndex]}</div>`;
  }).join("");
  const cells = grid.flatMap((row, rowIndex) => row.map((date) => {
    if (!date) return `<div class="calendar-empty" role="gridcell" aria-hidden="true"></div>`;
    const isWeekend = date.weekday === 0 || date.weekday === 6;
    const weekTag = date.day === 1 || rowIndex > 0 && row[(date.weekday - state.weekStart + 7) % 7 - 1] === null
      ? `<small class="week-number" aria-label="ISO week ${date.isoWeek.week}">W${String(date.isoWeek.week).padStart(2, "0")}</small>` : "";
    return `<div class="calendar-date${isWeekend ? " is-weekend" : ""}" role="gridcell" aria-label="${weekdayLong[date.weekday]}, ${monthNames[date.month - 1]} ${date.day}, ${date.year}; ISO week ${date.isoWeek.week}" tabindex="0"><span class="date-number">${date.day}</span>${weekTag}</div>`;
  })).join("");
  ui.grid.innerHTML = headings + cells;
  ui.grid.dataset.rows = String(rowCount);
  ui.grid.setAttribute("aria-label", `${monthNames[state.month - 1]} ${state.year} calendar, ${rowCount} rows, ${state.weekStart === 1 ? "Monday" : "Sunday"}-first`);
  return rowCount;
}

function renderCalendar(state) {
  currentState = state;
  const rowCount = renderCalendarGrid(state);
  const monthName = monthNames[state.month - 1];
  ui.monthTitle.innerHTML = `${monthName} <span>${state.year}</span>`;
  ui.paperYear.textContent = String(state.year);
  $("#paper-header-title").textContent = state.headerText || "Calendar Grid Studio";
  $("#paper-footer-text").textContent = state.footerText || "";
  ui.paperSubtitle.textContent = `${state.fixedRows ? "Six-row" : `${rowCount}-row`} ${state.weekStart === 1 ? "Monday" : "Sunday"}-first calendar.`;
  ui.paperNode.className = `paper theme-${state.theme}${state.orientation === "landscape" ? " is-landscape" : ""}${state.guides ? " guides-on" : ""}${state.weekends ? " weekends-on" : ""}`;
  ui.paperHeader.hidden = !state.includeHeader;
  ui.paperFooter.hidden = !state.includeFooter;
  $("#paper-footer .footer-mark").innerHTML = `CGS <i>·</i> ${String(state.month).padStart(2, "0")}`;
  const [widthMm, heightMm] = state.paper === "a4" ? [210, 297] : [215.9, 279.4];
  const pageWidth = state.orientation === "landscape" ? heightMm : widthMm;
  const pageHeight = state.orientation === "landscape" ? widthMm : heightMm;
  ui.paperNode.style.setProperty("--type-size", `${state.typeSize}px`);
  ui.paperNode.style.setProperty("--cell-gap", `${state.cellGap}px`);
  ui.paperNode.style.setProperty("--rule-weight", `${state.gridWeight}px`);
  ui.paperNode.style.setProperty("--date-align", state.dayAlign === "center" ? "center" : "left");
  ui.paperNode.style.setProperty("--date-items", state.dayAlign === "center" ? "center" : "flex-start");
  ui.paperNode.style.setProperty("--margin-inset", `${(state.margin / pageHeight) * 100}% ${(state.margin / pageWidth) * 100}%`);
  ui.paperNode.style.setProperty("--print-width", `${pageWidth}mm`);
  ui.paperNode.style.setProperty("--print-height", `${pageHeight}mm`);
  ui.paperNode.style.setProperty("--print-margin", `${state.margin}mm`);
  const paperName = state.paper === "a4" ? "A4" : "US LETTER";
  ui.previewMeta.textContent = `${paperName} · ${state.orientation.toUpperCase()} · ${rowCount} ROWS`;
  ui.proofMeasure.textContent = state.paper === "a4" ? "A4 / 210 × 297 mm" : "US Letter / 8.5 × 11 in";
  $("#margin-output").textContent = `${state.margin} mm`;
  $("#type-output").textContent = `${state.typeSize} px`;
  const printStyle = $("#dynamic-page-style") || document.head.appendChild(Object.assign(document.createElement("style"), { id: "dynamic-page-style" }));
  printStyle.textContent = `@page { size: ${paperName === "A4" ? "A4" : "letter"} ${state.orientation}; margin: 0; }`;
  requestAnimationFrame(checkOverflow);
}

function checkOverflow() {
  const hasOverflow = ui.grid.scrollHeight > ui.grid.clientHeight + 3 || ui.grid.scrollWidth > ui.grid.clientWidth + 3;
  ui.paperNode.classList.toggle("has-overflow", hasOverflow);
  ui.overflowStatus.parentElement.classList.toggle("is-warning", hasOverflow);
  ui.overflowStatus.textContent = hasOverflow
    ? "Grid overflow detected. Try a larger page margin or smaller numerals."
    : "All dates fit. Safe area is clear for print.";
}

function renderAtlas() {
  const atlas = $("#atlas-grid");
  atlas.innerHTML = monthNames.map((monthName, index) => {
    const month = index + 1;
    const grid = monthGrid(2027, month, { weekStart: 1 });
    const cells = grid.flat().map((date) => {
      if (!date) return `<span class="mini-day blank" aria-hidden="true">0</span>`;
      const weekendClass = date.weekday === 0 || date.weekday === 6 ? " weekend" : "";
      return `<span class="mini-day${weekendClass}">${date.day}</span>`;
    }).join("");
    return `<button class="atlas-month" type="button" data-month="${month}" aria-label="Open ${monthName} 2027 in Print Studio"><span class="atlas-month-top"><span class="atlas-month-name">${monthName}</span><span class="atlas-month-count">${daysInMonth(2027, month)} DAYS</span></span><span class="mini-grid" aria-hidden="true">${weekdayShort.slice(1).concat(weekdayShort[0]).map((day) => `<span class="mini-weekday">${day[0]}</span>`).join("")}${cells}</span><span class="month-select-hint"><span>MONDAY FIRST · ${grid.length} ROWS</span><span>Open month →</span></span></button>`;
  }).join("");
}

function miniComparison(month, weekStart, fixedRows) {
  const grid = monthGrid(2027, month, { weekStart, fixedRows });
  const startDays = Array.from({ length: 7 }, (_, index) => (weekStart + index) % 7);
  const labels = startDays.map((day) => `<span class="mini-weekday">${weekdayShort[day][0]}</span>`).join("");
  const cells = grid.flat().map((date) => {
    if (!date) return `<span class="mini-day blank" aria-hidden="true">0</span>`;
    const weekend = date.weekday === 0 || date.weekday === 6 ? " weekend" : "";
    return `<span class="mini-day${weekend}">${date.day}</span>`;
  }).join("");
  return { rows: grid.length, html: `${labels}${cells}` };
}

function renderComparison() {
  const month = Number($("#comparison-month").value);
  const configurations = [
    { weekStart: 0, fixed: false, title: "Sunday-first", label: "VARIABLE ROWS" },
    { weekStart: 1, fixed: false, title: "Monday-first", label: "VARIABLE ROWS" },
    { weekStart: 0, fixed: true, title: "Sunday-first", label: "FIXED · 6 ROWS" },
    { weekStart: 1, fixed: true, title: "Monday-first", label: "FIXED · 6 ROWS" },
  ];
  const cards = configurations.map((configuration) => {
    const result = miniComparison(month, configuration.weekStart, configuration.fixed);
    return `<div class="comparison-card"><div class="comparison-card-head"><strong>${configuration.title}</strong><span>${configuration.fixed ? configuration.label : `${configuration.label} · ${result.rows} ROWS`}</span></div><div class="mini-grid" aria-label="${monthNames[month - 1]} 2027 ${configuration.title}, ${result.rows} rows">${result.html}</div></div>`;
  }).join("");
  $("#comparison-view").innerHTML = `${cards}<p class="comparison-fixed-note">${monthNames[month - 1]} 2027 · ${daysInMonth(2027, month)} DAYS · SAME DATE DATA, DIFFERENT GRID CHOICES</p>`;
}

function renderInspection() {
  const month = Number($("#lab-month").value);
  const year = Number($("#lab-year").value);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    $("#inspection-readout").innerHTML = `<p class="validation-error">Choose a year from 1900 to 2100.</p>`;
    $("#year-transition").textContent = "Year transitions are calculated from the selected Gregorian year.";
    return;
  }
  const facts = monthFacts(year, month, Number(ui.weekStart.value));
  const items = [
    ["Month length", String(facts.days), "days"],
    ["First weekday", weekdayLong[facts.firstWeekday]],
    ["Last weekday", weekdayLong[facts.lastWeekday]],
    ["Leap year", facts.leapYear ? "Yes" : "No"],
    ["Visible rows", `${facts.variableRows} / 6`, "variable / fixed"],
    ["ISO week span", `${facts.firstISOWeek.week} → ${facts.lastISOWeek.week}`, `${facts.firstISOWeek.weekYear}–${facts.lastISOWeek.weekYear}`],
  ];
  $("#inspection-readout").innerHTML = items.map(([label, value, detail = ""]) => `<div class="readout-item"><span>${label}</span><strong>${value}</strong>${detail ? `<small>${detail}</small>` : ""}</div>`).join("");
  const last = `${monthNames[11]} ${year} ${daysInMonth(year, 12)}, ${weekdayLong[weekday(year, 12, daysInMonth(year, 12))]}`;
  const next = `${monthNames[0]} ${year + 1} 1, ${weekdayLong[weekday(year + 1, 1, 1)]}`;
  $("#year-transition").textContent = `YEAR EDGE  /  ${last} → ${next}`;
}

function verifyDate(value = $("#date-check-input").value) {
  const result = parseISODate(value);
  const output = $("#date-result");
  output.classList.toggle("error", !result.valid);
  if (!result.valid) {
    output.innerHTML = `<p class="result-weekday">Date not valid</p><p class="result-detail">${result.reason}</p>`;
    return;
  }
  output.innerHTML = `<p class="result-weekday">${result.weekdayName}</p><p class="result-detail">${value} · ISO week ${String(result.isoWeek.week).padStart(2, "0")} / week-year ${result.isoWeek.weekYear}</p>`;
}

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => ui.toast.classList.remove("is-visible"), 2600);
}

function downloadFile(filename, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`${filename} is ready to save.`);
}

function moveMonth(delta) {
  let year = Number(ui.year.value);
  let month = Number(ui.month.value) + delta;
  if (month < 1) { month = 12; year -= 1; }
  if (month > 12) { month = 1; year += 1; }
  if (year < 1900 || year > 2100) {
    toast("The studio supports years 1900–2100.");
    return;
  }
  ui.year.value = year;
  ui.month.value = month;
  updateStudio();
}

function updateStudio() {
  const state = readState();
  if (!state) {
    $("#print-calendar").disabled = true;
    $("#export-csv").disabled = true;
    $("#export-json").disabled = true;
    return;
  }
  $("#print-calendar").disabled = false;
  $("#export-csv").disabled = false;
  $("#export-json").disabled = false;
  renderCalendar(state);
  renderInspection();
}

function init() {
  populateMonthSelect(ui.month);
  populateMonthSelect($("#comparison-month"));
  populateMonthSelect($("#lab-month"));
  selectControls(defaultState);
  $("#comparison-month").value = "1";
  $("#lab-month").value = "1";
  renderAtlas();
  renderComparison();
  renderCalendar(defaultState);
  renderInspection();
  verifyDate();

  $("#calendar-controls").addEventListener("input", updateStudio);
  $("#calendar-controls").addEventListener("change", updateStudio);
  $("#reset-settings").addEventListener("click", () => { selectControls(defaultState); updateStudio(); toast("Studio settings reset to the 2027 proof."); });
  $("#previous-month").addEventListener("click", () => moveMonth(-1));
  $("#next-month").addEventListener("click", () => moveMonth(1));
  $("#print-calendar").addEventListener("click", () => window.print());
  $("#export-csv").addEventListener("click", () => {
    const filename = `calendar-${currentState.year}-${String(currentState.month).padStart(2, "0")}.csv`;
    downloadFile(filename, toCSV(currentState.year, currentState.month), "text/csv;charset=utf-8");
  });
  $("#export-json").addEventListener("click", () => {
    const filename = `calendar-${currentState.year}-${String(currentState.month).padStart(2, "0")}.json`;
    downloadFile(filename, toJSON(currentState.year, currentState.month), "application/json;charset=utf-8");
  });
  $("#atlas-grid").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-month]");
    if (!button) return;
    ui.year.value = "2027";
    ui.month.value = button.dataset.month;
    updateStudio();
    $("#studio").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#comparison-month").addEventListener("change", renderComparison);
  $("#lab-month").addEventListener("change", renderInspection);
  $("#lab-year").addEventListener("input", renderInspection);
  ui.weekStart.addEventListener("change", renderInspection);
  $("#date-check-form").addEventListener("submit", (event) => { event.preventDefault(); verifyDate(); });
  $("#date-check-input").addEventListener("change", () => verifyDate());
  window.addEventListener("resize", () => window.requestAnimationFrame(checkOverflow));
  window.addEventListener("beforeprint", checkOverflow);
}

init();
