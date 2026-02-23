// frontend/js/apontamento.js

// ============================================================
// apontamento.js — Lógica da tela de apontamento de produção
// ============================================================

import { state, resetApontamento } from "./state.js";
import {
    apiStartApontamento,
    apiPauseApontamento,
    apiFinishApontamento,
    fetchApontamentos,
    fetchOfDetails,
} from "./api.js";
import {
    showToast,
    showQuantityModal,
    syncControlButtons,
    updateApontamentoStatus,
    startClock,
    showView,
    askConfirmation,
} from "./ui.js";
import { loadSequencing } from "./dashboard.js";

// ── Abertura da view ───────────────────────────────────────────
export async function openApontamento(job) {
    state.selectedOf = job;

    showView("apontamento");

    try {

        const res = await fetchOfDetails(
            job.SOC_CODIOF,
            job.SOC_EMPRESA,
            job.SOC_CODSEQ
        );

        if (!res.success) {
            throw new Error(res.error);
        }

        const data = res.data;

        _fillNewLayout(job, data);

    } catch (e) {
        showToast("error", "Erro ao carregar detalhes da OF: " + e.message);
        return;
    }

    const active = await _checkActiveApontamento(job.SOC_CODIOF);

    if (active) {
        state.apontamentoId = active.SOF_APONTAOFID;
        state.apontamentoState = "started";
    } else {
        resetApontamento();
    }

    syncControlButtons(state.apontamentoState, state.apontamentoId);
    updateApontamentoStatus(state.apontamentoState);
    startClock();
}

// ── Inicializa event listeners (chamado em main.js) ────────────
export function initApontamento() {
    document.getElementById("startApontamentoBtn").addEventListener("click", _handleStart);
    document.getElementById("pauseApontamentoBtn").addEventListener("click", _handlePause);
    document.getElementById("manualFinishApontamentoBtn").addEventListener("click", _handleFinish);
    document.getElementById("finishApontamentoBtn").addEventListener("click", _handleBack);

    // Modal
    const qInput = document.getElementById("quantityInput");
    qInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") import("./ui.js").then(m => m.confirmQuantity());
    });
    qInput.addEventListener("input", () => {
        qInput.classList.remove("error");
        document.getElementById("errorMessage").classList.remove("show");
    });
    document.getElementById("modalOverlay").addEventListener("click", (e) => {
        if (e.target === document.getElementById("modalOverlay")) {
            import("./ui.js").then(m => m.closeModal());
        }
    });
}

// ── Handlers privados ──────────────────────────────────────────
async function _handleStart() {
    if (!state.selectedOf || !state.operatorCode) {
        showToast("error", "Dados da OF ou do operador não carregados.");
        return;
    }

    const btn = document.getElementById("startApontamentoBtn");
    btn.disabled = true;

    try {
        const result = await apiStartApontamento(
            state.selectedOf.SOC_CODIOF,
            state.selectedOf.SOC_EMPRESA,
            state.operatorCode,
            state.selectedOf.SOC_CODSEQ ?? 1
        );

        if (!result.success || !result.apontamento_id) {
            throw new Error(result.error || "Falha ao iniciar apontamento.");
        }

        state.apontamentoId = result.apontamento_id;
        state.apontamentoState = "started";
        showToast("success", `Apontamento ${state.apontamentoId} iniciado.`);
        _refresh();
    } catch (e) {
        showToast("error", e.message);
        btn.disabled = false;
    }
}

async function _handlePause() {
    if (state.apontamentoState !== "started" || !state.apontamentoId) {
        showToast("error", "Nenhum apontamento ativo para pausar.");
        return;
    }

    const btn = document.getElementById("pauseApontamentoBtn");
    btn.disabled = true;

    try {
        const result = await apiPauseApontamento(state.apontamentoId);

        if (!result.success)
            throw new Error(result.error || "Falha ao pausar.");

        state.apontamentoState = "idle";
        state.apontamentoId = null;

        showToast("success", "Apontamento pausado.");

        _refresh();

    } catch (e) {
        showToast("error", e.message);
        btn.disabled = false;
    }
}

async function _handleFinish() {
    if (state.apontamentoState !== "started" || !state.apontamentoId) {
        showToast("error", "Nenhum apontamento ativo para finalizar.");
        return;
    }

    const qtd = await showQuantityModal();
    if (qtd === null) return;

    const btn = document.getElementById("manualFinishApontamentoBtn");
    btn.disabled = true;

    try {
        const result = await apiFinishApontamento(state.apontamentoId, qtd);
        if (!result.success) throw new Error(result.error || "Falha ao finalizar.");

        showToast("success", `Apontamento ${state.apontamentoId} finalizado com quantidade ${qtd}.`);
        state.apontamentoState = "idle";
        state.apontamentoId = null;
        _refresh();
    } catch (e) {
        showToast("error", e.message);
        if (state.apontamentoState === "started") btn.disabled = false;
    }
}

async function _handleBack() {
    if (state.apontamentoState === "started") {
        showToast("info", `Existe um apontamento em andamento para a OF ${state.selectedOf?.SOC_CODIOF}.`, 10000);
        const ok = await askConfirmation("Existe um apontamento em andamento. Deseja sair mesmo assim?");
        if (!ok) return;
    }

    state.selectedOf = null;
    resetApontamento();
    await loadSequencing();
    showView("dashboard");
}

