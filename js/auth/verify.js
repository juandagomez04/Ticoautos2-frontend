import { API } from "../core/config.js";

document.addEventListener("DOMContentLoaded", async () => {
    const stateLoading = document.getElementById("stateLoading");
    const stateSuccess = document.getElementById("stateSuccess");
    const stateError   = document.getElementById("stateError");
    const errorMessage = document.getElementById("errorMessage");

    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");

    if (!token) {
        stateLoading.classList.add("hidden");
        stateError.classList.remove("hidden");
        errorMessage.textContent = "No se encontró un token de verificación en el enlace.";
        return;
    }

    try {
        const res  = await fetch(`${API}/auth/verify/${token}`);
        const data = await res.json().catch(() => ({}));

        stateLoading.classList.add("hidden");

        if (res.ok) {
            stateSuccess.classList.remove("hidden");
        } else {
            stateError.classList.remove("hidden");
            errorMessage.textContent = data.message || "El enlace de verificación es inválido o ya fue utilizado.";
        }
    } catch {
        stateLoading.classList.add("hidden");
        stateError.classList.remove("hidden");
        errorMessage.textContent = "Error de conexión. Intentá de nuevo más tarde.";
    }
});
