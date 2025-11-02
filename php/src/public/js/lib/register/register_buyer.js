import { ValidatePassword } from "../../util/password_validation.js";
import { renderToast } from "../general/toast.js";

export function SendBuyerRegisterForm(e) {
  const _password = document.getElementById("password").value;
  const _confirm = document.getElementById("confirm-password").value;
  if (_password != _confirm) {
    // tolak
    e.preventDefault();
    renderToast("Password tidak sama", "error");
    return;
  }

  if (!ValidatePassword(_password)) {
    e.preventDefault();
    renderToast("Password tidak valid", "error");
    return;
  }
}

export function InitRegisterBuyer() {
  const submitBtn = document.getElementById("regBuyerBtn");
  submitBtn.addEventListener("click", (e) => {
    SendBuyerRegisterForm(e);
  });

  const toggleButtons = document.querySelectorAll(".toggle-password");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = document.getElementById("confirm-password") === btn.previousElementSibling ? "confirm-password" : "password";
      const input = document.getElementById(targetId);
      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈";
      } else {
        input.type = "password";
        btn.textContent = "👁️";
      }
    });
  });
}
