# Live Demo — Build CEG into the Coverage Site (10 min)

**Structure (your "cooking show" idea):** show the finished site → fire one prompt that builds a
brand-new company from source docs → narrate the architecture while it builds → reveal the result.
The build time *is* the talk; never wait in silence.

**Why CEG works:** not yet in the site (genuine new entry — it'll pop onto the index grid + nav
automatically), and all source docs are prepped and verified present:
`CEG/Model/CEG Model.xlsx`, memo `CEG_20260610_許喬傑_EN.docx`, quarter `Earnings Reports/2026 Q1`.

---

## Before you walk in (setup, 2 min — do this offstage)

1. `cd /Users/dinohsu/Desktop/Work/Coverage/zzzMisc/_thesis_pages`
2. Start the server once: `python3 serve_nocache.py` → leave it running.
3. Open two browser tabs:
   - **Tab A (start here):** `http://127.0.0.1:8765/index.html` — the grid, CEG absent.
   - **Tab B:** an existing rich page, e.g. `http://127.0.0.1:8765/company.html?t=VST` — to show
     what "done" looks like.
4. Have CEG's **live close price** ready to drop into the prompt (replace `$___`).
5. **Fallback ready:** keep the pre-built CEG entry on a branch/stash (see "Rehearsal" below) so
   if the live build stalls you `git checkout` it and refresh — no dead air.

---

## Run of show

**[0:00–1:30] Show the thing.** Tab A: the index grid, 11 names. Click into Tab B (VST):
hero stats, valuation line with computed upside, KPI tiles, workbook-backed charts (annual +
quarterly), the bull/risk/watch debate. "Every one of these is driven by one data file, generated
from my actual models and memos. Watch me add a twelfth — live."

**[1:30] Fire the prompt** (below). Then switch back to talking — don't watch it compile.

**[1:30–8:00] Talk while it builds** — work through the talking-points bank below.

**[~8:00] Reveal.** When it prints validate `N/N PASS`, reload Tab A — **CEG is now on the grid**.
Click it: full page, charts, valuation, thesis — built from raw Excel + a Word memo in minutes.

**[8:00–10:00] Land the point** + Q&A (see closing line).

---

## THE PROMPT (paste verbatim; set the price)

```
Add CEG (Constellation Energy) to the coverage site at price $___.

Follow IMPORTING_COMPANIES.md exactly. Sources (all already prepped):
- Model:  /Users/dinohsu/Desktop/Work/Coverage/CEG/Model/CEG Model.xlsx  (read the Summary tab first)
- Memo:   /Users/dinohsu/Desktop/Work/Coverage/CEG/Memos/CEG_20260610_許喬傑_EN.docx  (latest — rating, PT, multiple, bull/risk)
- Quarter: /Users/dinohsu/Desktop/Work/Coverage/CEG/Earnings Reports/2026 Q1/

Add one new entry to data/coverage-data.js using data/company-template.json as the field
checklist: hero stats, valuation (price as given, PT/method from the memo), 4 KPIs, 4-5 facts,
the 3/3/3 bull-risk-watch thesis from the memo, and the standard annual+quarterly chart pairs
(revenue by segment, margin/EBITDA, EPS) with forecast periods dashed.

Never invent a number — every figure must trace to the workbook, memo, or quarter folder; flag
anything you can't source. Then run `node validate.js` (must print N/N PASS) and tell me when it's
live so I can reload the page.
```

*(Simpler alternative if you want to show how little it takes: just type `Add CEG at price $___`
— the workflow in IMPORTING_COMPANIES.md already knows where every source lives. The explicit
version above is lower-variance for a live audience.)*

---

## Talking-points bank (fill the ~6 min build — pick in order, drop any if time's short)

1. **One data file drives everything.** "There's no per-page HTML. `coverage-data.js` is the single
   source — the grid, the nav, every company page regenerate from it. Adding an entry makes the
   company appear everywhere at once."
2. **It's reading my real work, not scraping the web.** "Right now it's opening a 275 KB Excel
   model and a Word memo I wrote — pulling the forecast series and my actual bull/risk thesis. The
   numbers on the page trace back to my workbook, not to anything it made up."
3. **Standardized structure is what makes this possible.** "Every company folder has the same
   layout — model, transcripts, memos, earnings reports. Because the inputs are uniform, one
   instruction file teaches it to import any of my 21 names."
4. **The guardrail: never invent a number.** "It's told to flag anything it can't source rather
   than estimate. For research that's the whole game — a pretty page with a made-up number is worse
   than no page."
5. **There's a validation gate.** "Before it tells me it's done, it runs `validate.js` — schema and
   chart checks have to pass. If it's broken, it doesn't ship." *(If validate fails on stage, lean
   in: "watch — it reads the error and fixes it." That shows the coding loop better than a clean run.)*
6. **It self-deploys.** "This is a live GitHub Pages site. Same loop validates, commits, and pushes
   — the public page rebuilds in about a minute." *(Show dinohsu1011-art.github.io/coverage in a tab.)*

---

## Rehearsal + fallback (do once before the day)

Run the exact prompt yourself ahead of time to (a) time it and (b) capture a known-good entry:
```
# after a successful build, save the diff as your fallback
git stash push -m "ceg-prebuilt" data/coverage-data.js   # or commit to a throwaway branch
```
On stage, if the live build hangs past ~3 min: `git stash pop` (or checkout the branch),
`node validate.js`, reload — and narrate it as "here's the result." Audience can't tell.

## Risk notes
- Reading the Excel model is the slowest step; the explicit prompt points straight at the file so
  it doesn't hunt. Expect ~3–6 min end to end.
- Keep the local server (`serve_nocache.py`) as the demo surface — don't depend on the live push
  during the 10 min. Show the deployed site separately as proof it ships.
- Don't push live on stage unless rehearsed; the auto-commit rule still applies offstage.
