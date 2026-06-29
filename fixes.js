const paletteChrome = {
  sunset: "#ff7a66",
  candy: "#ff8ec7",
  aurora: "#22d3ee",
  ocean: "#38bdf8",
  graphite: "#64748b",
};

const labels = {
  sunset: "Sunset",
  candy: "Candy",
  aurora: "Aurora",
  ocean: "Ocean",
  graphite: "Grafito",
};

const STORAGE_KEY = "gastos-ainhoa-v1";
let toastTimer;

initPolish();

function initPolish() {
  ensureToast();
  syncChrome();
  bindPolishButtons();

  new MutationObserver(syncChrome).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-accent", "data-theme"],
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => registration?.update()).catch(() => {});
  }
}

function bindPolishButtons() {
  document.querySelector(".avatar-button")?.addEventListener("click", () => switchTo("settings", { top: true }));

  document.querySelector(".search-pill")?.addEventListener("click", () => {
    switchTo("list", { top: true });
    window.setTimeout(() => document.querySelector("#searchInput")?.focus(), 180);
  });

  document.querySelector(".top-action")?.addEventListener("click", () => {
    switchTo("quick", { top: true });
    window.setTimeout(() => document.querySelector(".progress-card")?.scrollIntoView({ behavior: "smooth", block: "center" }), 220);
  });

  document.querySelector("#expenseAction")?.addEventListener("click", () => scrollEntry("Gasto listo"));
  document.querySelector("#incomeAction")?.addEventListener("click", () => scrollEntry("Ingreso listo"));

  document.querySelector("#paletteGrid")?.addEventListener("click", (event) => {
    const button = event.target.closest(".palette-option");
    if (!button) return;
    window.setTimeout(() => {
      syncChrome();
      showToast(`Fondo ${labels[currentAccent()] || "cambiado"}`);
    }, 40);
  });

  document.querySelector("#settingsForm")?.addEventListener("submit", () => window.setTimeout(() => showToast("Ajustes guardados"), 40));
  document.querySelector("#exportJson")?.addEventListener("click", () => showToast("Copia JSON descargada"));
  document.querySelector("#exportCsv")?.addEventListener("click", () => showToast("CSV descargado"));
  document.querySelector("#resetDemo")?.addEventListener("click", () => window.setTimeout(() => showToast("Movimientos vaciados"), 80));
}

function switchTo(view, options = {}) {
  const navButton = document.querySelector(`.tab[data-view="${view}"]`);
  if (navButton) navButton.click();
  if (options.top) window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollEntry(message) {
  window.setTimeout(() => {
    document.querySelector(".quick-add-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.querySelector("#amountInput")?.focus();
    showToast(message);
  }, 180);
}

function currentAccent() {
  const rootAccent = document.documentElement.dataset.accent;
  if (paletteChrome[rootAccent]) return rootAccent;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return paletteChrome[saved?.settings?.accent] ? saved.settings.accent : "sunset";
  } catch {
    return "sunset";
  }
}

function syncChrome() {
  const color = paletteChrome[currentAccent()] || paletteChrome.sunset;
  document.documentElement.style.backgroundColor = color;
  document.body.style.backgroundColor = color;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", color));
}

function ensureToast() {
  if (document.querySelector("#toast")) return;
  const toast = document.createElement("div");
  toast.id = "toast";
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.append(toast);
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1400);
}
