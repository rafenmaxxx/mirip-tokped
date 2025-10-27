import { ValidatePassword } from "../../util/password_validation.js";

export function SendBuyerRegisterForm(e) {
  const _password = document.getElementById("password").value;
  const _confirm = document.getElementById("confirm-password").value;
  if (_password != _confirm) {
    // tolak
    e.preventDefault();
    alert("Password tidak sama!");
    return;
  }

  if (!ValidatePassword(_password)) {
    e.preventDefault();
    alert("Password tidak valid!");
    return;
  }
}

export function InitRegisterBuyer() {
  const submitBtn = document.getElementById("regBuyerBtn");
  submitBtn.addEventListener("click", (e) => {
    SendBuyerRegisterForm(e);
  });
}
