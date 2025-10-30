import { GET } from "../../api/api.js";
import { PUT } from "../../api/api.js";
import { DELETE } from "../../api/api.js";
import { router } from "../../../app.js";

function reloadCartPage(buyer_id) {
  GET("/api/cart", { buyer_id: buyer_id }, (data) => {
    LoadCartItems(data);
    // Juga refresh summary
    refreshSummary(buyer_id);
  }, CartItemsErr);
}

// Function untuk refresh single store card
function refreshStoreCard(buyer_id, store_id) {
  GET(
    "/api/cart", 
    { buyer_id: buyer_id, store_id: store_id }, 
    (data) => {
      console.log("Data received:", data); // ← tambahkan log
      
      // Pastikan data valid
      if (!data || data.status !== "success" || !data.data || !data.data.store) {
        console.error("Invalid data structure:", data);
        return;
      }
      
      const storeData = data.data.store;
      const storeCard = document.querySelector(`[data-store-card-id="${store_id}"]`);
      
      if (!storeCard) {
        console.error("Store card not found for store_id:", store_id);
        return;
      }

      // Update store card content
      const details = storeData.items.map((detail, dindex) => {
        const price = detail.price.toLocaleString("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        });
        
        const imageUrl =
          detail.image && detail.image !== ""
            ? `/api/image?file=${detail.image}`
            : `https://picsum.photos/200/200?random=${dindex + 1}`;
        
        return ` 
          <div class="cart_item_detail">
            <div class="cart_item_image">
                <img src="${imageUrl}">
            </div>
            <div class="cart_item_info_container">
              <div class="cart_item_info">
                <p class="cart_item_name">${detail.product_name}</p>
                <p class="cart_item_price">${price}</p>
              </div>
              <div class="cart_quantity">
                  <button class="btn btn-decreament-quantity" data-cart-item-id="${detail.cart_item_id}" data-store-id="${store_id}" data-buyer-id="${buyer_id}">-</button>
                  <span class="quantity_value" id="quantity-value-${detail.cart_item_id}" data-stock="${detail.stock}">${detail.quantity}</span>
                  <button class="btn btn-increament-quantity" data-cart-item-id="${detail.cart_item_id}" data-store-id="${store_id}" data-buyer-id="${buyer_id}">+</button>
              </div>
            </div>
          </div>`;
      }).join("");

      const detailsContainer = storeCard.querySelector('.cart_item_details');
      const subtotalContainer = storeCard.querySelector('.cart_subtotal');
      
      if (detailsContainer) {
        detailsContainer.innerHTML = details;
      }
      
      if (subtotalContainer) {
        subtotalContainer.innerHTML = storeData.subtotal.toLocaleString("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        });
      }

      // Re-attach event listeners
      attachQuantityButtonListeners(storeCard);
    }, 
    () => {}
  );
}

function refreshSummary(buyer_id) {
  GET("/api/cart", { buyer_id: buyer_id, action: 'summary' }, LoadSummary, SummaryErr);
}

// Function untuk attach event listeners pada quantity buttons
function attachQuantityButtonListeners(container = document) {
  const increamentButtons = container.querySelectorAll(".btn-increament-quantity");
  increamentButtons.forEach((btn) => {
    // Remove old listener dengan cloning
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener("click", () => {
      const cart_item_id = newBtn.getAttribute("data-cart-item-id");
      const store_id = newBtn.getAttribute("data-store-id");
      const buyer_id = newBtn.getAttribute("data-buyer-id");
      const quantityValue = document.getElementById(`quantity-value-${cart_item_id}`);
      const stock = parseInt(quantityValue.getAttribute("data-stock"));
      const quantity = parseInt(quantityValue.textContent);
      
      if (quantity < stock) {
        PUT("/api/cart", { cart_item_id: cart_item_id, action: "increament" }, (response) => {
          if (response.status === "success") {
            // Refresh store card dan summary
            refreshStoreCard(buyer_id, store_id);
            refreshSummary(buyer_id);
          }
        }, Increamenterr);
      }
    });
  });

  const decreamentButtons = container.querySelectorAll(".btn-decreament-quantity");
  decreamentButtons.forEach((btn) => {
    // Remove old listener dengan cloning
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener("click", () => {
      const cart_item_id = newBtn.getAttribute("data-cart-item-id");
      const store_id = newBtn.getAttribute("data-store-id");
      const buyer_id = newBtn.getAttribute("data-buyer-id");
      const quantityValue = document.getElementById(`quantity-value-${cart_item_id}`);
      const quantity = parseInt(quantityValue.textContent);
      
      if (quantity > 1) {
        PUT("/api/cart", { cart_item_id: cart_item_id, action: "decreament" }, (response) => {
          if (response.status === "success") {
            refreshStoreCard(buyer_id, store_id);
            refreshSummary(buyer_id);
          }
        }, Increamenterr);
      } else {
        openModal(cart_item_id, store_id, buyer_id, 'item');
      }
    });
  });
}

function LoadCartItems(data) {
  console.log("LoadCartItems received:", data); 
  const container = document.getElementById("cart-data");
  if (!container) return;
  
  if (data.status === "success" && Array.isArray(data.data.stores)) {
    const cartItems = data.data.stores;
    const buyer_id = data.data.buyer_id;
    
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
                <img src="${imageUrl}">
            </div>
            <div class="cart_item_info_container">
              <div class="cart_item_info">
                <p class="cart_item_name">${detail.product_name}</p>
                <p class="cart_item_price">${price}</p>
              </div>
              <div class="cart_quantity">
                  <button class="btn btn-decreament-quantity" data-cart-item-id="${detail.cart_item_id}" data-store-id="${item.store_id}" data-buyer-id="${buyer_id}">-</button>
                  <span class="quantity_value" id="quantity-value-${detail.cart_item_id}" data-stock="${detail.stock}">${detail.quantity}</span>
                  <button class="btn btn-increament-quantity" data-cart-item-id="${detail.cart_item_id}" data-store-id="${item.store_id}" data-buyer-id="${buyer_id}">+</button>
              </div>
            </div>
          </div>`;
      });
      return `
        <div class="cart_item_card" data-store-card-id="${item.store_id}">
            <div class="cart_store_heading">
              <h3 class="cart_store_name">${item.store_name}</h3>
              <button class="btn btn-remove-store" data-store-id="${item.store_id}" data-buyer-id="${buyer_id}">Hapus</button>
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
          <h2 id="cart-label" class="cart_title">Cart</h2>
          <div class="modal" id="confirm-modal">
              <div class="modal_wrapper">
                  <div class="modal_content">Hapus item dari keranjang?</div>
                  <div class="modal_actions">
                      <button class="btn btn-cancel" id="modal-cancel-btn">Batal</button>
                      <button class="btn btn-confirm" id="modal-confirm-btn">Hapus</button>
                  </div>
              </div>
          </div>
          ${html}
    `;

    if (html == "") {
      const emptyCart = `
          <div class="empty_cart_container">
            <img src="..\/..\/..\/img\/empty-cart.png" alt="Empty Cart" class="empty_cart_img">
            <p class="empty_cart_text">Keranjang kamu masih kosong nih!</p>
            <button class="btn-start-shopping">Mulai Belanja</button>
          </div>
      `;

      container.innerHTML = emptyCart;
      const shopBtn = document.querySelector(".btn-start-shopping");
      shopBtn.addEventListener("click", () => {
        router.navigateTo("/home");
      });
    }

    // Attach event listeners untuk hapus toko
    const removeButtons = document.querySelectorAll(".btn-remove-store");
    removeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const storeId = btn.getAttribute("data-store-id");
        const buyerId = btn.getAttribute("data-buyer-id");
        // Buka modal dengan type 'store'
        openModal(null, storeId, buyerId, 'store');
      });
    });

    // Attach quantity button listeners
    attachQuantityButtonListeners();

  } else {
    container.innerHTML = data.message || "No data available";
  }
}

let currentDeleteCartItemId = null;
let currentDeleteStoreId = null;
let currentDeleteBuyerId = null;
let deleteType = null; // 'item' atau 'store'

function openModal(cart_item_id, store_id, buyer_id, type = 'item') {
  currentDeleteCartItemId = cart_item_id;
  currentDeleteStoreId = store_id;
  currentDeleteBuyerId = buyer_id;
  deleteType = type;
  
  const modal = document.getElementById("confirm-modal");
  const modalContent = document.querySelector(".modal_content");
  
  if (modal && modalContent) {
    // Ubah text sesuai tipe delete
    if (type === 'store') {
      modalContent.textContent = "Hapus semua item dari toko ini?";
    } else {
      modalContent.textContent = "Hapus item dari keranjang?";
    }
    
    modal.style.display = "block";
    
    // Attach modal button listeners
    const modalCancelBtn = document.getElementById("modal-cancel-btn");
    const modalConfirmBtn = document.getElementById("modal-confirm-btn");
    
    if (modalCancelBtn) {
      modalCancelBtn.onclick = closeModal;
    }
    if (modalConfirmBtn) {
      modalConfirmBtn.onclick = confirmDelete;
    }
  }
}

function closeModal() {
  const modal = document.getElementById("confirm-modal");
  if (modal) {
    modal.style.display = "none";
  }
  currentDeleteCartItemId = null;
  currentDeleteStoreId = null;
  currentDeleteBuyerId = null;
  deleteType = null;
}

function confirmDelete() {
  const buyerIdToReload = currentDeleteBuyerId;
  
  console.log("confirmDelete called with:", {
    deleteType,
    currentDeleteCartItemId,
    currentDeleteStoreId,
    currentDeleteBuyerId,
    buyerIdToReload 
  });


  if (!buyerIdToReload) {
    console.error("CRITICAL: buyer_id is null or undefined!");
    alert("Error: Buyer ID tidak ditemukan");
    closeModal();
    return; 
  }

  if (deleteType === 'store' && currentDeleteStoreId && buyerIdToReload) {
    console.log("Deleting store with buyer_id:", buyerIdToReload);
    
    DELETE("/api/cart", { 
      action: "remove_store", 
      store_id: currentDeleteStoreId, 
      buyer_id: buyerIdToReload 
    }, (response) => {
      console.log("Store delete response:", response);
      
      if (response.status === "success") {
        console.log("Store removed successfully");
        console.log("Calling reloadCartPage with buyer_id:", buyerIdToReload);
        closeModal();
        
        reloadCartPage(buyerIdToReload);
        
      } else {
        closeModal();
        alert("Gagal menghapus store: " + (response.message || ""));
      }
    }, () => {}
  );
    
  } else if (deleteType === 'item' && currentDeleteCartItemId && buyerIdToReload) {
    console.log("Deleting item with buyer_id:", buyerIdToReload);
    
    DELETE("/api/cart", { 
      cart_item_id: currentDeleteCartItemId, 
      action: "remove_item"
    }, (response) => {
      console.log("Item delete response:", response);
      
      if (response.status === "success") {
        console.log("Item removed successfully");
        console.log("Calling reloadCartPage with buyer_id:", buyerIdToReload);
        closeModal();
        
        reloadCartPage(buyerIdToReload);
        
      } else {
        closeModal();
        alert("Gagal menghapus item: " + (response.message || ""));
      }
    }, () => {}
  );
    
  } else {
    console.error("Missing required data:", {
      deleteType,
      currentDeleteCartItemId,
      currentDeleteStoreId,
      currentDeleteBuyerId,
      buyerIdToReload
    });
    closeModal();
    alert("Data tidak lengkap untuk menghapus");
  }
}

function LoadSummary(data) {
  const container = document.getElementById("cart-summary");
  if (!container) return;

  if (data.status === "success" && data.data) {
    const summary = data.data;

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
    
    container.innerHTML = html;
  } else {
    container.innerHTML = data.message || "No data available";
  };
}

function Increamenterr(err) {
  if (err) {
    alert("Error updating quantity");
    console.error(err);
  }
}

function CartItemsErr(err) {
  if (err) {
    const cartItemsContainer = document.getElementById("cart-data");
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = "Cart Items Fetch Error";
    console.error(err);
  }
}

function SummaryErr(err) {
  if (err) {
    const container = document.getElementById("cart-summary");
    if (!container) return;
    container.innerHTML = "Summary Fetch Error";
    console.error(err);
  }
}

export async function InitCartPage() {
  let param = new URLSearchParams(window.location.search);
  const param_id = param.get("buyer_id");
  
  const buyer_id = param_id || null;
  if (!buyer_id) {
    router.navigateTo("/home");
    return;
  }
  
  GET("/api/cart", { buyer_id: buyer_id }, LoadCartItems, CartItemsErr);
  GET("/api/cart", { buyer_id: buyer_id, action: 'summary' }, LoadSummary, SummaryErr);
}