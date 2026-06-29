const STORAGE_KEY = "gastos-ainhoa-v1";

const memoryStorage = (() => {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
  };
})();

const storage = (() => {
  try {
    const testKey = "__gastos_storage_test__";
    globalThis.localStorage?.setItem(testKey, "1");
    globalThis.localStorage?.removeItem(testKey);
    return globalThis.localStorage || memoryStorage;
  } catch {
    return memoryStorage;
  }
})();

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

const categoryIcons = {
  Comida: "🛒",
  Coche: "⛽",
  Casa: "🏠",
  Ocio: "✨",
  Salud: "💊",
  Ropa: "👗",
  Suscripciones: "🔁",
  Trabajo: "💼",
  Otros: "•",
  Ingresos: "↑",
};

const quickTemplates = [
  { merchant: "Mercadona", category: "Comida", amount: 25, type: "expense" },
  { merchant: "Gasolina", category: "Coche", amount: 30, type: "expense" },
  { merchant: "Alquiler", category: "Casa", amount: 400, type: "expense" },
  { merchant: "Capricho", category: "Ocio", amount: 10, type: "expense" },
  { merchant: "ChatGPT", category: "Suscripciones", amount: 22.99, type: "expense" },
  { merchant: "Apple Music", category: "Suscripciones", amount: 10.99, type: "expense" },
  { merchant: "Nómina", category: "Ingresos", amount: 1300, type: "income" },
  { merchant: "Otro gasto", category: "Otros", amount: 5, type: "expense" },
];

const rules = [
  { keywords: ["mercadona", "lidl", "aldi", "carrefour", "super", "eroski", "dia ", "bonarea"], category: "Comida" },
  { keywords: ["cepsa", "repsol", "bp", "shell", "gasolina", "parking", "itv", "hyundai", "feu vert", "norauto"], category: "Coche" },
  { keywords: ["alquiler", "iberdrola", "endesa", "agua", "alarma", "seguro hogar", "gas", "luz"], category: "Casa" },
  { keywords: ["spotify", "apple", "chatgpt", "netflix", "amazon prime", "prime video", "disney", "hbo", "max.com"], category: "Suscripciones" },
  { keywords: ["farmacia", "dentista", "medico", "médico", "clinica", "clínica", "hospital"], category: "Salud" },
  { keywords: ["zara", "shein", "primark", "bershka", "stradivarius", "pull&bear", "mango"], category: "Ropa" },
  { keywords: ["nomina", "nómina", "salario", "contesta", "prosegur", "bizum recibido", "transferencia recibida"], category: "Ingresos", type: "income" },
];

const paletteChrome = {
  sunset: "#ff725e",
  candy: "#b75cef",
  aurora: "#35bdf2",
  ocean: "#2563eb",
  graphite: "#334155",
};

const accentLabels = {
  sunset: "Sunset",
  candy: "Candy",
  aurora: "Aurora",
  ocean: "Ocean",
  graphite: "Grafito",
};

const defaultState = {
  settings: {
    monthlyBudget: 900,
    savingGoal: 200,
    cycleStartDay: 27,
    theme: "dark",
    accent: "sunset",
  },
  transactions: [],
};

