(function () {
  const COLORS = {
    bg: "#faf9f5",
    surface: "#ffffff",
    ink: "#141413",
    ink2: "#3d3d3a",
    ink3: "#73726c",
    ink4: "#9c9a92",
    parchment: "#dedcd1",
    azure: "#ccdbe8",
    terra: "#d97757",
    terraFaint: "rgba(217,119,87,0.12)",
  };

  const SERIES = [
    "#d97757",
    "#73726c",
    "#a8a298",
    "#ccdbe8",
    "#dedcd1",
    "#3d3d3a",
    "#b98b73",
    "#8da4b6",
  ];

  const gridStyle = {
    color: COLORS.parchment,
    drawTicks: false,
    drawBorder: false,
    lineWidth: 1,
  };

  function companies() {
    return window.COVERAGE_COMPANIES || [];
  }

  function meta() {
    return window.COVERAGE_META || {};
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function companyUrl(company) {
    return "company.html?t=" + encodeURIComponent(company.ticker);
  }

  function activeTicker() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("t") || params.get("ticker") || "").toUpperCase();
  }

  function findCompany(ticker) {
    const all = companies();
    return all.find((company) => company.ticker === ticker) || all[0];
  }

  function setText(id, text) {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  }

  function renderTopbar(active) {
    setText("brand", meta().title || "Coverage");
    const nav = document.getElementById("topbarNav");
    if (!nav) return;

    const links = [
      `<a href="index.html" class="${active === "index" ? "current" : ""}">Index</a>`,
      ...companies().map((company) => {
        const current = active === company.ticker ? "current" : "";
        return `<a href="${companyUrl(company)}" class="${current}">${escapeHtml(company.ticker)}</a>`;
      }),
    ];

    nav.innerHTML = links.join("");
  }

  function renderIndex() {
    renderTopbar("index");
    setText("indexEyebrow", `${meta().universe || "Coverage Universe"} - ${meta().vintage || ""}`);
    setText("indexHeadline", meta().indexHeadline || "Coverage");
    setText("indexSubhead", meta().indexSubhead || "");
    setText("indexFooterLeft", "Coverage Index");
    setText("indexFooterRight", "Last update " + (meta().lastUpdate || ""));

    const grid = document.getElementById("coverageGrid");
    if (!grid) return;

    grid.innerHTML = companies()
      .map((company) => {
        const metaRows = company.stats
          .slice(0, 3)
          .map((stat) => `<div>${escapeHtml(stat.label)} <strong>${escapeHtml(stat.value)}</strong></div>`)
          .join("");

        return `
          <a href="${companyUrl(company)}" class="coverage-card ${company.status === "Live" ? "live" : "draft"}">
            <div class="ticker">${escapeHtml(company.ticker)}</div>
            <div class="name">${escapeHtml(company.name)} - ${escapeHtml(company.exchange)}</div>
            <div class="pitch">${escapeHtml(company.summary)}</div>
            <div class="meta">${metaRows}</div>
          </a>
        `;
      })
      .join("");
  }

  function renderCompany() {
    const company = findCompany(activeTicker());
    if (!company) return;

    document.title = `${company.ticker} - Standard Coverage Summary`;
    renderTopbar(company.ticker);

    setText("companyEyebrow", `${company.name} - ${company.exchange}: ${company.ticker} - Last update ${company.lastUpdate}`);
    setText("companyHeadline", company.headline);
    setText("companySummary", company.summary);
    setText("companyFooterLeft", `Coverage / ${company.ticker}`);
    setText("companyFooterRight", `Standard summary - ${company.status}`);

    renderTags(company);
    renderActions(company);
    renderStats(company);
    renderValuation(company);
    renderFacts(company);
    renderKpis(company);
    renderSources(company);
    renderCharts(company);
    renderFinancials(company);
    renderThesis(company);
  }

  function renderFinancials(company) {
    const section = document.getElementById("finSection");
    if (!section) return;
    const fin = company.incomeStatement;
    if (!fin || !(fin.views || []).length) {
      section.style.display = "none";
      return;
    }
    section.style.display = "";
    const controls = document.getElementById("finControls");
    const host = document.getElementById("finStatement");
    const note = document.getElementById("finNote");
    if (note) note.textContent = fin.note || "";

    let active = fin.views[0].id;
    const draw = () => {
      controls.innerHTML = fin.views
        .map(
          (view) =>
            `<button type="button" class="fin-tab ${view.id === active ? "on" : ""}" data-view="${escapeHtml(view.id)}">${escapeHtml(view.label)}</button>`,
        )
        .join("");
      const view = fin.views.find((v) => v.id === active) || fin.views[0];
      host.innerHTML = finTable(view, fin.unit);
      controls.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
          active = button.dataset.view;
          draw();
        });
      });
    };
    draw();
  }

  function finTable(view, unit) {
    const fc = view.forecastFrom != null ? view.forecastFrom : Infinity;
    const head =
      `<tr><th class="lbl">${escapeHtml(unit || "")}</th>` +
      view.periods.map((p, i) => `<th class="${i >= fc ? "fcast" : ""}">${escapeHtml(p)}</th>`).join("") +
      "</tr>";
    const body = (view.rows || [])
      .map((row) => {
        const cells = row.data
          .map((value, i) => `<td class="${i >= fc ? "fcast" : ""}">${finValue(value, row.unit)}</td>`)
          .join("");
        return `<tr class="fin-row ${row.style || ""}"><td class="lbl">${escapeHtml(row.label)}</td>${cells}</tr>`;
      })
      .join("");
    return `<div class="fin-scroll"><table class="fin-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
  }

  function finValue(value, unit) {
    if (value == null || value === "") return "—";
    const number = Number(value);
    if (!Number.isFinite(number)) return escapeHtml(String(value));
    if (unit === "pctFrac") return (number * 100).toFixed(1) + "%";
    if (unit === "eps") return number.toFixed(2);
    if (unit === "shares") return number.toFixed(1);
    const decimals = Math.abs(number) >= 1000 ? 0 : 1;
    const text = Math.abs(number).toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
    return number < 0 ? `(${text})` : text;
  }

  function renderTags(company) {
    const node = document.getElementById("companyTags");
    if (!node) return;
    node.innerHTML = (company.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  }

  function renderActions(company) {
    const node = document.getElementById("companyActions");
    if (!node) return;
    const deepDive = company.legacyPage
      ? `<a class="text-action" href="${escapeHtml(company.legacyPage)}">Deep dive</a>`
      : "";
    node.innerHTML = `
      <a class="text-action primary" href="index.html">Index</a>
      ${deepDive}
    `;
  }

  function renderValuation(company) {
    const node = document.getElementById("companyValuation");
    if (!node) return;
    const v = company.valuation;
    if (!v || !v.target) {
      node.innerHTML = "";
      return;
    }
    // Upside is always computed here from target/price, never read from the data file.
    if (v.price == null) {
      node.innerHTML = `<strong>PT $${v.target}</strong> (${escapeHtml(v.method || "")}) — price pending`;
      return;
    }
    const upside = (v.target / v.price - 1) * 100;
    const sign = upside >= 0 ? "+" : "";
    node.innerHTML =
      `<strong>PT $${v.target}</strong> (${escapeHtml(v.method || "")}) vs ` +
      `$${v.price} close (${escapeHtml(v.priceDate || "")}) = ` +
      `<strong>${sign}${upside.toFixed(1)}%</strong>`;
  }

  function renderStats(company) {
    const node = document.getElementById("companyStats");
    if (!node) return;
    node.innerHTML = (company.stats || [])
      .map(
        (stat) => `
          <div class="stat">
            <div class="label">${escapeHtml(stat.label)}</div>
            <div class="value">${escapeHtml(stat.value)}</div>
            <div class="delta">${escapeHtml(stat.delta || "")}</div>
          </div>
        `,
      )
      .join("");
  }

  function renderFacts(company) {
    const node = document.getElementById("factsGrid");
    if (!node) return;
    node.innerHTML = (company.facts || [])
      .map(
        (fact) => `
          <div class="fact-row">
            <div class="fact-label">${escapeHtml(fact.label)}</div>
            <div class="fact-value">${escapeHtml(fact.value)}</div>
          </div>
        `,
      )
      .join("");
  }

  function renderKpis(company) {
    const node = document.getElementById("kpiGrid");
    if (!node) return;
    node.innerHTML = (company.kpis || [])
      .map(
        (kpi) => `
          <div class="kpi-tile">
            <div class="kpi-label">${escapeHtml(kpi.label)}</div>
            <div class="kpi-value">${escapeHtml(kpi.value)}</div>
            <div class="kpi-note">${escapeHtml(kpi.note || "")}</div>
          </div>
        `,
      )
      .join("");
  }

  function renderSources(company) {
    const node = document.getElementById("sourceGrid");
    if (!node) return;
    const sources = company.dataSources || [];

    node.innerHTML = sources
      .map(
        (source) => `
          <div class="source-card">
            <div class="source-kicker">${escapeHtml(source.type || "Source")}</div>
            <div class="source-path">${escapeHtml(source.path)}</div>
            <div class="source-note">${escapeHtml(source.note || "")}</div>
            <div class="source-sheets">
              ${(source.sheets || []).map((sheet) => `<span>${escapeHtml(sheet)}</span>`).join("")}
            </div>
          </div>
        `,
      )
      .join("");
  }

  function renderThesis(company) {
    const node = document.getElementById("thesisGrid");
    if (!node) return;
    const groups = [
      ["Bull Case", company.thesis && company.thesis.bull],
      ["Risks", company.thesis && company.thesis.risk],
      ["Watchlist", company.thesis && company.thesis.watch],
    ];

    node.innerHTML = groups
      .map(
        ([title, items]) => `
          <div class="thesis-card">
            <h3>${escapeHtml(title)}</h3>
            <ul>
              ${(items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        `,
      )
      .join("");
  }

  function renderCharts(company) {
    const node = document.getElementById("chartGrid");
    if (!node) return;

    node.innerHTML = (company.charts || [])
      .map(
        (chart, index) => `
          <div class="figure standard-figure">
            <div class="chart-wrap">
              <div class="chart-title">${escapeHtml(chart.title)}</div>
              <div class="chart-sub">${escapeHtml(chart.subtitle || "")}</div>
              <div class="chart-canvas ${index === 0 ? "tall" : ""}">
                <canvas id="${escapeHtml(chart.id)}"></canvas>
              </div>
            </div>
            <div class="caption">${escapeHtml(chart.caption || "")}</div>
          </div>
        `,
      )
      .join("");

    (company.charts || []).forEach((chart) => drawChart(chart));
  }

  function drawChart(chart) {
    const canvas = document.getElementById(chart.id);
    if (!canvas || !window.Chart) return;

    const config = {
      type: chart.type === "stackedBar" || chart.type === "comboBarLine" ? "bar" : chart.type,
      data: {
        labels: chart.labels,
        datasets: buildDatasets(chart),
      },
      options: buildOptions(chart),
    };

    new Chart(canvas, config);
  }

  function buildDatasets(chart) {
    if (chart.type === "doughnut") {
      const dataset = chart.datasets[0] || { data: [] };
      return [
        {
          label: dataset.label || chart.title,
          data: dataset.data,
          backgroundColor: dataset.data.map((_, index) => SERIES[index % SERIES.length]),
          borderColor: COLORS.surface,
          borderWidth: 2,
        },
      ];
    }

    return (chart.datasets || []).map((dataset, index) => {
      const color = SERIES[index % SERIES.length];
      const chartType = chart.type === "comboBarLine" ? "bar" : chart.type;
      const datasetType = dataset.type || chartType;
      const isLine = datasetType === "line";
      const base = {
        label: dataset.label,
        data: dataset.data,
        type: dataset.type,
        yAxisID: dataset.yAxisID,
        unit: dataset.unit,
        borderColor: color,
        backgroundColor: isLine ? (chart.type === "line" && index === 0 ? COLORS.terraFaint : "transparent") : color,
        borderWidth: isLine ? (index === 0 ? 2.5 : 1.75) : 0,
        borderDash: dataset.dashed ? [5, 5] : undefined,
        borderRadius: isLine ? 0 : 2,
        // Lower order draws on top in Chart.js: keep line datasets above bars so
        // they are never hidden behind the bars in combo charts.
        order: isLine ? 0 : 1,
      };

      if (chart.type === "stackedBar") {
        base.stack = "total";
      }

      if (datasetType === "bar" && chart.datasets.length === 1) {
        base.backgroundColor = (context) => {
          const value = Number(context.raw);
          if (value < 0) return COLORS.azure;
          if (context.dataIndex === dataset.data.length - 1) return COLORS.terra;
          return SERIES[(context.dataIndex + 2) % SERIES.length];
        };
      }

      if (isLine) {
        base.fill = dataset.fill != null ? dataset.fill : chart.type === "line" && index === 0;
        base.tension = 0.18;
        base.spanGaps = true;
        base.pointRadius = (context) => {
          if (dataset.forecastStart != null && context.dataIndex >= dataset.forecastStart) return 0;
          if (dataset.dashed) return 0;
          return 4;
        };
        base.pointHoverRadius = 6;
        base.pointBackgroundColor = color;
        base.pointBorderColor = color;
        base.segment = {
          borderDash: (context) => {
            if (dataset.dashed) return [5, 5];
            if (dataset.forecastStart != null && context.p1DataIndex >= dataset.forecastStart) return [4, 4];
            return undefined;
          },
        };
      }

      return base;
    });
  }

  function buildOptions(chart) {
    const isHorizontal = chart.axis === "y";
    const isStacked = chart.type === "stackedBar";
    const axes = chart.axes || {};

    if (chart.type === "doughnut") {
      return {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: { position: "right", align: "center", labels: { padding: 14 } },
          tooltip: { callbacks: { label: (context) => doughnutLabel(context, chart.unit) } },
        },
      };
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: isHorizontal ? "y" : "x",
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom", align: "start", labels: { padding: 12 } },
        tooltip: {
          callbacks: {
            label: (context) => {
              const source = (chart.datasets || [])[context.datasetIndex] || {};
              return tooltipLabel(context, source.unit || chart.unit);
            },
          },
        },
      },
      scales: {
        x: {
          stacked: isStacked,
          grid: isHorizontal ? gridStyle : { display: false },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            callback: isHorizontal ? (value) => formatValue(value, chart.unit) : categoryTick,
          },
        },
        y: {
          stacked: isStacked,
          grid: isHorizontal ? { display: false } : gridStyle,
          title: axes.y && axes.y.title ? { display: true, text: axes.y.title } : undefined,
          suggestedMin: axes.y && axes.y.suggestedMin,
          suggestedMax: axes.y && axes.y.suggestedMax,
          ticks: {
            callback: isHorizontal ? categoryTick : (value) => formatValue(value, (axes.y && axes.y.unit) || chart.unit),
          },
        },
        ...(axes.y1
          ? {
              y1: {
                position: "right",
                grid: { display: false },
                title: axes.y1.title ? { display: true, text: axes.y1.title } : undefined,
                suggestedMin: axes.y1.suggestedMin,
                suggestedMax: axes.y1.suggestedMax,
                ticks: {
                  callback: (value) => formatValue(value, axes.y1.unit || chart.unit),
                },
              },
            }
          : {}),
      },
    };
  }

  function categoryTick(value) {
    return this.getLabelForValue(value);
  }

  function tooltipLabel(context, unit) {
    const parsed = context.parsed;
    const value = parsed.y == null ? parsed.x : parsed.y;
    return `${context.dataset.label}: ${formatValue(value, unit)}`;
  }

  function doughnutLabel(context, unit) {
    const total = context.dataset.data.reduce((sum, value) => sum + Number(value || 0), 0);
    const pct = total ? ((Number(context.raw) / total) * 100).toFixed(1) : "0.0";
    return `${context.label}: ${formatValue(context.raw, unit)} (${pct}%)`;
  }

  function formatValue(value, unit) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value);

    if (unit === "currencyB") return formatCurrency(number / 1000, Math.abs(number) >= 10000 ? 1 : 2, "B");
    if (unit === "currencyM") return formatCurrency(number, 0, "M");
    if (unit === "currency") return formatCurrency(number, Math.abs(number) >= 100 ? 0 : 2, "");
    if (unit === "percent") return (number > 0 ? "+" : "") + number.toFixed(Math.abs(number) < 10 ? 1 : 0) + "%";
    if (unit === "percentPlain") return number.toFixed(Math.abs(number) < 10 ? 1 : 0) + "%";
    if (unit === "multiple") return number.toFixed(1) + "x";
    if (unit === "ratio") return number.toFixed(2) + "x";
    if (unit === "gw") return number.toFixed(0) + " GW";
    return Number.isInteger(number) ? String(number) : number.toFixed(2);
  }

  function formatCurrency(value, decimals, suffix) {
    const sign = value < 0 ? "-" : "";
    return sign + "$" + Math.abs(value).toFixed(decimals) + suffix;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;
    if (page === "company") renderCompany();
    if (page === "index") renderIndex();
  });
})();
