import { GET } from "../../../api/api.js";
import { ChangeInnerHtmlById } from "../../../util/component_loader.js";
import { router } from "../../../../app.js";
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
    router.navigateTo("");
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
