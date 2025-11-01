import { router } from "../../../app.js";
import { GET, POST } from "../../api/api.js";
import { ChangeInnerHtmlById } from "../../util/component_loader.js";
import { renderToast } from "../general/toast.js";

function LoadDetail(data) {
  const res = data.data;
  const price = res.price.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });
  ChangeInnerHtmlById("p-name", res.product_name);
  ChangeInnerHtmlById("p-price", price);
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
  storeBtn.addEventListener("click", () => {
    router.navigateTo("/store?store_id=" + res.store_id);
  });
}

function LoadAddCartBtn(id) {
  GET(
    "/api/auth",
    {},
    (data) => {
      if (data.status == "success") {
        const res = data.data;
        if (res.role == "BUYER") {
          ChangeInnerHtmlById(
            "add-cart",
            `<button class="visit-store-btn" id="cartBtn">Add To Cart</button>`
          );
          const cartBtn = document.getElementById("cartBtn");
          cartBtn.addEventListener("click", (e) => {
            const product_id = id;
            console.log("Adding to cart:", product_id, data.data.id);
            e.stopPropagation();
            POST(
              "/api/cart",
              { action: "add", product_id: product_id, buyer_id: data.data.id },
              (response) => {
                if (response.status === "success") {
                  renderToast(
                    "Berhasil menambahkan produk kedalam cart",
                    "success"
                  );
                } else {
                  renderToast(
                    "Gagal menambahkan produk kedalam cart",
                    "success"
                  );
                }
              },
              () => {}
            );
          });
        }
      }
      {
      }
    },
    () => {}
  );
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
  LoadAddCartBtn(param_id);
}
