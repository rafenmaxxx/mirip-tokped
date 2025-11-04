import { GET } from "../../api/api.js";
import { PUT } from "../../api/api.js";
import { router } from "../../../app.js";
import { renderToast } from "../general/toast.js";

let allOrders = [];
let currentFilter = "all"; // Current active filter

function renderFilterDropdown() {
  const filterContainer = document.getElementById("order_filter");
  if (!filterContainer) return;

  const statuses = [
    { value: "all", label: "All" },
    { value: "waiting_approval", label: "Waiting Approval" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "on_delivery", label: "On Delivery" },
    { value: "received", label: "Received" },
  ];

  filterContainer.innerHTML = `
    <div class="filter-dropdown-container">
      <label for="order-status-filter" class="filter-label">
        Filter by Status:
      </label>
      <div class="custom-select">
        <select id="order-status-filter" class="filter-select">
          ${statuses
            .map(
              (status) => `
            <option value="${status.value}" ${
                status.value === currentFilter ? "selected" : ""
              }>
               ${status.label}
            </option>
          `
            )
            .join("")}
        </select>
        <div class="select-arrow">▼</div>
      </div>
      <div class="order-count" id="order-count">
        Loading...
      </div>
    </div>
  `;

  const selectElement = document.getElementById("order-status-filter");
  selectElement.addEventListener("change", (e) => {
    const status = e.target.value;
    currentFilter = status;
    renderFilteredOrders(status);
  });
}

