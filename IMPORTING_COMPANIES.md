# Importing & Updating Coverage Companies

The standardized pages are driven by one file: `data/coverage-data.js`. The renderer is
`coverage-app.js`; the shells are `index.html` (grid) and `company.html?t=TICKER` (per-company).
The index and top navigation are generated from the data file, so a new entry appears everywhere
automatically.

**After every edit, run `node validate.js` — it must print 9/9 (or N/N) PASS.**
Serve locally with `python3 serve_nocache.py` (port 8765, no-cache headers so edits always load).

## Canonical source layout (per company)

Every company folder under `/Users/dinohsu/Desktop/Work/Coverage/<TICKER>/` follows the
standardized layout (FSLR is the reference):

```
Business Overview/                      crash course, products breakdown, investor days
Earnings Reports/<YYYY QN>/             <QTOK> Press Release.pdf, <QTOK> Earnings Presentation.pdf,
                                        <QTOK> Financials.pdf, <QTOK> Supplemental.xlsx
Earnings Transcripts/                   <QTOK> Transcript.txt|docx (+ evolution/ZH summaries)
Memos/                                  <TICKER>_YYYYMMDD_許喬傑[_EN|_ZH].docx
Model/                                  <TICKER> Model.xlsx  (+ model-infra JSON/yaml — do not move)
Guidance/                               only where guidance docs exist (outlooks, guidance evolutions)
```

`<QTOK>` = `25Q4`, `26Q1` (calendar) or `FY26Q1`/`FY25Q4` (off-calendar fiscal: EMR Sept-FY,
5802/7011 Mar-FY). RDDT is the exception: its sources live at
`/Users/dinohsu/Desktop/Markets/Personal Coverage/RDDT`.

## Current primary workbooks

- ETN:  `/Users/dinohsu/Desktop/Work/Coverage/ETN/Model/ETN Model.xlsx`
- HUBB: `/Users/dinohsu/Desktop/Work/Coverage/HUBB/Model/HUBB Model.xlsx`
- PWR:  `/Users/dinohsu/Desktop/Work/Coverage/PWR/Model/PWR Model.xlsx`
- GEV:  `/Users/dinohsu/Desktop/Work/Coverage/GEV/Model/GEV Model.xlsx`
- STLD: `/Users/dinohsu/Desktop/Work/Coverage/STLD/Model/STLD Model.xlsx`
- FSLR: `/Users/dinohsu/Desktop/Work/Coverage/FSLR/Model/FSLR Model.xlsx`
- NEM:  `/Users/dinohsu/Desktop/Work/Coverage/NEM/Model/NEM Model.xlsx`
- TSLA: `/Users/dinohsu/Desktop/Work/Coverage/TSLA/Model/TSLA Model.xlsx`
- RDDT: no model workbook yet — sourced from earnings files under the Markets path above.

Prefer workbook tabs in this order: `Summary` (headline KPIs + quarterly/annual series) ->
`Quarterly Update` -> `Income Statement` / `Segments` -> `PE Bands` / `EBITDA Bands` / `Valuation`
-> `Assumptions`.

## Add a company (one prompt: "Add <TICKER> at price $X")

1. **Read the model workbook** (`Summary` first). Extract quarterly + annual series for revenue
   (by segment), margin, EPS or EBITDA, and the company-specific operating metrics (backlog,
   shipments/ASP, production, deliveries, GW, etc.).
2. **Read the latest memo** in `Memos/` (the `_EN` variant). It supplies the rating, PT, multiple,
   close price + date, 多空 bull/risk points, and competitive advantages -> `thesis`, `facts`,
   `headline`, `summary`.
3. **Fill the entry** using `data/company-template.json` as the field checklist: `ticker`, `slug`
   (lowercase ticker), `name`, `exchange`, `sector`, `status`, `lastUpdate` (**"DD Mon YYYY"**),
   `legacyPage` (only if a real handcrafted deep-dive exists), `valuation`, `dataSources` (model
   workbook + memo + quarter folder, all absolute paths that exist), `headline`, `summary`, `tags`,
   `stats` (4), `facts` (4-5), `kpis` (4), `thesis` (3/3/3), `charts`.
4. **Charts — house conventions:**
   - Each key chart gets an **annual + quarterly pair** (e.g. `xxx-revenue` and `xxx-revenue-q`).
   - Forecast periods use `forecastStart: <index>` (line goes dashed, points drop).
   - Types: `stackedBar`, `bar`, `line`, `doughnut`, `comboBarLine`.
   - Units: `currencyB`, `currencyM`, `currency`, `percent`, `percentPlain`, `multiple`, `ratio`,
     `gw`, `plain` — settable per chart and per dataset; dual-axis via `yAxisID: "y1"` +
     `axes.y1 { unit, title, suggestedMin/Max }`.
   - **Line-above-bars is renderer-owned** (`order: isLine ? 0 : 1` in coverage-app.js) — never
     set draw order in the data file.
   - Chart ids must be globally unique: prefix with the ticker (`fslr-revenue-q`).
5. **Valuation block** (rendered under the hero stats; upside is computed at render time):
   `valuation: { price: <user-supplied close or null>, priceDate: "DD Mon YYYY" | null,
   target: <number>, method: "30x FY27e EPS $15.30" }`. The user supplies prices one at a time —
   never invent one; leave `price: null` ("PT only — price pending") until given.
6. **Income statement block (optional).** `incomeStatement: { unit, note, views: [{ id, label,
   periods, forecastFrom, rows: [{ label, data, style?, unit? }] }] }` renders section
   "04 / Financials" with an Annual/Quarterly toggle. Row styles: `subtotal`, `total`, `pct`,
   `indent`; row units: `money` (default), `pctFrac` (0.41 -> 41.0%), `eps`, `shares`. `null`
   renders as "—" (use it where the model doesn't carry a line, e.g. forecast interest income).
   Source from the model's Actuals (EDGAR extraction) + Est sheets; forecast columns tint
   automatically from `forecastFrom`.
7. **Never invent numbers.** Every figure must trace to the model workbook, a memo, or a quarter
   folder. Flag anything you cannot source instead of estimating it.
8. **Validate and verify:** `node validate.js` (all PASS) -> `python3 serve_nocache.py` ->
   open `company.html?t=<TICKER>`.

## Update a company after earnings ("Refresh <TICKER> for <quarter>")

1. Re-read the model `Summary` (new actuals + rolled forecast), the new memo, and the new
   `Earnings Reports/<YYYY QN>/` folder.
2. Update `stats` to the new quarter's actuals, refresh `kpis`/`facts`/`thesis` from the memo,
   extend quarterly chart arrays (shift `forecastStart` right), update annual forecast values,
   update `valuation` (new PT/price/date), set `lastUpdate`, and set `status`.
3. `node validate.js`, then visually check the page.

## Status rule

- **Live** — verified against the model workbook *and* the current-quarter memo.
- **Draft** — anything less (missing model, stale quarter, or unverified numbers).

## Legacy deep-dive pages

`etn.html`, `hubb.html`, `pwr.html`, `stld.html` are **frozen** handcrafted deep-dives with their
own embedded data and `*_prices.json`. Each carries a frozen-banner and links back to its
standardized page. Do not extend them; new depth goes into the standardized entry. `legacyPage`
should point to one only when it is a real deep-dive (GEV's stub was retired).
