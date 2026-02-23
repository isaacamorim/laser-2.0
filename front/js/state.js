// frontend/js/state.js

// ============================================================
// state.js — Estado global da aplicação
// ============================================================

export const API_BASE_URL = "http://10.42.92.200:5050";

export const state = {
    operatorCode: "",
    operatorName: "",
    allJobs: [],
    selectedOf: null,
    pendingApontamentos: [],
    apontamentoState: "idle", // idle | started | paused
    apontamentoId: null,
};

export function resetApontamento() {
    state.pendingApontamentos = [];
    state.apontamentoState = "idle";
    state.apontamentoId = null;
}