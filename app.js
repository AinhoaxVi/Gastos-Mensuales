const STORAGE_KEY = "gastos-ainhoa-v1";

const categories = [
  "Comida",
  "Coche",
  "Casa",
  "Ocio",
  "Salud",
  "Ropa",
  "Suscripciones",
  "Trabajo",
  "Otros",
  "Ingresos",
];

const quickTemplates = [
  { merchant: "Mercadona", category: "Comida", amount: 25 },
  { merchant: "Gasolina", category: "Coche", amount: 30 },
  { merchant: "Alquiler", category: "Casa", amount: 400 },
  { merchant: "Capricho", category: "Ocio", amount: 10 },
  { merchant: "ChatGPT", category: "Suscripciones", amount: 22.99 },
  { merchant: "Apple Music", category: "Suscripciones", amount: 10.99 },
  { merchant: "Nomina", category: "Ingresos", amount: 1300, type: "income" },
  { merchant: "Otro gasto", category: "Otros", amount: 5 },
];

const rules = [
  { keywords: ["mercadona", "lidl", "aldi", "carrefour", "super", "eroski"], category: "Comida" },
  { keywords: ["cepsa", "repsol", "bp", "shell", "gasolina", "parking", "itv"], category: "Coche" },
  { keywords: ["alquiler", "iberdrola", "endesa", "agua", "alarma", "seguro hogar"], category: "Casa" },
  { keywords: ["spotify", "apple", "chatgpt", "netflix", "amazon prime"], category: "Suscripciones" },
  { keywords: ["farmacia", "dentista", "medico", "clinica"], category: "Salud" },
  { keywords: ["zara", "shein", "primark", "bershka", "stradivarius"], category: "Ropa" },
  { keywords: ["nomina", "salario", "contesta", "prosegur"], category: "Ingresos", type: "income" },
];

const defaultState = {
  settings: {
    monthlyBudget: 900,
    savingGoal: 200,
    cycleStartDay: 27,
    theme: "dark",
    accent: "ocean",
  },
  transactions: [],
};

let state = loadState();
let pendingImport = [];

const els = {
  themeToggle: document.querySelector("#themeToggle"),
  monthPicker: document.querySelector("#monthPicker"),
  periodLabel: document.querySelector("#periodLabel"),
  balanceLabel: document.querySelector("#balanceLabel"),
  balanceHint: document.querySelector("#balanceHint"),
  budgetRing: document.querySelector("#budgetRing"),
  budgetPercent: document.querySelector("#budgetPercent"),
  incomeStat: document.querySelector("#incomeStat"),
  expenseStat: document.querySelector("#expenseStat"),
  availableStat: document.querySelector("#availableStat"),
  transactionForm: document.querySelector("#transactionForm"),
  amountInput: document.querySelector("#amountInput"),
  typeInput: document.querySelector("#typeInput"),
  merchantInput: document.querySelector("#merchantInput"),
  categoryInput: document.querySelector("#categoryInput"),
  dateInput: document.querySelector("#dateInput"),
  noteInput: document.querySelector("#noteInput"),
  quickButtons: document.querySelector("#quickButtons"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  categoryBars: document.querySelector("#categoryBars"),
  movementList: document.querySelector("#movementList"),
  latestList: document.querySelector("#latestList"),
  csvFile: document.querySelector("#csvFile"),
  csvText: document.querySelector("#csvText"),
  previewCsv: document.querySelector("#previewCsv"),
  importPreview: document.querySelector("#importPreview"),
  paletteGrid: document.querySelector("#paletteGrid"),
  settingsForm: document.querySelector("#settingsForm"),
  monthlyBudgetInput: document.querySelector("#monthlyBudgetInput"),
  savingGoalInput: document.querySelector("#savingGoalInput"),
  cycleStartDayInput: document.querySelector("#cycleStartDayInput"),
  exportJson: document.querySelector("#exportJson"),
  exportCsv: document.querySelector("#exportCsv"),
  resetDemo: document.querySelector("#resetDemo"),
};

init();

function init() {
  applyAppearance();
  els.monthPicker.value = currentMonth();
  els.dateInput.value = today();
  els.monthlyBudgetInput.value = String(state.settings.monthlyBudget);
  els.savingGoalInput.value = String(state.settings.savingGoal);
  els.cycleStartDayInput.value = String(state.settings.cycleStartDay);

  fillSelect(els.categoryInput, categories);
  fillSelect(els.categoryFilter, ["Todas", ...categories]);
  renderQuickButtons();
  bindEvents();
  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  document.querySelectorAll(".tab-jump").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  els.themeToggle.addEventListener("click", () => {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    applyAppearance();
    save();
  });

  document.querySelectorAll(".palette-option").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.accent = button.dataset.accent || "ocean";
      applyAppearance();
      save();
    });
  });

  els.monthPicker.addEventListener("change", render);
  els.searchInput.addEventListener("input", renderMovements);
  els.categoryFilter.addEventListener("change", renderMovements);

  els.merchantInput.addEventListener("input", () => {
    const guess = categorize(els.merchantInput.value);
    if (guess.category) els.categoryInput.value = guess.category;
    if (guess.type) els.typeInput.value = guess.type;
  });

  els.transactionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const amount = parseMoney(els.amountInput.value);
    if (!amount) return;
    addTransaction({
      type: els.typeInput.value,
      amount,
      merchant: els.merchantInput.value.trim(),
      category: els.categoryInput.value,
      date: els.dateInput.value,
      note: els.noteInput.value.trim(),
      source: "manual",
      reviewed: true,
    });
    els.transactionForm.reset();
    els.typeInput.value = "expense";
    els.categoryInput.value = "Otros";
    els.dateInput.value = today();
  });

  els.csvFile.addEventListener("change", async () => {
    const file = els.csvFile.files?.[0];
    if (!file) return;
    els.csvText.value = await file.text();
  });

  els.previewCsv.addEventListener("click", () => previewImport());

  els.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.settings.monthlyBudget = parseMoney(els.monthlyBudgetInput.value) || 0;
    state.settings.savingGoal = parseMoney(els.savingGoalInput.value) || 0;
    state.settings.cycleStartDay = clampDay(parseMoney(els.cycleStartDayInput.value) || 27);
    save();
    render();
  });

  els.exportJson.addEventListener("click", () => download("gastos-mensuales-backup.json", JSON.stringify(state, null, 2), "application/json"));
  els.exportCsv.addEventListener("click", () => download("gastos-mensuales-movimientos.csv", toCsv(state.transactions), "text/csv"));
  els.resetDemo.addEventListener("click", () => {
    if (!confirm("Seguro que quieres vaciar todos los movimientos?")) return;
    state.transactions = [];
    save();
    render();
  });
}

