import { router } from "../../../../app.js";
import { showModalConfirmation } from "../../general/modal.js";

export function InitAddProduct() {
  document.getElementById("harga").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  });

  document.getElementById("stok").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  });
  document.querySelector(".btn-ganti-foto").addEventListener("click", () => {
    document.getElementById("product-img").click();
  });

  const batalBtn = document.getElementById("batalBtn");
  batalBtn.addEventListener("click", () => {
    showModalConfirmation(
      "Yakin batal? ini ga akan kesimpen lho",
      () => {
        router.navigateTo("/");
      },
      () => {}
    );
  });
}
