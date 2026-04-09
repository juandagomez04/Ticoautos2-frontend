import { API, GOOGLE_CLIENT_ID } from "../core/config.js";
import { saveToken } from "../core/storage.js";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const togglePasswordBtn = document.getElementById("togglePassword");
    const formMessage = document.getElementById("formMessage");

    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");

    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.classList.remove("hidden", "success", "error");
        formMessage.classList.add(type);
    }

    function clearMessage() {
        formMessage.textContent = "";
        formMessage.classList.add("hidden");
        formMessage.classList.remove("success", "error");
    }

    function validateEmail(email) {
        return /\S+@\S+\.\S+/.test(email);
    }

    function clearErrors() {
        emailError.textContent = "";
        passwordError.textContent = "";
        clearMessage();
    }

    function validateForm() {
        clearErrors();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        let isValid = true;

        if (!email) {
            emailError.textContent = "El correo es obligatorio.";
            isValid = false;
        } else if (!validateEmail(email)) {
            emailError.textContent = "Ingresa un correo válido.";
            isValid = false;
        }

        if (!password) {
            passwordError.textContent = "La contraseña es obligatoria.";
            isValid = false;
        } else if (password.length < 6) {
            passwordError.textContent = "La contraseña debe tener al menos 6 caracteres.";
            isValid = false;
        }

        return isValid;
    }

    togglePasswordBtn.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
        togglePasswordBtn.textContent = isPassword ? "Ocultar" : "Ver";
    });

    // ─── Login con Google ───────────────────────────────────────────────────────

    async function handleGoogleResponse(response) {
        try {
            showMessage("Verificando cuenta de Google...", "success");

            const res = await fetch(`${API}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential })
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                showMessage(data.message || "No se pudo iniciar sesión con Google.", "error");
                return;
            }

            saveToken(data.token);
            showMessage("Inicio de sesión exitoso. Redirigiendo...", "success");

            setTimeout(() => {
                window.location.href = "../dashboard/dashboard.html";
            }, 1000);
        } catch (error) {
            console.error("Error en Google login:", error);
            showMessage("Error de conexión con el servidor.", "error");
        }
    }

    // Inicializar Google Identity Services cuando el script de Google esté listo
    window.addEventListener("load", () => {
        if (typeof google === "undefined") return;

        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
        });

        google.accounts.id.renderButton(
            document.getElementById("googleSignInBtn"),
            {
                theme: "outline",
                size: "large",
                width: 300,
                text: "signin_with",
                locale: "es"
            }
        );
    });

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!validateForm()) return;

        const payload = {
            email: emailInput.value.trim(),
            password: passwordInput.value.trim()
        };

        try {
            clearMessage();

            const res = await fetch(`${API}/auth/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                showMessage(data.message || "Credenciales incorrectas.", "error");
                return;
            }

            saveToken(data.token);
            showMessage("Inicio de sesión exitoso. Redirigiendo...", "success");

            setTimeout(() => {
                window.location.href = "../dashboard/dashboard.html";
            }, 1000);
        } catch (error) {
            console.error("Error en login:", error);
            showMessage("Error de conexión con el servidor.", "error");
        }
    });
});