function switchView(view) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  document.querySelectorAll(".view").forEach((panel) => panel.classList.remove("active"));
  document.querySelector(`#${view}View`).classList.add("active");
}

function render() {
  renderSummary();
  renderMovements();
  renderLatest();
  renderPalette();
}

function applyAppearance() {
  document.documentElement.dataset.theme = state.settings.theme || "dark";
  document.documentElement.dataset.accent = state.settings.accent || "ocean";
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", state.settings.theme === "dark" ? "#070b12" : "#f4f6fb");
  }
}

function renderPalette() {
  document.querySelectorAll(".palette-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.accent === (state.settings.accent || "ocean"));
  });
}

function renderSummary() {
  const txs = monthTransactions();
  const period = selectedPeriod();
  const income = sum(txs.filter((tx) => tx.type === "income"));
  const expense = sum(txs.filter((tx) => tx.type === "expense"));
  const balance = income - expense;
  const available = income || expense ? income - expense - state.settings.savingGoal : 0;
  const percent = state.settings.monthlyBudget ? Math.min(100, Math.round((expense / state.settings.monthlyBudget) * 100)) : 0;
  const circumference = 301.6;

  els.balanceLabel.textContent = money(balance);
  els.periodLabel.textContent = `Ciclo ${shortDate(period.start)} - ${shortDate(period.end)}`;
  els.balanceHint.textContent = balance >= 0 ? "Balance del ciclo" : "Te has pasado en este ciclo";
  els.incomeStat.textContent = money(income);
  els.expenseStat.textContent = money(expense);
  els.availableStat.textContent = money(available);
  els.budgetPercent.textContent = `${percent}%`;
  els.budgetRing.style.strokeDashoffset = String(circumference - (circumference * percent) / 100);
}

function renderMovements() {
  const txs = monthTransactions();
  const search = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const filtered = txs
    .filter((tx) => category === "Todas" || !category || tx.category === category)
    .filter((tx) => !search || `${tx.merchant} ${tx.category} ${tx.note}`.toLowerCase().includes(search))
    .sort((a, b) => b.date.localeCompare(a.date));

  renderCategoryBars(txs);
  els.movementList.innerHTML = "";

  if (!filtered.length) {
    els.movementList.innerHTML = `<div class="empty-state">No hay movimientos para este filtro.</div>`;
    return;
  }

  filtered.forEach((tx) => {
    const node = movementNode(tx);
    els.movementList.append(node);
  });
}

