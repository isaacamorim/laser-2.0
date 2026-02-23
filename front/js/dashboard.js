// frontend/js/dashboard.js

// ============================================================
// dashboard.js — Tabela de OFs e entrada no apontamento
// ============================================================

import { state } from "./state.js";
import { buildStepDownloadUrl } from "./api.js";
import { showToast, showView } from "./ui.js";
import { openApontamento } from "./apontamento.js";

export function initDashboard() {
    document
        .getElementById("loadBtn")
        .addEventListener("click", loadSequencing);
}

export function renderJobTable(jobs) {
    const jobTable = document.getElementById("jobTable");
    const jobBody = document.getElementById("jobBody");
    const noJobsMessage = document.getElementById("noJobsMessage");

    if (!jobs || jobs.length === 0) {
        jobTable.style.display = "none";
        noJobsMessage.style.display = "block";
        return;
    }

    jobTable.style.display = "table";
    noJobsMessage.style.display = "none";

    document.getElementById("orderCount").textContent = jobs.length;


    jobBody.innerHTML = jobs.map((job, index) => {
        const qtdReal = job.QUANTIDADE_REALIZADA ?? 0;
        const qtdProg = job.QUANTIDADE_PROGRAMADA ?? 0;
        const progress = qtdProg > 0 ? (qtdReal / qtdProg) * 100 : 0;
        const progColor = progress >= 100 ? "#28a745" : progress >= 50 ? "#ffc107" : "#dc3545";

        const stepBtn = job.JPC_DESENHO_ENG
            ? `<button class="btn btn-download-step" data-path="${job.JPC_DESENHO_ENG}"
              style="background:#6c757d;color:white;border:none;padding:8px 16px;border-radius:6px;
                     cursor:pointer;font-size:0.8rem;display:inline-flex;align-items:center;gap:6px;">
             <i class="fas fa-download"></i> Baixar
           </button>`
            : `<span style="color:#6c757d;font-style:italic;font-size:0.8rem;">Sem arquivo</span>`;

        return `
      <tr data-index="${index}" style="border-bottom:1px solid #f0f0f0;background:${index % 2 === 0 ? "#fff" : "#fafafa"}">
        <td style="padding:14px 12px;font-weight:600;color:#D52029">${job.SOC_CODIOF || "-"}</td>
        <td style="padding:14px 12px">${job.SOC_EMPRESA || "-"}</td>
        <td style="padding:14px 12px;text-align:center">
          <span style="background:#e3f2fd;color:#1976d2;padding:4px 8px;border-radius:12px;font-size:0.8rem;font-weight:600">
            ${job.SOC_SEQUEN || "-"}
          </span>
        </td>
        <td style="padding:14px 12px;font-weight:500">${job.JRO_PROERP || "-"}</td>
        <td style="padding:14px 12px;color:#666;max-width:250px">
          <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:250px"
               title="${job.JRO_DESCRI || ""}">
            ${job.JRO_DESCRI || "-"}
          </div>
        </td>
        <td style="padding:14px 12px;text-align:center;font-weight:600">
          ${qtdProg.toLocaleString("pt-BR")}
        </td>
        <td style="padding:14px 12px;text-align:center">
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
            <span style="font-weight:600;color:${progColor}">${qtdReal.toLocaleString("pt-BR")}</span>
            <div style="width:60px;height:4px;background:#e9ecef;border-radius:2px;overflow:hidden">
              <div style="width:${Math.min(progress, 100)}%;height:100%;background:${progColor};transition:all 0.3s"></div>
            </div>
          </div>
        </td>
        <td style="padding:14px 12px;text-align:center">${stepBtn}</td>
        <td style="padding:14px 12px;text-align:center">
          <button class="btn btn-open-apontamento"
              data-of-id="${job.SOC_CODIOF}"
              data-empresa-id="${job.SOC_EMPRESA}"
              style="background:linear-gradient(135deg,#28a745 0%,#20c997 100%);color:white;border:none;
                     padding:10px 20px;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600;
                     display:inline-flex;align-items:center;gap:8px;
                     box-shadow:0 2px 8px rgba(40,167,69,0.3)">
            <i class="fas fa-play-circle"></i> Iniciar Apontamento
          </button>
        </td>
      </tr>`;
    }).join("");

    // Hover nas linhas
    jobBody.querySelectorAll("tr").forEach(row => {
        const idx = parseInt(row.dataset.index);
        row.addEventListener("mouseenter", () => row.style.backgroundColor = "#f8f9fa");
        row.addEventListener("mouseleave", () => row.style.backgroundColor = idx % 2 === 0 ? "#fff" : "#fafafa");
    });

    // Download .step
    jobBody.querySelectorAll(".btn-download-step").forEach(btn => {
        btn.addEventListener("click", () => {
            const path = btn.dataset.path;
            if (!path) { showToast("error", "Caminho do arquivo .step não encontrado."); return; }
            window.location = buildStepDownloadUrl(path);
        });
    });

    // Abrir apontamento
    jobBody.querySelectorAll(".btn-open-apontamento").forEach(btn => {
        btn.addEventListener("click", () => {
            const ofId = btn.dataset.ofId;
            const empresaId = btn.dataset.empresaId;
            const job = state.allJobs.find(j =>
                String(j.SOC_CODIOF) === String(ofId) && String(j.SOC_EMPRESA) === String(empresaId)
            );
            if (!job) { showToast("error", `OF ${ofId} não encontrada.`); return; }
            openApontamento(job);
        });
    });
}

export async function loadSequencing() {
    if (!state.operatorCode) {
        showToast("error", "Operador não identificado.");
        return;
    }

    showToast("info", "Carregando sequenciamento...");

    try {
        const res = await fetch(
            `/api/laser/sequencing_v2?operator_code=${state.operatorCode}`
        );

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.error || "Erro ao buscar sequenciamento.");
        }

        state.allJobs = data.jobs || [];

        renderJobTable(state.allJobs);

    } catch (e) {
        showToast("error", e.message);
    }
}