let state = loadState();
let pendingImport = [];
let editingId = null;
let toastTimer = null;

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
  quickButtonsAdd: document.querySelector("#quickButtonsAdd"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  categoryBars: document.querySelector("#categoryBars"),
  movementList: document.querySelector("#movementList"),
  latestList: document.querySelector("#latestList"),
  csvFile: document.querySelector("#csvFile"),
  csvFileTrigger: document.querySelector("#csvFileTrigger"),
  csvFileName: document.querySelector("#csvFileName"),
  csvText: document.querySelector("#csvText"),
  previewCsv: document.querySelector("#previewCsv"),
  importPreview: document.querySelector("#importPreview"),
  paletteGrid: document.querySelector("#paletteGrid"),
  expenseAction: document.querySelector("#expenseAction"),
  incomeAction: document.querySelector("#incomeAction"),
  summaryAction: document.querySelector("#summaryAction"),
  settingsForm: document.querySelector("#settingsForm"),
  monthlyBudgetInput: document.querySelector("#monthlyBudgetInput"),
  savingGoalInput: document.querySelector("#savingGoalInput"),
  cycleStartDayInput: document.querySelector("#cycleStartDayInput"),
  exportJson: document.querySelector("#exportJson"),
  exportCsv: document.querySelector("#exportCsv"),
  resetDemo: document.querySelector("#resetDemo"),
  editSheet: document.querySelector("#editSheet"),
  editForm: document.querySelector("#editForm"),
  editAmountInput: document.querySelector("#editAmountInput"),
  editTypeInput: document.querySelector("#editTypeInput"),
  editMerchantInput: document.querySelector("#editMerchantInput"),
  editCategoryInput: document.querySelector("#editCategoryInput"),
  editDateInput: document.querySelector("#editDateInput"),
  editNoteInput: document.querySelector("#editNoteInput"),
  toast: document.querySelector("#toast"),
};

init();

function init() {
  applyAppearance();
  els.monthPicker.value = currentMonth();
  els.dateInput.value = today();
  els.monthlyBudgetInput.value = String(state.settings.monthlyBudget || "");
  els.savingGoalInput.value = String(state.settings.savingGoal || "");
  els.cycleStartDayInput.value = String(state.settings.cycleStartDay || 27);

  fillSelect(els.categoryInput, categories);
  fillSelect(els.editCategoryInput, categories);
  fillSelect(els.categoryFilter, ["Todas", ...categories]);
  renderQuickButtons();
  bindEvents();
  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").then((registration) => registration.update()).catch(() => {});
  }
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  document.querySelectorAll(".tab-jump").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view, { top: true }));
  });

  document.querySelector(".avatar-button")?.addEventListener("click", () => switchView("settings", { top: true }));
  els.summaryAction?.addEventListener("click", () => {
    switchView("quick");
    window.setTimeout(() => document.querySelector("#summaryCard")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  });

  els.themeToggle.addEventListener("click", () => {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    applyAppearance();
    save();
    showToast(state.settings.theme === "dark" ? "Modo oscuro" : "Modo claro");
  });

  document.querySelectorAll(".palette-option").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.accent = normalizeAccent(button.dataset.accent);
      applyAppearance();
      save();
      showToast(`Paleta ${accentLabels[state.settings.accent] || "actualizada"}`);
    });
  });

  els.expenseAction?.addEventListener("click", () => prepareQuickEntry("expense"));
  els.incomeAction?.addEventListener("click", () => prepareQuickEntry("income"));

  els.monthPicker.addEventListener("change", render);
  els.searchInput.addEventListener("input", renderMovements);
  els.categoryFilter.addEventListener("change", renderMovements);

  els.merchantInput.addEventListener("input", () => applyCategoryGuess(els.merchantInput, els.categoryInput, els.typeInput));
  els.editMerchantInput.addEventListener("input", () => applyCategoryGuess(els.editMerchantInput, els.editCategoryInput, els.editTypeInput));

  els.transactionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const amount = Math.abs(parseMoney(els.amountInput.value));
    if (!amount) {
      showToast("Pon un importe válido");
      return;
    }
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
    showToast("Movimiento guardado");
  });

  els.csvFileTrigger?.addEventListener("click", () => els.csvFile?.click());

  els.csvFile.addEventListener("change", async () => {
    const file = els.csvFile.files?.[0];
    if (!file) return;
    els.csvText.value = await file.text();
    if (els.csvFileName) els.csvFileName.textContent = file.name;
    showToast("CSV cargado");
  });

  els.previewCsv.addEventListener("click", () => previewImport());

  els.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.settings.monthlyBudget = parseMoney(els.monthlyBudgetInput.value) || 0;
    state.settings.savingGoal = parseMoney(els.savingGoalInput.value) || 0;
    state.settings.cycleStartDay = clampDay(parseMoney(els.cycleStartDayInput.value) || 27);
    save();
    render();
    showToast("Ajustes guardados");
  });

  els.exportJson.addEventListener("click", () => {
    download("gastos-mensuales-backup.json", JSON.stringify(state, null, 2), "application/json;charset=utf-8");
    showToast("JSON descargado");
  });

  els.exportCsv.addEventListener("click", () => {
    download("gastos-mensuales-movimientos.csv", toCsv(state.transactions), "text/csv;charset=utf-8");
    showToast("CSV descargado");
  });

  els.resetDemo.addEventListener("click", () => {
    if (!confirm("¿Seguro que quieres vaciar todos los movimientos?")) return;
    state.transactions = [];
    save();
    render();
    showToast("Movimientos vaciados");
  });

  document.querySelectorAll("[data-close-edit]").forEach((button) => button.addEventListener("click", closeEditor));
  els.editForm.addEventListener("submit", saveEditor);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.editSheet.hidden) closeEditor();
  });
}

