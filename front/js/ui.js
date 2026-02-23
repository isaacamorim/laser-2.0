// frontend/js/ui.js

// ============================================================
// ui.js — Componentes de UI reutilizáveis (toasts, modal,
//          spinners, status visual)
// ============================================================

// ── Toasts ────────────────────────────────────────────────────
export function showToast(type, message, duration = 5000) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span><button class="close-btn">&times;</button>`;
    container.appendChild(toast);

    const remove = () => {
        toast.style.animation = "slideOut 0.3s ease-out forwards";
        setTimeout(() => { if (container.contains(toast)) container.removeChild(toast); }, 300);
    };

    toast.querySelector(".close-btn").onclick = remove;
    if (duration > 0) setTimeout(remove, duration);
}

// ── Modal de quantidade ────────────────────────────────────────
let _resolveModal = null;

export function showQuantityModal() {
    return new Promise((resolve) => {
        _resolveModal = resolve;
        const overlay = document.getElementById("modalOverlay");
        const input = document.getElementById("quantityInput");

        input.value = "";
        input.classList.remove("error");
        document.getElementById("errorMessage").classList.remove("show");

        overlay.classList.add("active");
        setTimeout(() => input.focus(), 300);
    });
}

export function closeModal() {
    document.getElementById("modalOverlay").classList.remove("active");
    if (_resolveModal) { _resolveModal(null); _resolveModal = null; }
}

export function confirmQuantity() {
    const input = document.getElementById("quantityInput");
    const val = parseFloat(input.value.trim());

    if (isNaN(val) || val < 0) {
        input.classList.add("error");
        document.getElementById("errorMessage").classList.add("show");
        document.querySelector(".modal").classList.add("shake");
        setTimeout(() => document.querySelector(".modal").classList.remove("shake"), 300);
        input.focus();
        return;
    }

    document.getElementById("modalOverlay").classList.remove("active");
    if (_resolveModal) { _resolveModal(val); _resolveModal = null; }
}

// ── Spinner helpers ────────────────────────────────────────────
export function setButtonLoading(btn, isLoading, originalHTML) {
    btn.disabled = isLoading;
    btn.innerHTML = isLoading
        ? `Processando... <span class="loading"></span>`
        : originalHTML;
}

// ── Status do apontamento ──────────────────────────────────────
export function updateApontamentoStatus(state) {
    const statusEl = document.getElementById("apontamentoStatus");
    const indicatorEl = document.getElementById("statusIndicator");
    if (!statusEl || !indicatorEl) return;

    const map = {
        idle: { text: "Pronto para iniciar", color: "#ffc107", cls: "idle" },
        started: { text: "Em andamento", color: "#28a745", cls: "started" },
        paused: { text: "Pausado", color: "#ffc107", cls: "paused" },
    };

    const cfg = map[state] ?? map.idle;
    statusEl.textContent = cfg.text;
    indicatorEl.style.background = cfg.color;
    indicatorEl.className = `status-indicator ${cfg.cls}`;
}

// ── Botões de controle de apontamento ─────────────────────────
export function syncControlButtons(apontamentoState, apontamentoId) {
    const btnStart = document.getElementById("startApontamentoBtn");
    const btnPause = document.getElementById("pauseApontamentoBtn");
    const btnFinish = document.getElementById("manualFinishApontamentoBtn");
    if (!btnStart || !btnPause || !btnFinish) return;

    const active = apontamentoState === "started" && !!apontamentoId;

    btnStart.disabled = active;
    btnStart.style.opacity = active ? "0.5" : "1";
    btnPause.disabled = !active;
    btnPause.style.opacity = active ? "1" : "0.5";
    btnFinish.disabled = !active;
    btnFinish.style.opacity = active ? "1" : "0.5";
}

// ── Relógio em tempo real ──────────────────────────────────────
let _clockInterval = null;

export function startClock() {
    const el = document.getElementById("currentTime");
    if (!el) return;
    clearInterval(_clockInterval);
    _clockInterval = setInterval(() => {
        el.textContent = new Date().toLocaleTimeString("pt-BR");
    }, 1000);
}

// ── Troca de views ─────────────────────────────────────────────
export function showView(name) {
    // "login" | "dashboard" | "apontamento"
    const views = {
        login: document.getElementById("login"),
        dashboard: document.getElementById("dashboard"),
        apontamento: document.getElementById("apontamentoSection"),
    };

    Object.entries(views).forEach(([key, el]) => {
        if (el) el.style.display = key === name ? "block" : "none";
    });
}

// ── Confirmação assíncrona (substitui confirm() nativo) ────────
export function askConfirmation(message) {
    return new Promise((resolve) => resolve(window.confirm(message)));
}