function renderLatest() {
  if (!els.latestList) return;
  const txs = monthTransactions()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  els.latestList.innerHTML = "";
  if (!txs.length) {
    els.latestList.innerHTML = `<div class="empty-state">Todavia no hay movimientos este mes.</div>`;
    return;
  }

  txs.forEach((tx) => {
    els.latestList.append(movementNode(tx));
  });
}

function renderCategoryBars(txs) {
  const expenses = txs.filter((tx) => tx.type === "expense");
  const total = sum(expenses) || 1;
  const rows = categories
    .filter((category) => category !== "Ingresos")
    .map((category) => ({ category, amount: sum(expenses.filter((tx) => tx.category === category)) }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  els.categoryBars.innerHTML = "";
  rows.slice(0, 6).forEach((row) => {
    const percent = Math.round((row.amount / total) * 100);
    const item = document.createElement("div");
    item.className = "category-bar";
    item.innerHTML = `
      <strong>${escapeHtml(row.category)}</strong>
      <div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div>
      <span>${money(row.amount)}</span>
    `;
    els.categoryBars.append(item);
  });
}

function renderQuickButtons() {
  els.quickButtons.innerHTML = "";
  quickTemplates.forEach((template) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<strong>${escapeHtml(template.merchant)}</strong><span>${money(template.amount)} · ${escapeHtml(template.category)}</span>`;
    button.addEventListener("click", () => {
      els.amountInput.value = String(template.amount).replace(".", ",");
      els.typeInput.value = template.type || "expense";
      els.merchantInput.value = template.merchant;
      els.categoryInput.value = template.category;
      els.dateInput.value = today();
      els.noteInput.focus();
    });
    els.quickButtons.append(button);
  });
}

function movementNode(tx) {
  const template = document.querySelector("#movementTemplate");
  const node = template.content.firstElementChild.cloneNode(true);
  node.querySelector(".movement-title").textContent = tx.merchant;
  node.querySelector(".movement-meta").textContent = `${formatDate(tx.date)} · ${tx.category}${tx.note ? ` · ${tx.note}` : ""}${tx.source === "csv" ? " · importado" : ""}`;
  const amount = node.querySelector(".movement-amount");
  amount.textContent = `${tx.type === "expense" ? "-" : "+"}${money(tx.amount)}`;
  amount.classList.add(tx.type);
  const deleteButton = node.querySelector(".movement-delete");
  if (String(tx.id).startsWith("preview-")) {
    deleteButton.hidden = true;
  } else {
    deleteButton.addEventListener("click", () => deleteTransaction(tx.id));
  }
  return node;
}

function previewImport() {
  const csv = els.csvText.value.trim();
  els.importPreview.innerHTML = "";
  pendingImport = parseCsvTransactions(csv);

  if (!pendingImport.length) {
    els.importPreview.innerHTML = `<div class="empty-state">No he podido detectar movimientos. Prueba exportando en CSV con fecha, concepto e importe.</div>`;
    return;
  }

  const duplicates = new Set(state.transactions.map((tx) => fingerprint(tx)));
  pendingImport = pendingImport.filter((tx) => !duplicates.has(fingerprint(tx)));

  const action = document.createElement("button");
  action.className = "primary";
  action.type = "button";
  action.textContent = `Importar ${pendingImport.length} movimientos`;
  action.addEventListener("click", () => {
    pendingImport.forEach(addTransaction);
    pendingImport = [];
    els.csvText.value = "";
    els.csvFile.value = "";
    els.importPreview.innerHTML = `<div class="empty-state">Importacion lista. Te he quitado duplicados obvios.</div>`;
  });
  els.importPreview.append(action);

  pendingImport.slice(0, 12).forEach((tx) => els.importPreview.append(movementNode({ ...tx, id: `preview-${crypto.randomUUID()}` })));
}

function parseCsvTransactions(csv) {
  if (!csv) return [];
  const rows = splitCsv(csv);
  if (rows.length < 2) return [];
  const header = rows[0].map((cell) => normalize(cell));
  const indexes = detectIndexes(header);

  if (indexes.date < 0 || indexes.amount < 0 || indexes.merchant < 0) return [];

  return rows.slice(1).map((row) => {
    const amountRaw = row[indexes.amount] || "";
    const amount = Math.abs(parseMoney(amountRaw));
    const signed = parseMoney(amountRaw);
    const merchant = (row[indexes.merchant] || "Movimiento").trim();
    const guess = categorize(merchant);
    return {
      type: signed < 0 ? "expense" : guess.type || "income",
      amount,
      merchant,
      category: guess.category || (signed < 0 ? "Otros" : "Ingresos"),
      date: parseDate(row[indexes.date]),
      note: "Importado del banco",
      source: "csv",
      reviewed: false,
    };
  }).filter((tx) => tx.amount && tx.date);
}

function splitCsv(text) {
  const delimiter = detectDelimiter(text);
  return text.split(/\r?\n/).filter(Boolean).map((line) => {
    const cells = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"' && quoted && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === delimiter && !quoted) {
        cells.push(cell.trim());
        cell = "";
      } else {
        cell += char;
      }
    }
    cells.push(cell.trim());
    return cells;
  });
}

function detectDelimiter(text) {
  const first = text.split(/\r?\n/)[0] || "";
  const options = [";", ",", "\t"];
  return options.sort((a, b) => first.split(b).length - first.split(a).length)[0];
}

function detectIndexes(header) {
  const find = (needles) => header.findIndex((cell) => needles.some((needle) => cell.includes(needle)));
  return {
    date: find(["fecha", "date", "operacion", "valor"]),
    amount: find(["importe", "amount", "cargo", "abono", "valor eur", "euros"]),
    merchant: find(["concepto", "descripcion", "description", "comercio", "merchant", "detalle"]),
  };
}

function addTransaction(tx) {
  state.transactions.push({
    id: tx.id || crypto.randomUUID(),
    type: tx.type || "expense",
    amount: Number(tx.amount),
    merchant: tx.merchant || "Movimiento",
    category: tx.category || "Otros",
    date: tx.date || today(),
    note: tx.note || "",
    source: tx.source || "manual",
    reviewed: tx.reviewed ?? true,
  });
  save();
  render();
}

function deleteTransaction(id) {
  if (String(id).startsWith("preview-")) return;
  state.transactions = state.transactions.filter((tx) => tx.id !== id);
  save();
  render();
}

function monthTransactions() {
  const period = selectedPeriod();
  return state.transactions.filter((tx) => tx.date >= period.start && tx.date <= period.end);
}

function selectedPeriod() {
  const [year, month] = (els.monthPicker.value || currentMonth()).split("-").map(Number);
  const startDay = clampDay(state.settings.cycleStartDay || 27);
  const start = makeDate(year, month, startDay);
  const next = makeDate(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1, startDay);
  const endDate = new Date(`${next}T12:00:00`);
  endDate.setDate(endDate.getDate() - 1);
  return { start, end: endDate.toISOString().slice(0, 10) };
}

function makeDate(year, month, preferredDay) {
  const day = Math.min(preferredDay, daysInMonth(year, month));
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function clampDay(day) {
  return Math.max(1, Math.min(31, Math.round(Number(day) || 27)));
}

function categorize(text) {
  const normalized = normalize(text);
  const rule = rules.find((item) => item.keywords.some((keyword) => normalized.includes(keyword)));
  if (!rule) return {};
  return { category: rule.category, type: rule.type };
}

function parseMoney(value) {
  if (typeof value === "number") return value;
  const cleaned = String(value)
    .trim()
    .replace(/\s/g, "")
    .replace(/[€]/g, "")
    .replace(/\.(?=\d{3}(,|\.|$))/g, "")
    .replace(",", ".");
  const number = Number.parseFloat(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function parseDate(value) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) return "";
  const [, day, month, year] = match;
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
}

function shortDate(value) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
}

function money(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value || 0);
}

function sum(txs) {
  return txs.reduce((total, tx) => total + Number(tx.amount || 0), 0);
}

function fillSelect(select, values) {
  select.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return defaultState;
    return {
      ...defaultState,
      ...saved,
      settings: { ...defaultState.settings, ...saved.settings },
      transactions: (saved.transactions || []).filter((tx) => tx.source !== "demo"),
    };
  } catch {
    return defaultState;
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentMonth() {
  const now = new Date(`${today()}T12:00:00`);
  const startDay = clampDay(state?.settings?.cycleStartDay || 27);
  if (now.getDate() >= startDay) return today().slice(0, 7);
  now.setMonth(now.getMonth() - 1);
  return now.toISOString().slice(0, 7);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function fingerprint(tx) {
  return `${tx.date}|${Math.round(Number(tx.amount) * 100)}|${normalize(tx.merchant).slice(0, 28)}`;
}

function toCsv(transactions) {
  const header = ["fecha", "tipo", "importe", "concepto", "categoria", "nota", "origen"];
  const rows = transactions.map((tx) => [tx.date, tx.type, tx.amount, tx.merchant, tx.category, tx.note, tx.source]);
  return [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}
