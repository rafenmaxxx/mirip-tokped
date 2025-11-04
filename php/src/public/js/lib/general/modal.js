import { LoadComponent } from "../../util/component_loader.js";

export function showModalConfirmation(message, yesCallback, noCallback) {
  const modal = document.getElementById("confirmation-modal");

  if (!modal) {
    LoadComponent(
      "global-modal-container",
      "/components/general/modal_confirmation.html",
      () => {
        attachModalConfirmationLogic(message, yesCallback, noCallback);
      }
    );
  } else {
    attachModalConfirmationLogic(message, yesCallback, noCallback);
  }
}

function attachModalConfirmationLogic(message, yesCallback, noCallback) {
  const modal = document.getElementById("confirmation-modal");
  const messageEl = modal.querySelector("#confirmation-message");
  const yesBtn = modal.querySelector("#confirm-yes");
  const noBtn = modal.querySelector("#confirm-no");

  messageEl.textContent = message;
  modal.style.display = "flex";

  const newYes = yesBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(newYes, yesBtn);
  const newNo = noBtn.cloneNode(true);
  noBtn.parentNode.replaceChild(newNo, noBtn);

  newYes.addEventListener("click", () => {
    modal.style.display = "none";
    if (typeof yesCallback === "function") yesCallback();
  });

  newNo.addEventListener("click", () => {
    modal.style.display = "none";
    if (typeof noCallback === "function") noCallback();
  });
}

export function showModalNumberInput(message, yesCallback, noCallback) {
  const modal = document.getElementById("input-number-modal");

  if (!modal) {
    LoadComponent(
      "global-modal-container",
      "/components/general/modal_input_number.html",
      () => {
        attachModalNumberLogic(message, yesCallback, noCallback);
      }
    );
  } else {
    attachModalNumberLogic(message, yesCallback, noCallback);
  }
}

function attachModalNumberLogic(message, yesCallback, noCallback) {
  const modal = document.getElementById("input-number-modal");
  const messageEl = modal.querySelector("#input-number-message");
  const inputField = modal.querySelector("#input-number-field");
  const yesBtn = modal.querySelector("#input-number-yes");
  const noBtn = modal.querySelector("#input-number-no");

  messageEl.textContent = message;
  inputField.value = "";
  modal.style.display = "flex";

  const newYes = yesBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(newYes, yesBtn);
  const newNo = noBtn.cloneNode(true);
  noBtn.parentNode.replaceChild(newNo, noBtn);

  newYes.addEventListener("click", () => {
    const value = parseInt(inputField.value, 10);
    if (isNaN(value) || value < 0) {
      alert("Masukkan angka >= 0");
      return;
    }

    modal.style.display = "none";
    if (typeof yesCallback === "function") yesCallback(value);
  });

  newNo.addEventListener("click", () => {
    modal.style.display = "none";
    if (typeof noCallback === "function") noCallback();
  });
}

export function showModalTextInput(message, yesCallback, noCallback) {
  const modal = document.getElementById("input-text-modal");

  if (!modal) {
    LoadComponent(
      "global-modal-container",
      "/components/general/modal_input_text.html",
      () => {
        attachModalTextLogic(message, yesCallback, noCallback);
      }
    );
  } else {
    attachModalTextLogic(message, yesCallback, noCallback);
  }
}

function attachModalTextLogic(message, yesCallback, noCallback) {
  const modal = document.getElementById("input-text-modal");
  const messageEl = modal.querySelector("#input-text-message");
  const inputField = modal.querySelector("#input-text-field");
  const yesBtn = modal.querySelector("#input-text-yes");
  const noBtn = modal.querySelector("#input-text-no");

  messageEl.textContent = message;
  inputField.value = "";
  modal.style.display = "flex";

  const newYes = yesBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(newYes, yesBtn);
  const newNo = noBtn.cloneNode(true);
  noBtn.parentNode.replaceChild(newNo, noBtn);

  newYes.addEventListener("click", () => {
    const value = inputField.value.trim();
    if (!value) {
      alert("Masukkan teks tidak boleh kosong!");
      return;
    }

    modal.style.display = "none";
    if (typeof yesCallback === "function") yesCallback(value);
  });

  newNo.addEventListener("click", () => {
    modal.style.display = "none";
    if (typeof noCallback === "function") noCallback();
  });
}

export function showModalSpinnerInput(
  message,
  maxValue,
  yesCallback,
  noCallback
) {
  const modal = document.getElementById("input-spinner-modal");

  if (!modal) {
    LoadComponent(
      "global-modal-container",
      "/components/general/modal_input_spinner.html",
      () => {
        attachModalSpinnerLogic(message, maxValue, yesCallback, noCallback);
      }
    );
  } else {
    attachModalSpinnerLogic(message, maxValue, yesCallback, noCallback);
  }
}

function attachModalSpinnerLogic(message, maxValue, yesCallback, noCallback) {
  const modal = document.getElementById("input-spinner-modal");
  const messageEl = modal.querySelector("#input-spinner-message");
  const inputField = modal.querySelector("#spinner-field");
  const decBtn = modal.querySelector("#spinner-decrease");
  const incBtn = modal.querySelector("#spinner-increase");
  const yesBtn = modal.querySelector("#spinner-yes");
  const noBtn = modal.querySelector("#spinner-no");

  messageEl.textContent = message;
  inputField.value = "1";
  inputField.min = 1;
  inputField.max = maxValue;
  modal.style.display = "flex";

  // Reset event listener lama
  const newYes = yesBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(newYes, yesBtn);
  const newNo = noBtn.cloneNode(true);
  noBtn.parentNode.replaceChild(newNo, noBtn);

  // Tombol increment/decrement
  decBtn.onclick = () => {
    let val = parseInt(inputField.value, 10);
    if (val > 1) inputField.value = val - 1;
  };

  incBtn.onclick = () => {
    let val = parseInt(inputField.value, 10);
    if (val < maxValue) inputField.value = val + 1;
  };

  // Validasi input manual
  inputField.addEventListener("input", () => {
    let val = parseInt(inputField.value, 10);
    if (isNaN(val) || val < 1) inputField.value = 1;
    else if (val > maxValue) inputField.value = maxValue;
  });

  // Tombol OK
  newYes.addEventListener("click", () => {
    const value = parseInt(inputField.value, 10);
    if (isNaN(value) || value < 1 || value > maxValue) {
      alert(`Masukkan angka antara 1 dan ${maxValue}`);
      return;
    }
    modal.style.display = "none";
    if (typeof yesCallback === "function") yesCallback(value);
  });

  // Tombol Batal
  newNo.addEventListener("click", () => {
    modal.style.display = "none";
    if (typeof noCallback === "function") noCallback();
  });
}
