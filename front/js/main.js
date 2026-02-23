// frontend/js/main.js

// ============================================================
// main.js — Ponto de entrada da aplicação
// Importa e inicializa todos os módulos na ordem correta.
// ============================================================

import { initAuth } from "./auth.js";
import { initDashboard } from "./dashboard.js";
import { initApontamento } from "./apontamento.js";
import { closeModal, confirmQuantity } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar módulos
    initAuth();
    initDashboard();
    initApontamento();

    // Expor funções do modal para atributos onclick do HTML
    window.closeModal = closeModal;
    window.confirmQuantity = confirmQuantity;

    // Wiring dos botões do modal via JS (sem onclick inline)
    document.getElementById("modalCloseBtn").addEventListener("click", closeModal);
    document.getElementById("modalCancelBtn").addEventListener("click", closeModal);
    document.getElementById("modalConfirmBtn").addEventListener("click", confirmQuantity);
});