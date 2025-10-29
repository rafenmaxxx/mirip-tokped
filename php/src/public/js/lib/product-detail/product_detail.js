import { router } from "../../../app.js";
import { GET } from "../../api/api.js";
import { ChangeInnerHtmlById } from "../../util/component_loader.js";

function LoadDetail(data) {
  const res = data.data;
  ChangeInnerHtmlById("p-name", res.product_name);
  ChangeInnerHtmlById("p-price", "Rp." + res.price);
  ChangeInnerHtmlById("p-desc", res.description);
  ChangeInnerHtmlById(
    "p-stock",
    "<p><strong>Stok:</strong>" + res.stock + " pcs</p>"
  );
  ChangeInnerHtmlById("s-desc", res.store_description);
  ChangeInnerHtmlById("s-name", res.store_name);
  const p_img_url = "api/image?file=" + res.main_image_path;
  ChangeInnerHtmlById(
    "p-img",
    `<img src="${p_img_url}" alt="${res.product_name} Image" class="product-image">`
  );
  const s_img_url = "api/image?file=" + res.store_logo_path;
  ChangeInnerHtmlById(
    "s-img",
    `<img src="${s_img_url}" alt="${res.store_name} Logo" class="seller-avatar">`
  );
  const storeBtn = document.getElementById("v-store");
  storeBtn.setAttribute("href", "/store?store_id=" + res.store_id);
}

function IsErr(err) {}

export function InitProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const param_id = params.get("id");
  GET("/api/product", { id: param_id }, LoadDetail, IsErr);
  const backBtn = document.getElementById("back-btn");
  backBtn.addEventListener("click", () => {
    router.navigateTo("/");
  });
}