// ── Helpers internos ───────────────────────────────────────────
function _refresh() {
    syncControlButtons(state.apontamentoState, state.apontamentoId);
    updateApontamentoStatus(state.apontamentoState);
    if (state.selectedOf) _loadExistingApontamentos(state.selectedOf.SOC_CODIOF);
}

async function _checkActiveApontamento(ofId) {
    try {
        const data = await fetchApontamentos(ofId);
        if (data.success && data.apontamentos) {
            return data.apontamentos.find(ap => !ap.SOF_DTAFIM) ?? null;
        }
        return null;
    } catch { return null; }
}

async function _loadExistingApontamentos(ofId) {
    try {
        const data = await fetchApontamentos(ofId);
        if (data.success && data.apontamentos) {
            renderExistingTable(data.apontamentos);
        } else {
            renderExistingTable([]);
        }
    } catch {
        renderExistingTable([]);
    }
}

function _updateOfDisplay() {
    const of = state.selectedOf;
    document.getElementById("ofNumber").textContent = of.SOC_CODIOF || "-";
    document.getElementById("empresaNumber").textContent = of.SOC_EMPRESA || "-";
    document.getElementById("productCode").textContent = of.JRO_PROERP || "-";
    const desc = of.JRO_DESCRI || "-";
    const descEl = document.getElementById("productDescription");
    descEl.textContent = desc.length > 40 ? desc.substring(0, 40) + "..." : desc;
    descEl.title = desc;
}

// ── Renderizações de tabela ────────────────────────────────────

function renderExistingTable(apontamentos) {
    const tbody = document.getElementById("existingApontamentosBody");
    const table = document.getElementById("existingApontamentosTable");
    const noData = document.getElementById("noExistingApontamentos");

    tbody.innerHTML = "";

    if (!apontamentos.length) {
        table.style.display = "none";
        noData.style.display = "block";
        return;
    }

    table.style.display = "table";
    noData.style.display = "none";

    apontamentos.forEach((ap, index) => {
        const row = tbody.insertRow();
        row.style.backgroundColor = index % 2 === 0 ? "#fff" : "#fafafa";

        const status = ap.SOF_DTAFIM ? "Finalizado" : "Em andamento";
        const color = ap.SOF_DTAFIM ? "#28a745" : "#ffc107";
        const bgColor = ap.SOF_DTAFIM ? "#e8f5e8" : "#fff8e1";
        const icon = ap.SOF_DTAFIM ? "fa-check-circle" : "fa-clock";

        const cells = [
            ap.SOF_APONTAOFID || "-",
            ap.SOF_OPERAD || "-",
            ap.SOF_DTINIC || "-",
            ap.SOF_DTAFIM || "-",
        ];

        cells.forEach(txt => {
            const td = row.insertCell();
            td.style.padding = "14px 12px";
            td.style.borderBottom = "1px solid #f0f0f0";
            td.textContent = txt;
        });

        // Qtd
        const qtdTd = row.insertCell();
        qtdTd.style.cssText = "padding:14px 12px;text-align:center;font-weight:600;color:#2e7d32;border-bottom:1px solid #f0f0f0";
        qtdTd.textContent = ap.SOF_QNTBOA || "0";

        // Status badge
        const statusTd = row.insertCell();
        statusTd.style.cssText = "padding:14px 12px;text-align:center;border-bottom:1px solid #f0f0f0";
        statusTd.innerHTML = `
      <span style="background:${bgColor};color:${color};padding:6px 12px;border-radius:20px;
                   font-size:0.8rem;border:1px solid ${color}20;display:inline-flex;align-items:center;gap:6px">
        <i class="fas ${icon}"></i> ${status}
      </span>`;

        // Erros
        const erroTd = row.insertCell();
        erroTd.style.cssText = "padding:14px 12px;text-align:center;border-bottom:1px solid #f0f0f0";
        erroTd.textContent = ap.SOF_ERROINTEGRA || "✅";
    });
}

function _fillNewLayout(job, data) {

    document.getElementById("ofValue").textContent = job.SOC_CODIOF;
    document.getElementById("opValue").textContent = data.operacao || "-";
    document.getElementById("maqValue").textContent = data.maquina || "-";
    document.getElementById("prodValue").textContent = job.JRO_PROERP || "-";
    document.getElementById("descValue").textContent = job.JRO_DESCRI || "-";

    const box = document.getElementById("materialsBox");
    box.innerHTML = "";

    if (!data.materiais.length) {
        box.innerHTML = "<div class='empty-state'>Sem materiais</div>";
    }

    data.materiais.forEach(m => {
        const row = document.createElement("div");
        row.className = "material-row";

        row.innerHTML = `
      <div>
        <div class="mat-name">${m.codigo}</div>
        <div class="mat-spec">${m.descricao || ''}</div>
      </div>
      <div class="mat-qty">${m.estoque}</div>
    `;

        box.appendChild(row);
    });

    const prog = job.QUANTIDADE_PROGRAMADA || 0;
    const real = job.QUANTIDADE_REALIZADA || 0;

    document.getElementById("qtdReal").textContent = real;
    document.getElementById("qtdProg").textContent = prog;
    document.getElementById("qtdRestante").textContent = Math.max(0, prog - real);

    const pct = prog > 0 ? Math.round((real / prog) * 100) : 0;

    document.getElementById("progressBar").style.width = pct + "%";
    document.getElementById("progressPct").textContent = pct + "%";
}