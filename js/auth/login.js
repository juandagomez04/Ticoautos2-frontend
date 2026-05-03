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

    // ─── 2FA ───────────────────────────────────────────────────────────────────

    const twoFactorModal      = document.getElementById("twoFactorModal");
    const twoFactorCodeInput  = document.getElementById("twoFactorCode");
    const twoFactorError      = document.getElementById("twoFactorError");
    const twoFactorMessage    = document.getElementById("twoFactorMessage");
    const twoFactorSubmitBtn  = document.getElementById("twoFactorSubmitBtn");

    let pendingTempToken = null;

    function show2FAMessage(message, type) {
        twoFactorMessage.textContent = message;
        twoFactorMessage.classList.remove("hidden", "success", "error");
        twoFactorMessage.classList.add(type);
    }

    twoFactorSubmitBtn.addEventListener("click", async () => {
        const code = twoFactorCodeInput.value.trim();
        twoFactorError.textContent = "";

        if (!code || code.length !== 6) {
            twoFactorError.textContent = "Ingresá el código de 6 dígitos.";
            return;
        }

        twoFactorSubmitBtn.disabled = true;
        twoFactorSubmitBtn.textContent = "Verificando...";

        try {
            const res = await fetch(`${API}/auth/verify-2fa`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tempToken: pendingTempToken, code }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                show2FAMessage(data.message || "Código incorrecto.", "error");
                twoFactorSubmitBtn.disabled = false;
                twoFactorSubmitBtn.textContent = "Verificar código";
                return;
            }

            saveToken(data.token);
            show2FAMessage("Verificación exitosa. Redirigiendo...", "success");
            setTimeout(() => { window.location.href = "../dashboard/dashboard.html"; }, 1000);
        } catch {
            show2FAMessage("Error de conexión con el servidor.", "error");
            twoFactorSubmitBtn.disabled = false;
            twoFactorSubmitBtn.textContent = "Verificar código";
        }
    });

    // ─── Login con Google ───────────────────────────────────────────────────────

    const cedulaModal = document.getElementById("cedulaModal");
    const googleCedulaInput = document.getElementById("googleCedula");
    const googleCedulaError = document.getElementById("googleCedulaError");
    const googleCedulaStatus = document.getElementById("googleCedulaStatus");
    const googleUserPreview = document.getElementById("googleUserPreview");
    const googleUserName = document.getElementById("googleUserName");
    const cedulaSubmitBtn = document.getElementById("cedulaSubmitBtn");
    const cedulaModalMessage = document.getElementById("cedulaModalMessage");

    let pendingToken = null;
    let cedulaValida = false;

    function showModalMessage(message, type) {
        cedulaModalMessage.textContent = message;
        cedulaModalMessage.classList.remove("hidden", "success", "error");
        cedulaModalMessage.classList.add(type);
    }

    function clearModalMessage() {
        cedulaModalMessage.textContent = "";
        cedulaModalMessage.classList.add("hidden");
        cedulaModalMessage.classList.remove("success", "error");
    }

    // Validar cédula contra el padrón cuando el usuario sale del campo
    googleCedulaInput.addEventListener("blur", async () => {
        const cedula = googleCedulaInput.value.trim();
        googleCedulaError.textContent = "";
        googleCedulaStatus.textContent = "";
        googleUserPreview.classList.add("hidden");
        cedulaSubmitBtn.disabled = true;
        cedulaValida = false;

        if (!cedula) return;

        googleCedulaStatus.textContent = "Consultando padrón...";

        try {
            const res = await fetch(`${API}/auth/cedula/${cedula}`);
            const data = await res.json();

            if (!res.ok) {
                googleCedulaError.textContent = data.message || "Cédula no encontrada.";
                googleCedulaStatus.textContent = "";
                return;
            }

            if (!data.esMayorDeEdad) {
                googleCedulaError.textContent = "Debes ser mayor de 18 años para registrarte.";
                googleCedulaStatus.textContent = "";
                return;
            }

            const nombreCompleto = `${data.nombre} ${data.apellido1} ${data.apellido2}`.trim();
            googleUserName.textContent = nombreCompleto;
            googleUserPreview.classList.remove("hidden");
            googleCedulaStatus.textContent = "✓ Cédula válida";
            cedulaValida = true;
            cedulaSubmitBtn.disabled = false;
        } catch {
            googleCedulaError.textContent = "Error al consultar el padrón.";
            googleCedulaStatus.textContent = "";
        }
    });

    // Enviar cédula + credential al backend
    cedulaSubmitBtn.addEventListener("click", async () => {
        if (!cedulaValida || !pendingToken) return;

        clearModalMessage();
        cedulaSubmitBtn.disabled = true;
        cedulaSubmitBtn.textContent = "Registrando...";

        try {
            const res = await fetch(`${API}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pendingToken: pendingToken, cedula: googleCedulaInput.value.trim() })
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                showModalMessage(data.message || "No se pudo completar el registro.", "error");
                cedulaSubmitBtn.disabled = false;
                cedulaSubmitBtn.textContent = "Completar registro";
                return;
            }

            saveToken(data.token);
            showModalMessage("Registro exitoso. Redirigiendo...", "success");
            setTimeout(() => { window.location.href = "../dashboard/dashboard.html"; }, 1000);
        } catch {
            showModalMessage("Error de conexión con el servidor.", "error");
            cedulaSubmitBtn.disabled = false;
            cedulaSubmitBtn.textContent = "Completar registro";
        }
    });

    async function handleGoogleResponse(response) {
        try {
            showMessage("Verificando cuenta de Google...", "success");

            const res = await fetch(`${API}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential })
            });

            const data = await res.json().catch(() => ({}));

            // Usuario nuevo — el backend pide cédula
            if (res.ok && data.needsCedula) {
                pendingToken = data.pendingToken;
                clearMessage();
                cedulaModal.classList.remove("hidden");
                return;
            }

            if (!res.ok) {
                showMessage(data.message || "No se pudo iniciar sesión con Google.", "error");
                return;
            }

            saveToken(data.token);
            showMessage("Inicio de sesión exitoso. Redirigiendo...", "success");
            setTimeout(() => { window.location.href = "../dashboard/dashboard.html"; }, 1000);
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
                if (data.unverified) {
                    showMessage(
                        "⚠️ Tu cuenta aún no está verificada. Revisá tu correo y hacé clic en el enlace de activación.",
                        "error"
                    );
                } else {
                    showMessage(data.message || "Credenciales incorrectas.", "error");
                }
                return;
            }

            // Credenciales correctas → se requiere verificación 2FA por SMS
            if (data.twoFactor) {
                pendingTempToken = data.tempToken;
                clearMessage();
                twoFactorCodeInput.value = "";
                twoFactorError.textContent = "";
                twoFactorMessage.classList.add("hidden");
                twoFactorSubmitBtn.disabled = false;
                twoFactorSubmitBtn.textContent = "Verificar código";
                twoFactorModal.classList.remove("hidden");
                twoFactorCodeInput.focus();
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