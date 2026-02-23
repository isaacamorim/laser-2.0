// frontend/js/api.js

// ============================================================
// api.js — Camada de comunicação com o backend
// ============================================================

import { API_BASE_URL } from "./state.js";
import { showToast } from "./ui.js";

const LASER = `${API_BASE_URL}/api/laser`;

async function request(url, method = "GET", body = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    const json = await res.json().catch(() => ({ error: `Erro HTTP: ${res.status}` }));

    if (!res.ok) throw new Error(json.error || `Erro ${res.status}`);
    return json;
}

// --- Sequenciamento ---
export async function fetchSequencing(operatorCode) {
    return request(`${LASER}/sequencing_v2?operator_code=${encodeURIComponent(operatorCode)}`);
}

// --- Apontamento ---
export async function apiStartApontamento(ofId, empresaId, operatorCode, operac) {
    return request(`${LASER}/apontamento/start`, "POST", {
        of_id: ofId,
        empresa_id: empresaId,
        operator_code: operatorCode,
        operac: operac ?? 1,
    });
}

export async function apiPauseApontamento(apontamentoId) {
    return request(`${LASER}/apontamento/pause`, "POST", { apontamento_id: apontamentoId });
}

export async function apiFinishApontamento(apontamentoId, quantidadeBoa) {
    return request(`${LASER}/apontamento/finish`, "POST", {
        apontamento_id: apontamentoId,
        quantidade_boa: quantidadeBoa,
    });
}

export async function fetchApontamentos(ofId) {
    return request(`${LASER}/apontamento/list/${encodeURIComponent(ofId)}`);
}

export async function apiConfirmBatch(payload) {
    return request(`${LASER}/apontamento/confirm_batch`, "POST", payload);
}

// --- Download .step ---
export function buildStepDownloadUrl(filePath) {
    return `${LASER}/download_step?file_path=${encodeURIComponent(filePath)}`;
}

// Buscar detalhes completos da OF
export async function fetchOfDetails(ofId, empresa, codseq) {
    const res = await fetch(
        `/api/laser/of/${ofId}/details?empresa=${empresa}&codseq=${codseq}`
    );

    return await res.json();
}