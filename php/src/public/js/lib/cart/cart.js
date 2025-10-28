import { LoadComponent } from "../../util/component_loader.js";
import { GET } from "../../api/api.js";
import { router } from "../../../app.js";

function LoadCartItems(data) {
  const container = document.getElementById("cart-data");
  if (!container) return;

  if (data.status === "success" && Array.isArray(data.data)) {
    const cartItems = data.data;

    
    const html = cartItems.map((item, index) => {
      const details = item.items.map((detail, dindex) => {
        const price = detail.price.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        });
        
        const imageUrl =
          detail.image && detail.image !== ""
            ? `/api/image?file=${detail.image}`
            : `https://picsum.photos/200/200?random=${index + 1}`;
        
        return ` 
          <div class="cart_item_detail">
            <div class="cart_item_image">
                <img src="${imageUrl}"">
            </div>
            <div class="cart_item_info_container">
              <div class="cart_item_info">
                <p class="cart_item_name">${detail.product_name}</p>
                <p class="cart_item_price">${price}</p>
              </div>
              <div class="cart_quantity">
                  <a href="/decreament"><button class="btn btn-decrease-quantity" data-item-id="${detail.cart_item_id}" id="decrease-qty-btn-${index}-${dindex}">-</button></a>
                  <span class="quantity_value" id="quantity-value-${index}-${dindex}">${detail.quantity}</span>
                  <a href="/increament"><button class="btn btn-increase-quantity" data-item-id="${detail.cart_item_id}" id="increase-qty-btn-${index}-${dindex}">+</button></a>
              </div>
            </div>
          </div>`;
      });
      return `
        <div class="cart_item_card">
            <div class="cart_store_heading">
              <h3 class="cart_store_name">${item.store_name}</h3>
              <button class="btn btn-remove-store" data-store-id="${item.store_id}" id="remove-store-btn-${index}">Hapus</button>
            </div>
            <div class="cart_item_details">
              ${details.join("")}
            </div>
            <div class="cart_subtotal">
                ${item.subtotal.toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                })}
            </div>
        </div>
      `;
    }).join("");

    container.innerHTML = `
          <h2 id="cart-label" class="cart_title">Cart</h2>${html}
    `;

    if (html == "") {
      const emptyCart = `
          <div class="empty_cart">
              <div class="empty_cart_image">
                    <img src="..\/..\/..\/img\/empty-cart.png" class="empty_cart_img">
              </div>
              <h2>Keranjang kamu masih kosong nih!</h2>
              <button class="btn btn-shop" id="shop-now-btn">Mulai Belanja</button>
          </div>
      `;

      container.innerHTML = emptyCart;
    }

    const removeButtons = document.querySelectorAll(".btn-remove-store");
    removeButtons.forEach((btn, index) => {
      btn.addEventListener("click", () => {
        const storeId = btn.getAttribute("data-store-id");
        // Call API to remove store from cart
        console.log("Remove store:", storeId);
      });
    });
  } else {
    container.innerHTML = data.message || "No data available";
  }
}

function LoadSummary(data) {
  const container = document.getElementById("cart-summary");
  if (!container) return;

  if (data.status === "success" && data.data) {
    const summary = data.data;
    // console.log(summary);

    const subtotal_html = summary.subtotal.map((item, index) => {
        const subtotal = item.subtotal.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        });

        return `
            <div class="summary_item">
                <div class="summary_item_name">${item.store_name}</div>
                <div class="summary_item_price">${subtotal}</div>
            </div>
        `;
    }).join("");

    const total_price = summary.total_price.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    });

    const html = `
        <div class="summary_card">
            <div class="summary_desc">
                <h3>Cart Summary</h3>
                <div class="summary_subtotal">
                    ${subtotal_html}
                </div>
            </div>
            <div class="summary_total">
                <div class="summary_total_price">${total_price}</div>
            </div>
            <button class="btn btn-checkout-summary" id="checkout-btn">Checkout Now</button>
        </div>
    `;
    
    // tampilkan hasil
    container.innerHTML = html;
  } else {
    container.innerHTML = data.message || "No data available";
  };
}

function CartItemsErr(err) {
  if (err) {
    const cartItemsContainer = document.getElementById("cart-items");
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = "Cart Items Fetch Error :D";
  }
}

function SummaryErr(err) {
  if (err) {
    const container = document.getElementById("summary-data");
    if (!container) return;
    container.innerHTML = "Summary Fetch Error :D";
  }
}

export async function LoadCartPage() {
  let param = new URLSearchParams(window.location.search);
  const param_id = param.get("buyer_id");

  if (!param_id) {
    const default_buyer_id = 6; // Ganti dengan ID pembeli default yang diinginkan
    GET("/api/cart", { buyer_id: default_buyer_id }, LoadCartItems, CartItemsErr);
    GET("/api/cart", { buyer_id: default_buyer_id, total: true }, LoadSummary, SummaryErr);
  }else {
    GET("/api/cart", { buyer_id: param_id }, LoadCartItems, CartItemsErr);
    GET("/api/cart", { buyer_id: param_id, total: true }, LoadSummary, SummaryErr);
  }
}

