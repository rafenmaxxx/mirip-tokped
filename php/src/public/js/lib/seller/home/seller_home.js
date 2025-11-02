import { GET, POST_FORMDATA } from "../../../api/api.js";
import { ChangeInnerHtmlById } from "../../../util/component_loader.js";
import { router } from "../../../../app.js";
import { renderToast } from "../../general/toast.js";
import { Loading } from "../../general/loading.js";
import { InitQuill, changePlaceHolder } from "../../general/quill.js";

function LoadSellerData() {
  GET(
    "/api/detail_store",
    {},
    (data) => {
      if (data.status == "success") {
        const res = data.data;
        ChangeInnerHtmlById("store-name", res.store_name);
        ChangeInnerHtmlById("store-description", res.store_description);
        ChangeInnerHtmlById("total-product", res.total_products);
        ChangeInnerHtmlById("total-revenue", res.total_revenue);
        ChangeInnerHtmlById("low-stock", res.low_stock_products);
        ChangeInnerHtmlById("pending-order", res.pending_orders);
        const imgUrl = `/api/image?file=${res.store_logo_path}`;
        console.log(imgUrl);
        ChangeInnerHtmlById(
          "profile-avatar",
          `<img src="${imgUrl}" alt="Gambar Profil Toko">`
        );
      }
    },
    () => {}
  );
}

export function InitSeller() {
  LoadSellerData();

  const editBtn = document.getElementById("editBtn");
  const kelolaBtn = document.getElementById("kelolaBtn");
  const orderBtn = document.getElementById("orderBtn");
  const addProdBtn = document.getElementById("addProdBtn");

  editBtn.addEventListener("click", () => {
    const currentName = document.getElementById("store-name").textContent;
    const currentDesc =
      document.getElementById("store-description").textContent;
    showEditStoreModal(currentName, currentDesc);
  });

  kelolaBtn.addEventListener("click", () => {
    router.navigateTo("/seller/products");
  });

  orderBtn.addEventListener("click", () => {
    router.navigateTo("/seller/orders");
  });

  addProdBtn.addEventListener("click", () => {
    router.navigateTo("/seller/products/add");
  });
}

export function showEditStoreModal(currentName, currentDescription) {
  const modal = document.getElementById("edit-store-modal");
  const form = document.getElementById("edit-store-form");
  const nameInput = document.getElementById("edit-store-name");
  const descInput = document.getElementById("quill-desc-input");
  const imageInput = document.getElementById("edit-store-image");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  const closeBtn = document.getElementById("close-edit-modal");

  if (!modal) return;
  InitQuill();

  changePlaceHolder(currentDescription);
  nameInput.value = currentName;
  descInput.value = currentDescription;
  imageInput.value = "";

  modal.style.display = "flex";

  const closeModal = () => {
    modal.style.display = "none";
  };

  cancelBtn.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);

  // cloneNode untuk menghapus event listener sebelumnya
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newName = newForm.querySelector("#edit-store-name").value;
    const newDesc = newForm.querySelector("#quill-desc-input").value;
    const newImageFile = newForm.querySelector("#edit-store-image").files[0];

    console.log("Menyimpan data baru:");
    console.log("Nama:", newName);
    console.log("Deskripsi:", newDesc);
    console.log("File Gambar:", newImageFile);

    const formData = new FormData();

    formData.append("store_name", newName);
    formData.append("store_description", newDesc);

    if (newImageFile) {
      formData.append("gambar_toko", newImageFile);
    }

    POST_FORMDATA(
      "/api/detail_store",
      formData,
      (response) => {
        if (response.status === "success") {
          renderToast("Berhasil memperbarui data toko", "success");
          LoadSellerData();
        } else {
          renderToast(response.message, "error");
        }
        Loading.hide();
      },
      (response) => {
        renderToast(response.message, "error");
        Loading.hide();
      }
    );

    closeModal();
  });
}
