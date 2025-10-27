import { LoadComponent } from "../../util/component_loader.js";
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
                    <div class="product_buttons">
                      <button class="btn btn-cart">Add to Cart</button>
                      <button class="btn btn-checkout">Checkout</button>
                    </div>
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

function LoadProfileStore(data) {
  const container = document.getElementById("store-profile");
  if (!container) return;

  if (data.status === "success" && data.data) {
    const store = data.data;
  
    const imageUrl = store.store_logo_path && store.store_logo_path !== ""
      ? `/api/image?file=${store.store_logo_path}`
      : `https://picsum.photos/200/200?random=${index + 1}`;

      
    const html = `
          <div class="store_card">
            <div class="store_image">
              <img src="${imageUrl}" alt="${store.store_name}">
            </div>
            <div class="store_desc">
              <div class="store_name">${store.store_name}</div>
              <div class="store_description">${store.store_description}</div>
            </div>
          </div>
      `;
    
    // tampilkan hasil
    container.innerHTML = html;
  } else {
    container.innerHTML = data.message || "No data available";
  };
}

function ProfileErr(err) {
  if (err) {
    const storeProfileContainer = document.getElementById("store-profile");
    if (!storeProfileContainer) return;
    storeProfileContainer.innerHTML = "Store Profile Fetch Error :D";
  }
}

function ProductErr(err) {
  if (err) {
    const container = document.getElementById("product-data");
    if (!container) return;
    container.innerHTML = "Product Fetch Error :D";
  }
}

function ChangeCatalogLabel(label) {
  let elmt = document.getElementById("product-label");
  elmt.innerHTML = label;
}

export async function LoadDetailStore() {
  let param = new URLSearchParams(window.location.search);
  const param_id = param.get("store_id");

  if (!param_id) {
    const default_store_id = 1; // Ganti dengan ID toko default yang diinginkan
    GET("/api/detail_store", { store_id: default_store_id }, LoadProfileStore, ProfileErr);
    GET("/api/product", { store_id: default_store_id }, LoadProduct, ProductErr);
  }else {
    GET("/api/detail_store", { store_id: param_id }, LoadProfileStore, ProfileErr);
    GET("/api/product", { store_id: param_id }, LoadProduct, ProductErr);
  }
}

