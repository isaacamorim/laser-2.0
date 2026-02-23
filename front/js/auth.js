// frontend/js/auth.js

// ============================================================
// auth.js — Login e identificação do operador
// ============================================================

import { state } from "./state.js";
import { fetchSequencing } from "./api.js";
import { showToast, showView } from "./ui.js";
import { renderJobTable } from "./dashboard.js";

export function initAuth() {
    const loginBtn = document.getElementById("loginBtn");
    const operatorInput = document.getElementById("operatorInput");

    loginBtn.addEventListener("click", handleLogin);

    operatorInput.addEventListener("focus", function () {
        this.style.borderColor = "#D52029";
        this.style.background = "white";
        this.style.boxShadow = "0 0 0 3px rgba(213,32,41,0.1)";
        this.style.transform = "translateY(-1px)";
    });

    operatorInput.addEventListener("blur", function () {
        this.style.borderColor = "#e1e5e9";
        this.style.background = "#fafafa";
        this.style.boxShadow = "none";
        this.style.transform = "translateY(0)";
    });

    operatorInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") loginBtn.click();
    });
}

async function handleLogin() {
    const loginBtn = document.getElementById("loginBtn");
    const loginBtnText = document.getElementById("loginBtnText");
    const loginSpinner = document.getElementById("loginBtnSpinner");
    const operatorInput = document.getElementById("operatorInput");

    const opCode = operatorInput.value.trim();

    if (!opCode) {
        operatorInput.style.borderColor = "#dc3545";
        operatorInput.style.background = "#fff5f5";
        showToast("error", "Informe seu número de operador.");
        return;
    }

    operatorInput.style.borderColor = "#e1e5e9";
    operatorInput.style.background = "#fafafa";
    state.operatorCode = opCode;

    // Estado de carregamento
    loginBtn.disabled = true;
    loginBtnText.textContent = "Validando acesso...";
    loginSpinner.style.display = "inline-block";
    loginBtn.style.opacity = "0.8";

    try {
        const success = await loadSequencing();

        if (success) {
            loginBtn.style.background = "linear-gradient(135deg,#28a745 0%,#20c997 100%)";
            loginBtnText.textContent = "Acesso concedido!";

            setTimeout(() => {
                document.getElementById("operatorCodeLabel").textContent = state.operatorCode;
                document.getElementById("operatorNameLabel").textContent = state.operatorName || "Nome não encontrado";
                showView("dashboard");
                // Reset visual do botão para próxima vez
                loginBtn.style.background = "linear-gradient(135deg,#D52029 0%,#B4252C 100%)";
                loginBtnText.textContent = "Entrar no Sistema";
                loginBtn.disabled = false;
                loginSpinner.style.display = "none";
                loginBtn.style.opacity = "1";
            }, 800);
        }
    } catch {
        operatorInput.style.borderColor = "#dc3545";
        operatorInput.style.background = "#fff5f5";
        loginBtn.style.background = "linear-gradient(135deg,#dc3545 0%,#c82333 100%)";
        loginBtnText.textContent = "Erro no acesso";

        setTimeout(() => {
            loginBtn.disabled = false;
            loginBtnText.textContent = "Tentar Novamente";
            loginSpinner.style.display = "none";
            loginBtn.style.opacity = "1";
            loginBtn.style.background = "linear-gradient(135deg,#D52029 0%,#B4252C 100%)";
        }, 1500);
    }
}

export async function loadSequencing() {
    const loadText = document.getElementById("loadText");
    const loadSpinner = document.getElementById("loadSpinner");
    const loadBtn = document.getElementById("loadBtn");
    const nameLabel = document.getElementById("operatorNameLabel");

    if (loadText) loadText.style.display = "none";
    if (loadSpinner) loadSpinner.style.display = "inline-block";
    if (loadBtn) loadBtn.disabled = true;

    try {
        const data = await fetchSequencing(state.operatorCode);

        if (!data.success || !data.jobs) {
            throw new Error(data.error || "Operador sem OFs ou dados inválidos.");
        }

        state.allJobs = data.jobs;

        if (!state.allJobs.length) {
            showToast("info", "Nenhuma OF sequenciada para este operador.");
            if (nameLabel) nameLabel.textContent = "(Nenhuma OF)";
            return true;
        }

        state.operatorName = state.allJobs[0]?.JLB_NOMECB ?? "";
        if (nameLabel) nameLabel.textContent = state.operatorName || "(Nome não encontrado)";

        renderJobTable(state.allJobs);
        return true;

    } catch (e) {
        showToast("error", `Erro ao carregar sequenciamento: ${e.message}`);
        if (nameLabel) nameLabel.textContent = "(Erro ao carregar)";
        return false;

    } finally {
        if (loadText) loadText.style.display = "inline-block";
        if (loadSpinner) loadSpinner.style.display = "none";
        if (loadBtn) loadBtn.disabled = false;
    }
}