function switchView(view, options = {}) {
  if (!view || !document.querySelector(`#${view}View`)) return;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  document.querySelectorAll(".view").forEach((panel) => panel.classList.remove("active"));
  document.querySelector(`#${view}View`).classList.add("active");
  if (options.top) window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 20);
  if (view === "list") window.setTimeout(() => els.searchInput?.focus({ preventScroll: true }), 160);
  if (view === "add") window.setTimeout(() => els.amountInput?.focus({ preventScroll: true }), 160);
}

function render() {
  renderSummary();
  renderMovements();
  renderLatest();
  renderPalette();
}

function applyAppearance() {
  state.settings.theme = state.settings.theme === "light" ? "light" : "dark";
  state.settings.accent = normalizeAccent(state.settings.accent);
  document.documentElement.dataset.theme = state.settings.theme;
  document.documentElement.dataset.accent = state.settings.accent;
  const color = themeColorForAccent(state.settings.accent, state.settings.theme);
  document.documentElement.style.backgroundColor = color;
  document.body.style.backgroundColor = color;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", color));
  renderPalette();
}

function renderPalette() {
  document.querySelectorAll(".palette-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.accent === normalizeAccent(state.settings.accent));
  });
}

function prepareQuickEntry(type) {
  switchView("add", { top: true });
  els.typeInput.value = type;
  els.categoryInput.value = type === "income" ? "Ingresos" : "Otros";
  els.dateInput.value = today();
  window.setTimeout(() => {
    document.querySelector(".add-view-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => els.amountInput.focus(), 220);
  }, 80);
}

function normalizeAccent(accent) {
  const aliases = { rose: "sunset", violet: "candy", mint: "aurora" };
  const value = aliases[accent] || accent || "sunset";
  return ["sunset", "candy", "aurora", "ocean", "graphite"].includes(value) ? value : "sunset";
}

function themeColorForAccent(accent, theme = state.settings.theme) {
  if (theme === "dark") {
    return {
      sunset: "#27152d",
      candy: "#24133e",
      aurora: "#0f1f3d",
      ocean: "#0c1630",
      graphite: "#020617",
    }[normalizeAccent(accent)];
  }
  return paletteChrome[normalizeAccent(accent)] || paletteChrome.sunset;
}

function renderSummary() {
  const txs = monthTransactions();
  const period = selectedPeriod();
  const income = sum(txs.filter((tx) => tx.type === "income"));
  const expense = sum(txs.filter((tx) => tx.type === "expense"));
  const balance = income - expense;
  const available = income || expense ? balance - Number(state.settings.savingGoal || 0) : 0;
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
  const search = normalize(els.searchInput.value);
  const category = els.categoryFilter.value;
  const filtered = txs
    .filter((tx) => category === "Todas" || !category || tx.category === category)
    .filter((tx) => !search || normalize(`${tx.merchant} ${tx.category} ${tx.note}`).includes(search))
    .sort(compareTransactions);

  renderCategoryBars(txs);
  els.movementList.innerHTML = "";

  if (!filtered.length) {
    els.movementList.innerHTML = `<div class="empty-state">No hay movimientos para este filtro.</div>`;
    return;
  }

  filtered.forEach((tx) => els.movementList.append(movementNode(tx)));
}

function renderLatest() {
  if (!els.latestList) return;
  const txs = monthTransactions().sort(compareTransactions).slice(0, 4);
  els.latestList.innerHTML = "";
  if (!txs.length) {
    els.latestList.innerHTML = `<div class="empty-state">Todavía no hay movimientos este ciclo.</div>`;
    return;
  }
  txs.forEach((tx) => els.latestList.append(movementNode(tx)));
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
  if (!rows.length) return;

  rows.slice(0, 6).forEach((row) => {
    const percent = Math.max(4, Math.round((row.amount / total) * 100));
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
  [els.quickButtons, els.quickButtonsAdd].filter(Boolean).forEach((container) => {
    container.innerHTML = "";
    quickTemplates.forEach((template) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `<strong>${escapeHtml(template.merchant)}</strong><span>${money(template.amount)} · ${escapeHtml(template.category)}</span>`;
      button.addEventListener("click", () => {
        switchView("add", { top: true });
        els.amountInput.value = String(template.amount).replace(".", ",");
        els.typeInput.value = template.type || "expense";
        els.merchantInput.value = template.merchant;
        els.categoryInput.value = template.category;
        els.dateInput.value = today();
        window.setTimeout(() => els.noteInput.focus(), 180);
      });
      container.append(button);
    });
  });
}

function movementNode(tx) {
  const template = document.querySelector("#movementTemplate");
  const node = template.content.firstElementChild.cloneNode(true);
  const preview = String(tx.id || "").startsWith("preview-");
  node.querySelector(".movement-icon").textContent = categoryIcons[tx.category] || categoryIcons.Otros;
  node.querySelector(".movement-title").textContent = tx.merchant;
  const metaParts = [formatDate(tx.date), tx.category];
  const generatedImportNote = normalize(tx.note).startsWith("importado del banco");
  if (tx.note && !generatedImportNote) metaParts.push(tx.note);
  if (tx.source === "csv") metaParts.push("importado");
  if (tx.reviewed === false) metaParts.push("revisar");
  node.querySelector(".movement-meta").textContent = metaParts.join(" · ");
  const amount = node.querySelector(".movement-amount");
  amount.textContent = `${tx.type === "expense" ? "-" : "+"}${money(tx.amount)}`;
  amount.classList.add(tx.type);

  const editButton = node.querySelector(".movement-edit");
  const deleteButton = node.querySelector(".movement-delete");
  if (preview) {
    editButton.hidden = true;
    deleteButton.hidden = true;
  } else {
    editButton.addEventListener("click", () => openEditor(tx.id));
    deleteButton.addEventListener("click", () => deleteTransaction(tx.id));
  }
  return node;
}

function previewImport() {
  const csv = els.csvText.value.trim();
  els.importPreview.innerHTML = "";
  const parsed = parseCsvTransactions(csv);
  const duplicateFingerprints = new Set(state.transactions.map((tx) => fingerprint(tx)));
  pendingImport = parsed.filter((tx) => !duplicateFingerprints.has(fingerprint(tx)));
  const duplicateCount = parsed.length - pendingImport.length;

  if (!parsed.length) {
    els.importPreview.innerHTML = `<div class="empty-state">No he podido detectar movimientos. Prueba con un CSV que tenga fecha, concepto e importe, o cargo/abono separados.</div>`;
    return;
  }

  if (!pendingImport.length) {
    els.importPreview.innerHTML = `<div class="empty-state">Todos los movimientos del CSV ya estaban importados. Ni duplicados ni dramas, raro en la informática.</div>`;
    return;
  }

  const action = document.createElement("button");
  action.className = "primary";
  action.type = "button";
  action.textContent = `Importar ${pendingImport.length} movimientos`;
  action.addEventListener("click", importPendingTransactions);
  els.importPreview.append(action);

  if (duplicateCount) {
    const note = document.createElement("div");
    note.className = "empty-state";
    note.textContent = `${duplicateCount} duplicado${duplicateCount === 1 ? "" : "s"} detectado${duplicateCount === 1 ? "" : "s"} y omitido${duplicateCount === 1 ? "" : "s"}.`;
    els.importPreview.append(note);
  }

  pendingImport.slice(0, 16).forEach((tx) => els.importPreview.append(movementNode({ ...tx, id: `preview-${makeId()}` })));
}

function importPendingTransactions() {
  if (!pendingImport.length) return;
  const imported = pendingImport.map((tx) => normalizeTransaction(tx));
  state.transactions = [...state.transactions, ...imported];
  pendingImport = [];
  els.csvText.value = "";
  els.csvFile.value = "";
  if (els.csvFileName) els.csvFileName.textContent = "O pega el CSV directamente aquí abajo";
  save();
  render();
  els.importPreview.innerHTML = `<div class="empty-state">Importación lista. Los movimientos dudosos quedan marcados como “revisar”.</div>`;
  showToast(`${imported.length} movimientos importados`);
}

function parseCsvTransactions(csv) {
  if (!csv) return [];
  const rows = splitCsv(csv).filter((row) => row.some((cell) => String(cell || "").trim()));
  if (rows.length < 2) return [];
  const header = rows[0].map((cell) => normalize(cell));
  const indexes = detectIndexes(header);

  if (indexes.date < 0 || indexes.merchant < 0 || (indexes.amount < 0 && indexes.debit < 0 && indexes.credit < 0)) return [];

  return rows.slice(1).map((row) => parseCsvRow(row, indexes, header)).filter((tx) => tx.amount && tx.date);
}

function parseCsvRow(row, indexes, header) {
  const merchant = (row[indexes.merchant] || "Movimiento").trim() || "Movimiento";
  const guess = categorize(merchant);
  const date = parseDate(row[indexes.date]);
  let type = "expense";
  let amount = 0;
  let confidence = "medium";
  const amountHeader = indexes.amount >= 0 ? header[indexes.amount] : "";

  if (indexes.debit >= 0 || indexes.credit >= 0) {
    const debit = indexes.debit >= 0 ? Math.abs(parseMoney(row[indexes.debit])) : 0;
    const credit = indexes.credit >= 0 ? Math.abs(parseMoney(row[indexes.credit])) : 0;
    if (debit && credit) {
      amount = Math.abs(credit - debit);
      type = credit >= debit ? "income" : "expense";
      confidence = "low";
    } else if (debit) {
      amount = debit;
      type = "expense";
      confidence = "high";
    } else if (credit) {
      amount = credit;
      type = "income";
      confidence = "high";
    }
  }

  if (!amount && indexes.amount >= 0) {
    const signed = parseMoney(row[indexes.amount]);
    amount = Math.abs(signed);
    if (signed < 0) {
      type = "expense";
      confidence = "high";
    } else if (signed > 0 && columnLooksLikeIncome(amountHeader)) {
      type = "income";
      confidence = "high";
    } else if (signed > 0 && columnLooksLikeExpense(amountHeader)) {
      type = "expense";
      confidence = "high";
    } else if (guess.type) {
      type = guess.type;
      confidence = "medium";
    } else {
      type = "expense";
      confidence = "low";
    }
  }

  const category = guess.category || (type === "income" ? "Ingresos" : "Otros");
  return {
    type,
    amount,
    merchant,
    category,
    date,
    note: confidence === "low" ? "Importado del banco · revisar tipo" : "Importado del banco",
    source: "csv",
    reviewed: confidence !== "low",
  };
}

function splitCsv(text) {
  const delimiter = detectDelimiter(text);
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows;
}

function detectDelimiter(text) {
  const first = text.split(/\r?\n/).find((line) => line.trim()) || "";
  const options = [";", ",", "\t", "|"];
  return options.sort((a, b) => first.split(b).length - first.split(a).length)[0];
}

function detectIndexes(header) {
  const find = (needles, exclude = []) => header.findIndex((cell) => needles.some((needle) => cell.includes(needle)) && !exclude.some((bad) => cell.includes(bad)));
  const debit = find(["cargo", "cargos", "adeudo", "debe", "debito", "débito", "retirada", "pago", "salida"], ["abono", "haber"]);
  const credit = find(["abono", "abonos", "haber", "credito", "crédito", "ingreso", "cobro", "entrada"], ["cargo", "debe"]);
  const amount = find(["importe", "amount", "cantidad", "euros", "valor eur", "valor €", "movimiento"], ["saldo"]);
  return {
    date: find(["fecha operacion", "fecha operación", "fecha valor", "fecha", "date"]),
    debit,
    credit,
    amount,
    merchant: find(["concepto", "descripcion", "descripción", "description", "comercio", "merchant", "detalle", "beneficiario", "ordenante"]),
  };
}

function columnLooksLikeExpense(headerCell) {
  return ["cargo", "cargos", "adeudo", "debe", "debito", "débito", "pago", "retirada", "salida"].some((needle) => headerCell.includes(needle));
}

function columnLooksLikeIncome(headerCell) {
  return ["abono", "abonos", "haber", "credito", "crédito", "ingreso", "cobro", "entrada"].some((needle) => headerCell.includes(needle));
}

function addTransaction(tx) {
  state.transactions.push(normalizeTransaction(tx));
  save();
  render();
}

function normalizeTransaction(tx) {
  return {
    id: tx.id || makeId(),
    type: tx.type === "income" ? "income" : "expense",
    amount: Math.abs(Number(tx.amount)) || 0,
    merchant: String(tx.merchant || "Movimiento").trim() || "Movimiento",
    category: categories.includes(tx.category) ? tx.category : "Otros",
    date: parseDate(tx.date) || today(),
    note: String(tx.note || "").trim(),
    source: tx.source || "manual",
    reviewed: tx.reviewed ?? true,
  };
}

function deleteTransaction(id) {
  if (String(id).startsWith("preview-")) return;
  state.transactions = state.transactions.filter((tx) => tx.id !== id);
  save();
  render();
  showToast("Movimiento eliminado");
}

function openEditor(id) {
  const tx = state.transactions.find((item) => item.id === id);
  if (!tx) return;
  editingId = id;
  els.editAmountInput.value = formatInputAmount(tx.amount);
  els.editTypeInput.value = tx.type;
  els.editMerchantInput.value = tx.merchant;
  els.editCategoryInput.value = categories.includes(tx.category) ? tx.category : "Otros";
  els.editDateInput.value = tx.date;
  els.editNoteInput.value = tx.note || "";
  els.editSheet.hidden = false;
  window.setTimeout(() => els.editAmountInput.focus(), 80);
}

function closeEditor() {
  editingId = null;
  els.editSheet.hidden = true;
  els.editForm.reset();
}

function saveEditor(event) {
  event.preventDefault();
  if (!editingId) return;
  const index = state.transactions.findIndex((tx) => tx.id === editingId);
  if (index < 0) return;
  const amount = Math.abs(parseMoney(els.editAmountInput.value));
  if (!amount) {
    showToast("Pon un importe válido");
    return;
  }
  state.transactions[index] = normalizeTransaction({
    ...state.transactions[index],
    type: els.editTypeInput.value,
    amount,
    merchant: els.editMerchantInput.value.trim(),
    category: els.editCategoryInput.value,
    date: els.editDateInput.value,
    note: els.editNoteInput.value.trim(),
    reviewed: true,
  });
  save();
  render();
  closeEditor();
  showToast("Movimiento actualizado");
}

function monthTransactions() {
  const period = selectedPeriod();
  return state.transactions.filter((tx) => tx.date >= period.start && tx.date <= period.end);
}

function selectedPeriod() {
  const [year, month] = (els.monthPicker.value || currentMonth()).split("-").map(Number);
  const startDay = clampDay(state.settings.cycleStartDay || 27);
  const start = makeDate(year, month, startDay);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const next = localDateFromParts(nextYear, nextMonth, Math.min(startDay, daysInMonth(nextYear, nextMonth)));
  next.setDate(next.getDate() - 1);
  return { start, end: formatLocalDate(next) };
}

function makeDate(year, month, preferredDay) {
  const day = Math.min(preferredDay, daysInMonth(year, month));
  return formatLocalDate(localDateFromParts(year, month, day));
}

function localDateFromParts(year, month, day) {
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
}

function daysInMonth(year, month) {
  return new Date(Number(year), Number(month), 0).getDate();
}

function clampDay(day) {
  return Math.max(1, Math.min(31, Math.round(Number(day) || 27)));
}

function categorize(text) {
  const normalized = normalize(text);
  const rule = rules.find((item) => item.keywords.some((keyword) => normalized.includes(normalize(keyword))));
  if (!rule) return {};
  return { category: rule.category, type: rule.type };
}

function applyCategoryGuess(input, categorySelect, typeSelect) {
  const guess = categorize(input.value);
  if (guess.category) categorySelect.value = guess.category;
  if (guess.type) typeSelect.value = guess.type;
}

function parseMoney(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  let raw = String(value ?? "").trim();
  if (!raw) return 0;
  const negative = /\(.*\)/.test(raw) || raw.includes("-");
  raw = raw
    .replace(/[€$£]/g, "")
    .replace(/\s|\u00a0/g, "")
    .replace(/[()+]/g, "")
    .replace(/-/g, "");

  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    raw = raw.split(thousands).join("").replace(decimal, ".");
  } else if (lastComma >= 0) {
    const decimals = raw.length - lastComma - 1;
    raw = decimals > 0 && decimals <= 2 ? raw.replace(",", ".") : raw.replace(/,/g, "");
  } else if (lastDot >= 0) {
    const decimals = raw.length - lastDot - 1;
    raw = decimals > 0 && decimals <= 2 ? raw : raw.replace(/\./g, "");
  }

  const number = Number.parseFloat(raw);
  if (!Number.isFinite(number)) return 0;
  return negative ? -number : number;
}

function parseDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (match) {
    const [, day, month, year] = match;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return makeDate(Number(fullYear), Number(month), Number(day));
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : formatLocalDate(parsed);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
}

function shortDate(value) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
}

