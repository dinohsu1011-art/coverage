#!/usr/bin/env node
// Validation harness for coverage-data.js — run after every edit: `node validate.js`
// Exits 1 on any failure. No dependencies.

const fs = require("fs");
const path = require("path");

process.chdir(__dirname);
global.window = {};
require("./data/coverage-data.js");

const companies = window.COVERAGE_COMPANIES || [];
const VALID_UNITS = new Set([
  "currencyB", "currencyM", "currency", "percent", "percentPlain",
  "multiple", "ratio", "gw", "plain", undefined,
]);
const VALID_TYPES = new Set(["stackedBar", "bar", "line", "doughnut", "comboBarLine"]);
const VALID_STATUS = new Set(["Live", "Draft"]);
const DATE_RE = /^\d{2} [A-Z][a-z]{2} \d{4}$/; // "DD Mon YYYY"

const globalIds = new Map();
const seenTickers = new Set();
const results = [];

for (const c of companies) {
  const errs = [];
  const t = c.ticker || "(no ticker)";

  if (seenTickers.has(t)) errs.push("duplicate ticker");
  seenTickers.add(t);
  if (c.slug !== String(t).toLowerCase()) errs.push(`slug '${c.slug}' != lowercase ticker`);
  if (!VALID_STATUS.has(c.status)) errs.push(`status '${c.status}' not in {Live, Draft}`);
  if (!DATE_RE.test(c.lastUpdate || "")) errs.push(`lastUpdate '${c.lastUpdate}' not 'DD Mon YYYY'`);
  if (c.legacyPage && !fs.existsSync(path.join(__dirname, c.legacyPage)))
    errs.push(`legacyPage '${c.legacyPage}' missing on disk`);

  for (const s of c.dataSources || []) {
    if (s.path && !fs.existsSync(s.path)) errs.push(`dataSource path missing: ${s.path}`);
  }

  for (const k of ["stats", "facts", "kpis"]) {
    if (!Array.isArray(c[k]) || c[k].length === 0) errs.push(`${k} empty`);
  }
  for (const grp of ["bull", "risk", "watch"]) {
    if (!c.thesis || !Array.isArray(c.thesis[grp]) || c.thesis[grp].length === 0)
      errs.push(`thesis.${grp} empty`);
  }

  if (c.valuation != null) {
    const v = c.valuation;
    if (!(typeof v.target === "number" && v.target > 0)) errs.push("valuation.target must be a positive number");
    if (!(v.price === null || (typeof v.price === "number" && v.price > 0)))
      errs.push("valuation.price must be null or a positive number");
    if (!v.method) errs.push("valuation.method missing");
    if (v.price !== null && !v.priceDate) errs.push("valuation.priceDate required when price is set");
  }

  if (c.incomeStatement != null) {
    const fin = c.incomeStatement;
    const FIN_UNITS = new Set(["money", "pctFrac", "eps", "shares", undefined]);
    const FIN_STYLES = new Set(["total", "subtotal", "pct", "indent", undefined, ""]);
    if (!Array.isArray(fin.views) || fin.views.length === 0) errs.push("incomeStatement.views empty");
    for (const view of fin.views || []) {
      const w = `incomeStatement view '${view.id}'`;
      if (!view.id || !view.label) errs.push(`${w}: id/label missing`);
      const P = (view.periods || []).length;
      if (!P) errs.push(`${w}: periods empty`);
      if (view.forecastFrom != null && (view.forecastFrom < 0 || view.forecastFrom > P))
        errs.push(`${w}: forecastFrom ${view.forecastFrom} out of range`);
      if (!Array.isArray(view.rows) || view.rows.length === 0) errs.push(`${w}: rows empty`);
      for (const row of view.rows || []) {
        if (!Array.isArray(row.data) || row.data.length !== P)
          errs.push(`${w} row '${row.label}': data len ${(row.data || []).length} != periods ${P}`);
        if (!FIN_UNITS.has(row.unit)) errs.push(`${w} row '${row.label}': unknown unit '${row.unit}'`);
        if (!FIN_STYLES.has(row.style)) errs.push(`${w} row '${row.label}': unknown style '${row.style}'`);
      }
    }
  }

  for (const ch of c.charts || []) {
    const where = `chart '${ch.id}'`;
    if (globalIds.has(ch.id)) errs.push(`${where} duplicates id used by ${globalIds.get(ch.id)}`);
    globalIds.set(ch.id, t);
    if (!VALID_TYPES.has(ch.type)) errs.push(`${where}: unknown type '${ch.type}'`);
    if (!VALID_UNITS.has(ch.unit)) errs.push(`${where}: unknown unit '${ch.unit}'`);
    const L = (ch.labels || []).length;
    (ch.datasets || []).forEach((d, i) => {
      if (!Array.isArray(d.data)) { errs.push(`${where} ds${i}: data not an array`); return; }
      if (d.data.length !== L) errs.push(`${where} ds${i} '${d.label}': data len ${d.data.length} != labels ${L}`);
      if (!VALID_UNITS.has(d.unit)) errs.push(`${where} ds${i}: unknown dataset unit '${d.unit}'`);
      if (d.forecastStart != null && (d.forecastStart < 0 || d.forecastStart >= d.data.length))
        errs.push(`${where} ds${i}: forecastStart ${d.forecastStart} out of range (len ${d.data.length})`);
      if (d.yAxisID === "y1" && !(ch.axes && ch.axes.y1))
        errs.push(`${where} ds${i}: yAxisID 'y1' but chart has no axes.y1 config`);
    });
  }

  results.push({ ticker: t, errs });
}

const width = Math.max(...results.map((r) => r.ticker.length), 6);
console.log(`\n${"TICKER".padEnd(width)}  RESULT`);
console.log("-".repeat(width + 10));
let failed = 0;
for (const r of results) {
  const ok = r.errs.length === 0;
  if (!ok) failed++;
  console.log(`${r.ticker.padEnd(width)}  ${ok ? "PASS" : "FAIL"}`);
  for (const e of r.errs) console.log(`${" ".repeat(width)}    - ${e}`);
}
console.log(`\n${results.length - failed}/${results.length} companies pass`);
process.exit(failed ? 1 : 0);
