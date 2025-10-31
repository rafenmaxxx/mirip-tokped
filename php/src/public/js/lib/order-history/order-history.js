import { GET } from "../../api/api.js";
import { POST } from "../../api/api.js";
import { router } from "../../../app.js";

// --- Render Modal Detail Order ---
function renderOrderDetailModal(order) {
  const modal = document.getElementById("order-detail-modal");
  if (!modal) return;

  let itemsHtml = "";
  if (Array.isArray(order.items)) {
    order.items.forEach(item => {
      const imageUrl =
          item.main_image_path && item.main_image_path !== ""
            ? `/api/image?file=${item.main_image_path}`
            : `https://picsum.photos/200/200?random=${dindex + 1}`;
      
      itemsHtml += `
        <div class="detail-item">
          <img src="${imageUrl}" 
               alt="${item.product_name}" 
               class="detail-item-image">
          <div class="detail-item-info">
            <h4>${item.product_name}</h4>
            <p class="item-quantity">Quantity: ${item.quantity}x</p>
            <p class="item-price">Rp ${parseInt(item.price_at_order).toLocaleString('id-ID')}</p>
            <p class="item-subtotal">Subtotal: Rp ${parseInt(item.subtotal).toLocaleString('id-ID')}</p>
          </div>
        </div>
      `;
    });
  }

  // Status badge color
  let statusClass = "status-pending";
  if (order.status === "confirmed") statusClass = "status-confirmed";
  else if (order.status === "delivered") statusClass = "status-delivered";
  else if (order.status === "received") statusClass = "status-received";
  else if (order.status === "rejected") statusClass = "status-rejected";

  // Reject reason (jika ada)
  const rejectReasonHtml = order.reject_reason ? `
    <div class="reject-reason">
      <h4>Alasan Penolakan:</h4>
      <p>${order.reject_reason}</p>
    </div>
  ` : '';

  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content modal-detail">
        <span class="close-button" id="close-detail-modal">&times;</span>
        
        <h2>Order Details</h2>
        
        <div class="order-info-section">
          <div class="info-row">
            <span class="info-label">Order ID:</span>
            <span class="info-value">${order.order_id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Store:</span>
            <span class="info-value">${order.store_name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value">
              <span class="status-badge ${statusClass}">${order.status}</span>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Order Date:</span>
            <span class="info-value">${new Date(order.created_at).toLocaleString('id-ID')}</span>
          </div>
          ${order.delivery_time ? `
          <div class="info-row">
            <span class="info-label">Delivery Time:</span>
            <span class="info-value">${new Date(order.delivery_time).toLocaleString('id-ID')}</span>
          </div>
          ` : ''}
        </div>

        <div class="shipping-section">
          <h3>Shipping Address</h3>
          <p>${order.shipping_address || 'No address provided'}</p>
        </div>

        ${rejectReasonHtml}

        <div class="products-section">
          <h3>Products</h3>
          <div class="detail-items-container">
            ${itemsHtml}
          </div>
        </div>

        <div class="total-section">
          <h3>Total Price: <span class="total-price">Rp ${parseInt(order.total_price).toLocaleString('id-ID')}</span></h3>
        </div>
      </div>
    </div>
  `;

  modal.style.display = "block";
  document.body.classList.add("modal-open");

  // Close modal handler
  const closeModal = () => {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
  };

  document.getElementById("close-detail-modal").addEventListener("click", closeModal);

  // Close when clicking overlay
  modal.querySelector(".modal-overlay").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      closeModal();
    }
  });

  // Close with Escape key
  const escapeHandler = (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);
}

// --- Load Order History Data ---
function LoadOrderHistoryData(data) {
  const container = document.getElementById("order_history-data");
  if (!container) return;

  console.log("Order History Data:", data);

  if (data.status === "success" && Array.isArray(data.data)) {
    const orders = data.data;
    
    if (orders.length === 0) {
      container.innerHTML = "<p class='no-orders'>Belum ada riwayat pesanan.</p>";
      return;
    }

    container.innerHTML = ""; // bersihkan isi lama

    orders.forEach(order => {
      let itemsHtml = "";

      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          itemsHtml += `
            <div class="order_item">
              <p>${item.product_name}</p>
              <p class="item-qty">(${item.quantity}x)</p>
            </div>
          `;
        });
      }

      // Status badge color
      let statusClass = "status-pending";
      if (order.status === "confirmed") statusClass = "status-confirmed";
      else if (order.status === "delivered") statusClass = "status-delivered";
      else if (order.status === "received") statusClass = "status-received";
      else if (order.status === "rejected") statusClass = "status-rejected";

      const orderElement = document.createElement("div");
      orderElement.classList.add("order");
      orderElement.innerHTML = `
        <div class="order_header">
          <div class="order_main_info">
            <h3>#${order.order_id}</h3>
            <span class="status-badge ${statusClass}">${order.status}</span>
          </div>
          <div class="order_meta">
            <p class="store-name">${order.store_name}</p>
            <p class="order-date">${new Date(order.created_at).toLocaleDateString('id-ID')}</p>
          </div>
        </div>
        <div class="order_items">
          ${itemsHtml}
        </div>
        <div class="order_footer">
          <p class="total-price">Total: <strong>Rp ${parseInt(order.total_price).toLocaleString('id-ID')}</strong></p>
          <button class="view_details_btn" 
                  data-order-id="${order.order_id}">
            View Details
          </button>
        </div>
      `;

      // Event listener untuk tombol view details
      const viewBtn = orderElement.querySelector(".view_details_btn");
      viewBtn.addEventListener("click", () => {
        renderOrderDetailModal(order);
      });

      container.appendChild(orderElement);
    });
  }
}

// --- Error Handler ---
function OrderHistoryErr(err) {
  const container = document.getElementById("order_history-data");
  if (!container) return;

  // console.error("Error loading order history:", err);
  container.innerHTML = "<p class='error-message'>Error loading order history. Please try again later.</p>";
}

// --- Init Page ---
export async function InitOrderHistoryPage() {
  // Pastikan modal element ada di body
  let modal = document.getElementById("order-detail-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "order-detail-modal";
    modal.className = "modal";
    modal.style.display = "none";
    document.body.appendChild(modal);
  }

  GET("/api/order", {}, LoadOrderHistoryData, OrderHistoryErr);
}