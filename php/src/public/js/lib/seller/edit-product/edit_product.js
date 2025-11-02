import { router } from "../../../../app.js";
import { GET } from "../../../api/api.js";
import { ChangeInnerHtmlById } from "../../../util/component_loader.js";
import { showModalConfirmation } from "../../general/modal.js";
import { changePlaceHolder, InitQuill } from "../../general/quill.js";

function LoadPlaceHolder(id) {
  if (!id) return;

  GET(
    "/api/product",
    { id: id },
    (res) => {
      if (!res || res.status !== "success" || !res.data) {
        console.warn("Produk tidak ditemukan");
        return;
      }

      const data = res.data;

      document.getElementById("nama-produk").value = data.product_name || "";
      document.getElementById("harga").value = data.price || "";
      document.getElementById("stok").value = data.stock || "";
      changePlaceHolder(data.description);
      const uploadBox = document.querySelector(".form-image-upload");
      if (data.main_image_path) {
        uploadBox.innerHTML = `
          <img src="/api/image?file=${data.main_image_path}" alt="Product Image"
               style="width:100%;border-radius:10px;object-fit:cover;max-height:200px;">
        `;
      }

      if (Array.isArray(data.categories)) {
        const checkboxes = document.querySelectorAll(
          '.filter-checkboxes input[type="checkbox"]'
        );
        checkboxes.forEach((cb) => {
          const labelText = cb.parentNode.textContent.trim();
          cb.checked = data.categories.includes(labelText);
        });
      }
      console.log("Placeholder berhasil diisi:", data);
    },
    (err) => {
      console.error("Gagal memuat data produk:", err);
    }
  );
}

export function InitEditProduct() {
  InitQuill();
  const param = new URLSearchParams(window.location.search);
  const param_id = param.get("product_id");

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
      "Yakin batal? Perubahan tidak akan disimpan.",
      () => router.navigateTo("/"),
      () => {}
    );
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

  ChangeInnerHtmlById(
    "tersembunyi",
    ` <input type="hidden" name="_method" id="_method" value="PUT">
        <input type="hidden" name="product_id" id="product-id" value=${param_id}>`
  );

  LoadPlaceHolder(param_id);
}
