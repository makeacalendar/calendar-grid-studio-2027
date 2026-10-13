# Calendar Grid Studio — 2027

An interactive calendar design, date validation and print layout laboratory. This is a client-side static app; calendar dates are calculated in the browser and no account or backend is needed.

## Features

- Monthly Gregorian calendar generator for 1900–2100, with Monday-first or Sunday-first weeks and variable or fixed six-row grids.
- Print Studio with A4 and US Letter proportions, portrait and landscape layouts, adjustable margins, preview safe-area guides, palette choices, type size, cell spacing, grid rules, weekend emphasis and optional page text.
- Browser print / Save as PDF, plus real CSV and JSON date-data downloads.
- 2027 atlas with all twelve calculated months and an interactive comparison of week starts and row strategies.
- Validation Lab for month length, weekdays, leap-year status, visible rows, ISO week boundaries, year transitions and a date verification demonstration.
- Ten concise notes on calendar arithmetic and print preparation.
- Six relevant, public BetaCalendars resource links.

## Local use

Requires Node.js 20 or newer. There are no third-party runtime dependencies.

```sh
npm test
npm run build
npm run dev
```

Open `http://127.0.0.1:4173` after starting the local server. The production output is `dist/`.

## Deploy to Render

Create a **Static Site** from this repository, use `npm run build` as the build command and `dist` as the publish directory. The included `render.yaml` records these settings. A static site is sufficient; this app does not need a server or database.

## Date logic

Core calculations are pure JavaScript functions using integer Gregorian arithmetic rather than local-time `Date` parsing. The algorithm handles years 1–9999 (the interface is intentionally limited to 1900–2100) and follows ISO week-year rules. The tests include 1900, 2000, 2024, 2100 and 2400.

## External resources

The BetaCalendars links are ordinary, visible HTML anchors and are supplemental reading; the studio remains fully usable without opening them. They are not endorsements and this site makes no promise about search-engine indexing or ranking effects.

## Privacy and limitations

No analytics, cookies, sign-in, backend, data storage or paid APIs are used by the application. Exported files are generated in the browser. Browser printing and printer driver settings determine final physical output; the app does not generate CMYK files or guarantee a device's printable area.
