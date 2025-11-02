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

  // Reset event listener
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

  // Reset event listener
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
