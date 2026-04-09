import { API } from "../core/config.js";

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");

    const cedulaInput = document.getElementById("cedula");
    const nameInput = document.getElementById("name");
    const lastNameInput = document.getElementById("lastName");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    const togglePasswordBtn = document.getElementById("togglePassword");
    const toggleConfirmPasswordBtn = document.getElementById("toggleConfirmPassword");

    const formMessage = document.getElementById("formMessage");

    const cedulaError = document.getElementById("cedulaError");
    const cedulaStatus = document.getElementById("cedulaStatus");
    const nameError = document.getElementById("nameError");
    const lastNameError = document.getElementById("lastNameError");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const confirmPasswordError = document.getElementById("confirmPasswordError");

    let cedulaValida = false;

    // ─── Consulta al padrón por cédula ────────────────────────────────────────

    cedulaInput.addEventListener("blur", async () => {
        const cedula = cedulaInput.value.trim();
        cedulaError.textContent = "";
        cedulaStatus.textContent = "";
        cedulaValida = false;
        nameInput.value = "";
        lastNameInput.value = "";

        if (!cedula) return;

        cedulaStatus.textContent = "Consultando padrón...";
        cedulaStatus.style.color = "";

        try {
            const res = await fetch(`${API}/auth/cedula/${cedula}`);
            const data = await res.json();

            if (!res.ok) {
                cedulaError.textContent = data.message || "Cédula no encontrada.";
                cedulaStatus.textContent = "";
                return;
            }

            if (!data.esMayorDeEdad) {
                cedulaError.textContent = "Debes ser mayor de 18 años para registrarte.";
                cedulaStatus.textContent = "";
                return;
            }

            nameInput.value = data.nombre || "";
            lastNameInput.value = `${data.apellido1} ${data.apellido2}`.trim();

            cedulaStatus.textContent = "✓ Cédula válida";
            cedulaStatus.style.color = "green";
            cedulaValida = true;
        } catch (e) {
            cedulaError.textContent = "Error al consultar el padrón.";
            cedulaStatus.textContent = "";
        }
    });

    // ─── Utilidades ────────────────────────────────────────────────────────────

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

    function clearErrors() {
        cedulaError.textContent = "";
        nameError.textContent = "";
        lastNameError.textContent = "";
        emailError.textContent = "";
        passwordError.textContent = "";
        confirmPasswordError.textContent = "";
        clearMessage();
    }

    function validateEmail(email) {
        return /\S+@\S+\.\S+/.test(email);
    }

    function validateForm() {
        clearErrors();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        let isValid = true;

        if (!cedulaInput.value.trim()) {
            cedulaError.textContent = "La cédula es obligatoria.";
            isValid = false;
        } else if (!cedulaValida) {
            cedulaError.textContent = "Debes validar tu cédula antes de registrarte.";
            isValid = false;
        }

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

        if (!confirmPassword) {
            confirmPasswordError.textContent = "Debes confirmar la contraseña.";
            isValid = false;
        } else if (password !== confirmPassword) {
            confirmPasswordError.textContent = "Las contraseñas no coinciden.";
            isValid = false;
        }

        return isValid;
    }

    function togglePasswordVisibility(input, button) {
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        button.textContent = isPassword ? "Ocultar" : "Ver";
    }

    togglePasswordBtn.addEventListener("click", () => {
        togglePasswordVisibility(passwordInput, togglePasswordBtn);
    });

    toggleConfirmPasswordBtn.addEventListener("click", () => {
        togglePasswordVisibility(confirmPasswordInput, toggleConfirmPasswordBtn);
    });

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!validateForm()) return;

        const payload = {
            name: nameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value.trim(),
            cedula: cedulaInput.value.trim(),
        };

        try {
            clearMessage();

            const res = await fetch(`${API}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                showMessage(data.message || "No se pudo registrar la cuenta.", "error");
                return;
            }

            showMessage("Cuenta creada correctamente. Ahora puedes iniciar sesión.", "success");

            setTimeout(() => {
                window.location.href = "./login.html";
            }, 1200);
        } catch (error) {
            console.error("Error en registro:", error);
            showMessage("Error de conexión con el servidor.", "error");
        }
    });
});