function money(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value) || 0);
}

function formatInputAmount(value) {
  return String(Number(value || 0).toFixed(2)).replace(".", ",");
}

function sum(txs) {
  return txs.reduce((total, tx) => total + Number(tx.amount || 0), 0);
}

function compareTransactions(a, b) {
  const byDate = b.date.localeCompare(a.date);
  if (byDate) return byDate;
  return String(b.id).localeCompare(String(a.id));
}

function fillSelect(select, values) {
  select.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
}

function loadState() {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!saved) return structuredCloneSafe(defaultState);
    return {
      ...structuredCloneSafe(defaultState),
      ...saved,
      settings: { ...defaultState.settings, ...(saved.settings || {}) },
      transactions: (saved.transactions || []).map(normalizeLoadedTransaction).filter(Boolean),
    };
  } catch {
    return structuredCloneSafe(defaultState);
  }
}

function normalizeLoadedTransaction(tx) {
  if (!tx) return null;
  return normalizeTransaction({
    ...tx,
    id: tx.id || makeId(),
    source: tx.source === "demo" ? "manual" : tx.source,
  });
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function save() {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function currentMonth() {
  const now = localDateFromParts(...today().split("-").map(Number));
  const startDay = clampDay(state?.settings?.cycleStartDay || 27);
  if (now.getDate() >= startDay) return today().slice(0, 7);
  now.setMonth(now.getMonth() - 1);
  return formatLocalDate(now).slice(0, 7);
}

function today() {
  return formatLocalDate(new Date());
}

function formatLocalDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function fingerprint(tx) {
  return `${tx.date}|${tx.type}|${Math.round(Number(tx.amount) * 100)}|${normalize(tx.merchant).slice(0, 32)}`;
}

function toCsv(transactions) {
  const header = ["fecha", "tipo", "importe", "concepto", "categoria", "nota", "origen", "revisado"];
  const rows = transactions.map((tx) => [tx.date, tx.type, tx.amount, tx.merchant, tx.category, tx.note, tx.source, tx.reviewed ? "si" : "no"]);
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
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => els.toast.classList.remove("show"), 1500);
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}
