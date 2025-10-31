import { LoadComponent } from "../../util/component_loader.js";

export function showModalConfirmation(message, yesCallback, noCallback) {
  const modal = document.getElementById("confirmation-modal");

  // Kalau modal belum pernah dimuat, muat dulu secara dinamis
  if (!modal) {
    LoadComponent(
      "global-modal-container",
      "/components/general/modal_confirmation.html",
      () => {
        attachModalLogic(message, yesCallback, noCallback);
      }
    );
  } else {
    attachModalLogic(message, yesCallback, noCallback);
  }
}

function attachModalLogic(message, yesCallback, noCallback) {
  const modal = document.getElementById("confirmation-modal");
  const messageEl = modal.querySelector("#confirmation-message");
  const yesBtn = modal.querySelector("#confirm-yes");
  const noBtn = modal.querySelector("#confirm-no");

  messageEl.textContent = message;
  modal.style.display = "flex";

  // Bersihkan event listener lama
  const newYes = yesBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(newYes, yesBtn);
  const newNo = noBtn.cloneNode(true);
  noBtn.parentNode.replaceChild(newNo, noBtn);

  // Tambahkan event listener baru
  newYes.addEventListener("click", () => {
    modal.style.display = "none";
    if (typeof yesCallback === "function") yesCallback();
  });

  newNo.addEventListener("click", () => {
    modal.style.display = "none";
    if (typeof noCallback === "function") noCallback();
  });
}
