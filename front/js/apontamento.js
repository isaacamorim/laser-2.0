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
    buildStepDownloadUrl,
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
import { startTimer, pauseTimer, resetTimer } from "./timer.js";

// ── Abertura da view ───────────────────────────────────────────
export async function openApontamento(job) {
    state.selectedOf = job;

    showView("apontamento");

    // Reseta timer ao entrar na view
    resetTimer();

    try {
        const res = await fetchOfDetails(
            job.SOC_CODIOF,
            job.SOC_EMPRESA,
            job.SOC_CODSEQ
        );

        if (!res.success) {
            throw new Error(res.error);
        }

        _fillNewLayout(job, res.data);

        // Botão de download do .STEP
        const btnStep = document.getElementById("btnDownloadStep");
        if (btnStep) {
            if (job.JPC_DESENHO_ENG) {
                btnStep.disabled = false;
                btnStep.onclick = () => {
                    window.location = buildStepDownloadUrl(job.JPC_DESENHO_ENG);
                };
            } else {
                btnStep.disabled = true;
                btnStep.onclick = null;
            }
        }

        // POP
        const btnPop = document.getElementById("btnPop");
        const popName = document.getElementById("popName");
        if (btnPop) {
            if (res.data.pop_url) {
                btnPop.disabled = false;
                btnPop.onclick = () => window.open(res.data.pop_url, "_blank");
                if (popName) popName.textContent = res.data.pop_nome || res.data.pop_url;
            } else {
                btnPop.disabled = true;
                btnPop.onclick = null;
                if (popName) popName.textContent = "POP não cadastrado";
            }
        }

    } catch (e) {
        showToast("error", "Erro ao carregar detalhes da OF: " + e.message);
        return;
    }

    // Verifica se existe apontamento aberto para esta OF
    const active = await _checkActiveApontamento(job.SOC_CODIOF);

    if (active) {
        state.apontamentoId = active.SOF_APONTAOFID;
        state.apontamentoState = "started";
        startTimer(); // Retoma timer se havia apontamento em aberto
    } else {
        resetApontamento();
    }

    // Carrega histórico de apontamentos
    await _loadExistingApontamentos(job.SOC_CODIOF);

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

    // Modal — Enter confirma
    const qInput = document.getElementById("quantityInput");
    qInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") import("./ui.js").then(m => m.confirmQuantity());
    });

    // Modal — limpa erro ao digitar
    qInput.addEventListener("input", () => {
        qInput.classList.remove("error");
        document.getElementById("errorMessage").classList.remove("show");
    });

    // Modal — fecha ao clicar fora
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

        if (!result.success) {

            // Preserva código do backend
            const err = new Error(result.message || "Falha ao iniciar");
            err.code = result.code;

            throw err;
        }

        if (!result.apontamento_id) {
            throw new Error("ID do apontamento não retornado.");
        }

        state.apontamentoId = result.apontamento_id;
        state.apontamentoState = "started";

        startTimer();

        showToast("success", `Apontamento ${state.apontamentoId} iniciado.`);
        _refresh();

    } catch (e) {

        if (e.code === "APONTAMENTO_ABERTO") {
            showToast("warning", e.message, 8000);
        } else {
            showToast("error", e.message || "Erro inesperado");
        }

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

        pauseTimer();

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

        if (!result.success)
            throw new Error(result.error || "Falha ao finalizar.");

        pauseTimer();
        resetTimer();

        showToast("success", `Apontamento ${state.apontamentoId} finalizado com quantidade ${qtd}.`);

        state.apontamentoState = "idle";
        state.apontamentoId = null;

        _refresh();

    } catch (e) {
        showToast("error", e.message);
        // Só reabilita o botão se o apontamento ainda estiver ativo
        if (state.apontamentoState === "started") btn.disabled = false;
    }
}

async function _handleBack() {
    if (state.apontamentoState === "started") {
        showToast("info", `Existe um apontamento em andamento para a OF ${state.selectedOf?.SOC_CODIOF}.`, 10000);
        const ok = await askConfirmation("Existe um apontamento em andamento. Deseja sair mesmo assim?");
        if (!ok) return;
    }

    pauseTimer();
    resetTimer();

    state.selectedOf = null;
    resetApontamento();

    await loadSequencing();
    showView("dashboard");
}

