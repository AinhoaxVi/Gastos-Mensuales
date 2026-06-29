const paletteChrome = {
  sunset: "#ff7a66",
  candy: "#ff8ec7",
  aurora: "#22d3ee",
  ocean: "#38bdf8",
  graphite: "#64748b",
};

const accentLabels = {
  sunset: "Sunset",
  candy: "Candy",
  aurora: "Aurora",
  ocean: "Ocean",
  graphite: "Grafito",
};

const LOCAL_KEY = "gastos-ainhoa-v1";
let toastTimer = null;
let lastTouchEnd = 0;

initPolish();

function initPolish() {
  ensureToast();
  syncChrome();
  bindNavigationPolish();
  bindActionPolish();
  bindNoZoomGuards();

  new MutationObserver(syncChrome).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-accent", "data-theme"],
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => registration?.update()).catch(() => {});
  }
}

function bindNavigationPolish() {
  document.querySelectorAll(".tab, .tab-jump").forEach((button) => {
    button.addEventListener("click", () => {
      window.setTimeout(() => {
        document.activeElement?.blur?.();
      }, 20);
    });
  });

  document.querySelector(".avatar-button")?.addEventListener("click", () => {
    switchTo("settings", { top: true });
  });

  document.querySelector(".search-pill")?.addEventListener("click", () => {
    switchTo("list", { top: true, focus: "#searchInput" });
  });

  document.querySelector("#summaryAction")?.addEventListener("click", () => {
    switchTo("quick", { top: true });
    window.setTimeout(() => {
      document.querySelector(".progress-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  });
}

function bindActionPolish() {
  document.querySelector("#expenseAction")?.addEventListener("click", () => {
    showToast("Añadir gasto");
    scrollToEntry("expense");
  });

  document.querySelector("#incomeAction")?.addEventListener("click", () => {
    showToast("Añadir ingreso");
    scrollToEntry("income");
  });

  document.querySelector("#paletteGrid")?.addEventListener("click", (event) => {
    const button = event.target.closest(".palette-option");
    if (!button) return;
    window.setTimeout(() => {
      syncChrome();
      const active = document.documentElement.dataset.accent || currentAccent();
      showToast(`Fondo ${accentLabels[active] || "actualizado"}`);
    }, 40);
  });

  document.querySelector("#settingsForm")?.addEventListener("submit", () => {
    window.setTimeout(() => showToast("Ajustes guardados"), 30);
  });

  document.querySelector("#exportJson")?.addEventListener("click", () => showToast("JSON descargado"));
  document.querySelector("#exportCsv")?.addEventListener("click", () => showToast("CSV descargado"));
  document.querySelector("#previewCsv")?.addEventListener("click", () => {
    window.setTimeout(() => {
      const importButton = [...document.querySelectorAll("#importPreview .primary")][0];
      if (importButton) showToast("Previsualización lista");
    }, 80);
  });

  document.querySelector("#resetDemo")?.addEventListener("click", () => {
    window.setTimeout(() => showToast("Movimientos vaciados"), 100);
  });

  document.querySelector("#transactionForm")?.addEventListener("submit", () => {
    window.setTimeout(() => {
      document.querySelector("#merchantInput")?.blur();
      document.querySelector("#noteInput")?.blur();
      showToast("Movimiento guardado");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 60);
  });
}

function bindNoZoomGuards() {
  document.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("gesturechange", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("gestureend", (event) => event.preventDefault(), { passive: false });

  document.addEventListener(
    "touchmove",
    (event) => {
      if (event.scale && event.scale !== 1) event.preventDefault();
    },
    { passive: false },
  );

  document.addEventListener(
    "touchend",
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 280) event.preventDefault();
      lastTouchEnd = now;
    },
    { passive: false },
  );
}

function switchTo(view, options = {}) {
  const navButton = document.querySelector(`.tab[data-view="${view}"]`);
  if (navButton) navButton.click();
  if (options.top) {
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 20);
  }
  if (options.focus) {
    window.setTimeout(() => {
      const target = document.querySelector(options.focus);
      target?.focus();
      if (target?.select) target.select();
    }, 220);
  }
}

function scrollToEntry(type) {
  const typeSelect = document.querySelector("#typeInput");
  if (typeSelect) typeSelect.value = type;
  window.setTimeout(() => {
    document.querySelector(".quick-add-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => document.querySelector("#amountInput")?.focus(), 240);
  }, 100);
}

function currentAccent() {
  const rootAccent = document.documentElement.dataset.accent;
  if (paletteChrome[rootAccent]) return rootAccent;

  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
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
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1500);
}
