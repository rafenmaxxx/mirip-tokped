import { router } from "../../../app.js";
import { renderToast } from "../general/toast.js";

let selectedType = null;

export function initRegisterChoice() {
  const cards = document.querySelectorAll(".selectable");
  let selectedType = null;

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      cards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedType = card.dataset.type;
    });
  });

  const form = document.getElementById("registerForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!selectedType) {
      renderToast("Pilih salah satu (seller/buyer)", "error");
      return;
    }

    if (selectedType === "buyer") {
      router.navigateTo("/register/buyer");
    } else if (selectedType === "seller") {
      router.navigateTo("/register/seller");
    }
  });
}