// ── Helpers internos ───────────────────────────────────────────
function _refresh() {
    syncControlButtons(state.apontamentoState, state.apontamentoId);
    updateApontamentoStatus(state.apontamentoState);
    if (state.selectedOf) {
        _loadExistingApontamentos(state.selectedOf.SOC_CODIOF);
    }
}

async function _checkActiveApontamento(ofId) {
    try {
        const data = await fetchApontamentos(ofId);
        if (data.success && data.apontamentos) {
            return data.apontamentos.find(ap => !ap.SOF_DTAFIM) ?? null;
        }
        return null;
    } catch {
        return null;
    }
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

// ── Renderização da tabela de apontamentos existentes ──────────
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

        const finalizado = !!ap.SOF_DTAFIM;
        const statusLabel = finalizado ? "Finalizado" : "Em andamento";
        const statusColor = finalizado ? "#28a745" : "#ffc107";
        const statusBg = finalizado ? "#e8f5e8" : "#fff8e1";
        const statusIcon = finalizado ? "fa-check-circle" : "fa-clock";

        const cellStyle = "padding:12px;border-bottom:1px solid #f0f0f0";

        // ID
        _insertCell(row, ap.SOF_APONTAOFID || "-", `${cellStyle};text-align:center`);
        // Operador
        _insertCell(row, ap.SOF_OPERAD || "-", cellStyle);
        // Início
        _insertCell(row, ap.SOF_DTINIC || "-", cellStyle);
        // Fim
        _insertCell(row, ap.SOF_DTAFIM || "-", cellStyle);
        // Quantidade
        _insertCell(row, ap.SOF_QNTBOA || "0", `${cellStyle};text-align:center;font-weight:600;color:#2e7d32`);

        // Status
        const statusTd = row.insertCell();
        statusTd.style.cssText = `${cellStyle};text-align:center`;
        statusTd.innerHTML = `
            <span style="background:${statusBg};color:${statusColor};padding:4px 10px;border-radius:20px;
                         font-size:.78rem;border:1px solid ${statusColor}30;
                         display:inline-flex;align-items:center;gap:5px;font-weight:600">
                <i class="fas ${statusIcon}"></i> ${statusLabel}
            </span>`;

        // Erros
        _insertCell(row, ap.SOF_ERROINTEGRA || "✅", `${cellStyle};text-align:center`);
    });
}

function _insertCell(row, text, cssText) {
    const td = row.insertCell();
    td.style.cssText = cssText;
    td.textContent = text;
}

// ── Preenche o layout v2 com dados da OF ───────────────────────
function _fillNewLayout(job, data) {
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val ?? "-";
    };

    set("ofValue", job.SOC_CODIOF);
    set("opValue", data.operacao);
    set("maqValue", data.maquina);
    set("prodValue", job.JRO_PROERP);
    set("descValue", job.JRO_DESCRI);

    // Materiais
    const box = document.getElementById("materialsBox");
    if (box) {
        box.innerHTML = "";

        if (!data.materiais?.length) {
            box.innerHTML = `
                <div class="empty-state-v2">
                    <i class="fas fa-boxes"></i>
                    Sem materiais cadastrados
                </div>`;
        } else {
            data.materiais.forEach(m => {
                const row = document.createElement("div");
                row.className = "material-row";
                row.innerHTML = `
                    <div>
                        <div class="mat-name">${m.codigo || "-"}</div>
                        <div class="mat-spec">${m.descricao || ""}</div>
                    </div>
                    <div class="mat-qty">${m.estoque ?? "-"}</div>`;
                box.appendChild(row);
            });
        }
    }

    // Progresso
    const prog = job.QUANTIDADE_PROGRAMADA || 0;
    const real = job.QUANTIDADE_REALIZADA || 0;
    const pct = prog > 0 ? Math.min(100, Math.round((real / prog) * 100)) : 0;

    set("qtdReal", real);
    set("qtdProg", prog);
    set("qtdRestante", Math.max(0, prog - real));
    set("progressPct", pct + "%");

    const bar = document.getElementById("progressBar");
    if (bar) bar.style.width = pct + "%";

    // Preview do desenho
    const img = document.getElementById("drawingImg");
    const empty = document.getElementById("drawingEmpty");

    if (img && data.desenho_url) {
        img.src = data.desenho_url;
        img.style.display = "block";
        if (empty) empty.style.display = "none";
    } else {
        if (img) img.style.display = "none";
        if (empty) empty.style.display = "flex";
    }
}