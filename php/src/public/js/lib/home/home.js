import {
  ChangeInnerHtmlById,
  LoadComponent,
} from "../../util/component_loader.js";
import { GET } from "../../api/api.js";
import { router } from "../../../app.js";

function LoadProduct(data) {
  const container = document.getElementById("product-data");
  if (!container) return;

  if (data.status === "success" && Array.isArray(data.data)) {
    const products = data.data;

    const html = products
      .map((p, index) => {
        const price = p.price.toLocaleString("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        });

        const imageUrl =
          p.main_image_path && p.main_image_path !== ""
            ? `/api/image?file=${p.main_image_path}`
            : `https://picsum.photos/200/200?random=${index + 1}`;

        return `
                <div class="product_card" >
                  <div class="product_image">
                    <img src="${imageUrl}" alt="${p.product_name}">
                  </div>
                  <div class="product_desc">
                    <div class="product_name">${p.product_name}</div>
                    <div class="product_price">${price}</div>
                    <div class="product_store">Toko ${p.store_id}</div>
                  </div>
                </div>
              `;
      })
      .join("");
    container.innerHTML = html;
    if (html == "") {
      container.innerHTML = "0 Product";
    }

    const cards = document.querySelectorAll(".product_card");
    cards.forEach((c, index) => {
      c.addEventListener("click", () => {
        router.navigateTo("/product-detail?id=" + products[index].product_id);
      });
    });
  } else {
    container.innerHTML = data.message || "No data available";
  }
}

function ProductErr(err) {
  if (err) {
    const container = document.getElementById("product-data");
    if (!container) return;
    container.innerHTML = "Prouduct Fetch Error :D";
  }
}

function ChangeCatalogLabel(label) {
  let elmt = document.getElementById("product-label");
  elmt.innerHTML = label;
}

export function LoadHome() {
  let param = new URLSearchParams(window.location.search);
  if (!param.toString()) {
    LoadComponent("slider", "/components/home/sliding_card.html");
    if (!document.getElementById("slider-id")) {
      LoadComponent("slider", "/components/home/sliding_card.html");
    }
    GET("/api/product", {}, LoadProduct, ProductErr);
    ChangeCatalogLabel("Product You Might Want");
  } else {
    GET(`/api/product?${param}`, {}, LoadProduct, ProductErr);
    ChangeCatalogLabel("Product Result");
  }
}
