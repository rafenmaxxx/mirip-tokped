import { router } from "../../../../app.js";
import { showModalConfirmation } from "../../general/modal.js";
import { InitQuill } from "../../general/quill.js";

export function InitAddProduct() {
  InitQuill();
  document.getElementById("harga").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  });

  document.getElementById("stok").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  });
  document.querySelector(".btn-ganti-foto").addEventListener("click", () => {
    document.getElementById("product-img").click();
  });

  const imgInput = document.getElementById("product-img");
  const imgContainer = document.querySelector(".form-image-upload");

  imgInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // hapus gambar lama kalau ada
        imgContainer.innerHTML = "";
        imgContainer.classList.add("has-image");

        // buat elemen img
        const img = document.createElement("img");
        img.src = e.target.result;
        img.alt = "Preview";

        imgContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
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
