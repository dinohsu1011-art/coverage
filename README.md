# Coverage — Standardized Company Thesis Pages

Static dashboard over my equity coverage universe. One data file (`data/coverage-data.js`)
drives the index grid and every per-company page (`company.html?t=TICKER`): hero stats,
valuation line (PT vs close, computed upside), KPI tiles, workbook-backed charts
(annual + quarterly pairs), income statement (annual/quarterly toggle), and the
bull / risk / watch debate.

- Live: https://dinohsu1011-art.github.io/coverage/
- Conventions and add-a-company workflow: `IMPORTING_COMPANIES.md`
- Post-edit check: `node validate.js`
- Local dev: `python3 serve_nocache.py` → http://127.0.0.1:8765
