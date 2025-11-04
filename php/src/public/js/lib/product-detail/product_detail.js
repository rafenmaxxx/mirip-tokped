import { router } from "../../../app.js";
import { GET, POST } from "../../api/api.js";
import { ChangeInnerHtmlById } from "../../util/component_loader.js";
import { renderToast } from "../general/toast.js";
import { InitCountCart } from "../general/navbar.js";
import {
  showModalConfirmation,
  showModalSpinnerInput,
} from "../general/modal.js";

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
  ChangeInnerHtmlById(
    "btn-store",
    `<button class="visit-store-btn" id="v-store">Kunjungi Toko</button>`
  );
  const storeBtn = document.getElementById("v-store");
  storeBtn.addEventListener("click", () => {
    router.navigateTo("/store?store_id=" + res.store_id);
  });
  if (Array.isArray(res.categories) && res.categories.length > 0) {
    ChangeInnerHtmlById("p-category", res.categories.join(", "));
  } else {
    ChangeInnerHtmlById("p-category", "-");
  }
}

function LoadAddCartBtn(id, stock) {
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
            showModalSpinnerInput(
              "Tambahkan ke keranjang",
              stock,
              (qty) => {
                const product_id = id;
                e.stopPropagation();
                POST(
                  "/api/cart",
                  {
                    action: "add",
                    product_id: product_id,
                    buyer_id: data.data.id,
                    quantity: qty,
                  },
                  (response) => {
                    if (response.status === "success") {
                      renderToast(
                        `Berhasil menambahkan ${qty} produk  kedalam cart`,
                        "success"
                      );
                      InitCountCart();
                    } else {
                      renderToast(
                        "Gagal menambahkan produk kedalam cart",
                        "success"
                      );
                    }
                  },
                  () => {}
                );
              },
              () => {}
            );
          });
        }
      } else {
        ChangeInnerHtmlById(
          "add-cart",
          `<button class="visit-store-btn" id="cartBtn">Add To Cart</button>`
        );
        const cartBtn = document.getElementById("cartBtn");
        cartBtn.addEventListener("click", (e) => {
          showModalConfirmation(
            "Login untuk menambahkan !",
            () => {
              router.navigateTo("/login");
            },
            () => {}
          );
        });
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

  GET(
    "/api/product",
    { id: param_id },
    (data) => {
      LoadDetail(data);
      const stock = data.data.stock;
      LoadAddCartBtn(param_id, stock);
    },
    IsErr
  );
}
