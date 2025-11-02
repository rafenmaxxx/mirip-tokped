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

  document.getElementById("product-img").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      document.querySelector(".form-image-upload").innerHTML = `
      <img src="${event.target.result}" alt="Preview"
           style="width:100%;border-radius:10px;object-fit:cover;max-height:200px;">
    `;
    };
    reader.readAsDataURL(file);
  });
  document.querySelector(".product-form").addEventListener("submit", (e) => {
    const nama = document.getElementById("nama-produk").value.trim();
    const harga = document.getElementById("harga").value.trim();
    const stok = document.getElementById("stok").value.trim();

    if (!nama || !harga || !stok) {
      e.preventDefault();
      alert("Pastikan semua field wajib diisi!");
    }
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