function renderFilteredOrders(status) {
  const container = document.getElementById("order_history-data");
  const countElement = document.getElementById("order-count");
  if (!container) return;

  const filteredOrders =
    status === "all"
      ? allOrders
      : allOrders.filter((order) => order.status === status);

  // Update count
  if (countElement) {
    const statusLabel = status === "all" ? "orders" : `orders`;
    countElement.textContent = `${filteredOrders.length} ${statusLabel} found`;
  }

  if (filteredOrders.length === 0) {
    const statusText =
      status === "all" ? "pesanan" : `pesanan dengan status "${status}"`;
    container.innerHTML = `
      <div class="no-orders">
        <p>Tidak ada ${statusText}.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = "";
  filteredOrders.forEach((order) => {
    renderOrderCard(order, container);
  });
}

function renderOrderCard(order, container) {
  let itemsHtml = "";

  if (Array.isArray(order.items)) {
    order.items.forEach((item) => {
      const imageUrl =
        item.main_image_path && item.main_image_path !== ""
          ? `/api/image?file=${item.main_image_path}`
          : `https://picsum.photos/200/200?random=${item.product_id}`;
      itemsHtml += `
        <div class="order_item">
          <img src="${imageUrl}" 
               alt="${item.product_name}" 
               class="detail-item-image">
          <div class="order_item_detail">
            <p>${item.product_name}</p>
            <p class="item-qty">(${item.quantity}x)</p>
          </div>
        </div>
      `;
    });
  }

  // Status badge color
  let statusClass = "status-waiting-approval";
  if (order.status === "approved") statusClass = "status-approved";
  else if (order.status === "on_delivery") statusClass = "status-on-delivery";
  else if (order.status === "received") statusClass = "status-received";
  else if (order.status === "rejected") statusClass = "status-rejected";

  // Reject info HTML (if rejected)
  const rejectInfoHtml =
    order.status === "rejected"
      ? `
    <div class="order_reject_info">
      <div class="refund-amount">
        <span class="refund-label">Refunded:</span>
        <span class="refund-value">Rp ${parseInt(
          order.total_price
        ).toLocaleString("id-ID")}</span>
      </div>
      
      <div class="reject-reason-preview">
        <span class="reason-label">Seller's note:</span>
        <span class="reason-text">${
          order.reject_reason ? order.reject_reason : "-"
        }</span>
      </div>
      
    </div>
  `
      : "";

  // On delivery action button
  const deliveryActionHtml =
    order.status === "on_delivery"
      ? `
    <button class="confirm_received_btn" 
            data-order-id="${order.order_id}">
      Konfirmasi Diterima
    </button>
  `
      : "";

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
        <p class="order-date">${new Date(order.created_at).toLocaleDateString(
          "id-ID"
        )}</p>
      </div>
    </div>
    <div class="order_items">
      ${itemsHtml}
    </div>
    ${rejectInfoHtml}
    <div class="order_footer">
      <p class="total-price">Total: <strong>Rp ${parseInt(
        order.total_price
      ).toLocaleString("id-ID")}</strong></p>
      <div class="order_actions">
        ${deliveryActionHtml}
        <button class="view_details_btn" 
                data-order-id="${order.order_id}">
          View Details
        </button>
        
      </div>
    </div>
  `;

  const storeNameElem = orderElement.querySelector(".store-name");
  storeNameElem.addEventListener("click", () => {
    router.navigateTo("/store?store_id=" + order.store_id);
  });

  const viewBtn = orderElement.querySelector(".view_details_btn");
  viewBtn.addEventListener("click", () => {
    renderOrderDetailModal(order);
  });

  // Add event listener for confirm received button
  const confirmBtn = orderElement.querySelector(".confirm_received_btn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      handleConfirmReceived(order.order_id);
    });
  }

  container.appendChild(orderElement);
}

function renderOrderDetailModal(order) {
  const modal = document.getElementById("order-detail-modal");
  if (!modal) return;

  let itemsHtml = "";
  if (Array.isArray(order.items)) {
    order.items.forEach((item, index) => {
      const imageUrl =
        item.main_image_path && item.main_image_path !== ""
          ? `/api/image?file=${item.main_image_path}`
          : `https://picsum.photos/200/200?random=${index + 1}`;

      itemsHtml += `
        <div class="detail-item">
          <img src="${imageUrl}" 
               alt="${item.product_name}" 
               class="detail-item-image">
          <div class="detail-item-info">
            <h4>${item.product_name}</h4>
            <p class="item-quantity">Quantity: ${item.quantity}x</p>
            <p class="item-price">Rp ${parseInt(
              item.price_at_order
            ).toLocaleString("id-ID")}</p>
            <p class="item-subtotal">Subtotal: Rp ${parseInt(
              item.subtotal
            ).toLocaleString("id-ID")}</p>
          </div>
        </div>
      `;
    });
  }

  // Status badge color
  let statusClass = "status-waiting-approval";
  if (order.status === "approved") statusClass = "status-approved";
  else if (order.status === "on_delivery") statusClass = "status-on-delivery";
  else if (order.status === "received") statusClass = "status-received";
  else if (order.status === "rejected") statusClass = "status-rejected";

  // Reject reason (jika ada)
  const rejectReasonHtml = order.reject_reason
    ? `
    <div class="reject-reason">
      <h4>Alasan Penolakan:</h4>
      <p>${order.reject_reason}</p>
    </div>
  `
    : "";

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
            <span class="info-value">${new Date(
              order.created_at
            ).toLocaleString("id-ID")}</span>
          </div>
          ${
            order.delivery_time
              ? `
          <div class="info-row">
            <span class="info-label">Delivery Time:</span>
            <span class="info-value">${new Date(
              order.delivery_time
            ).toLocaleString("id-ID")}</span>
          </div>
          `
              : ""
          }
        </div>

        <div class="shipping-section">
          <h3>Shipping Address</h3>
          <p>${order.shipping_address || "No address provided"}</p>
        </div>

        ${rejectReasonHtml}

        <div class="products-section">
          <h3>Products</h3>
          <div class="detail-items-container">
            ${itemsHtml}
          </div>
        </div>

        <div class="total-section">
          <h3>Total Price: <span class="total-price">Rp ${parseInt(
            order.total_price
          ).toLocaleString("id-ID")}</span></h3>
        </div>
      </div>
    </div>
  `;

  modal.style.display = "block";
  document.body.classList.add("modal-open");

  const closeModal = () => {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
  };

  document
    .getElementById("close-detail-modal")
    .addEventListener("click", closeModal);

  modal.querySelector(".modal-overlay").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      closeModal();
    }
  });

  const escapeHandler = (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);
}

function LoadOrderHistoryData(data) {
  const container = document.getElementById("order_history-data");
  if (!container) return;

  if (data.status === "success" && Array.isArray(data.data)) {
    allOrders = data.data; // Store all orders

    if (allOrders.length === 0) {
      container.innerHTML =
        "<p class='no-orders'>Belum ada riwayat pesanan.</p>";
      return;
    }

    // Render filter dropdown
    renderFilterDropdown();

    // Render all orders initially
    renderFilteredOrders(currentFilter);
  }
}

function handleConfirmReceived(orderId) {
  PUT(
    `/api/order`,
    { action: "update_status", order_id: orderId, status: "received" },
    (response) => {
      if (response.status === "success") {
        renderToast("Order confirmed as received", "success");

        const orderIndex = allOrders.findIndex(
          (order) => order.order_id === orderId
        );
        if (orderIndex !== -1) {
          allOrders[orderIndex].status = "received";
          renderFilteredOrders(currentFilter);
        }
      } else {
        console.error(
          `Failed to confirm order ID ${orderId}: ${response.message}`
        );
      }
    },
    (err) => {
      renderToast("Please wait until delivery time has passed.", "error");
    }
  );
}

// --- Error Handler ---
function OrderHistoryErr(err) {
  const container = document.getElementById("order_history-data");
  if (!container) return;

  container.innerHTML =
    "<p class='error-message'>Error loading order history. Please try again later.</p>";
}

// --- Init Page ---
export async function InitOrderHistoryPage() {
  // Reset filter
  currentFilter = "all";
  allOrders = [];

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
