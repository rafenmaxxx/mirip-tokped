import { GET, POST, PUT } from "../../../api/api.js";
import { ChangeInnerHtmlById } from "../../../util/component_loader.js";
import {
  showModalConfirmation,
  showModalNumberInput,
  showModalTextInput,
} from "../../general/modal.js";
import { renderToast } from "../../general/toast.js";

let currentPage = 1;
let itemsPerPage = 4;
let currentStatus = "";
let currentSearch = "";
let debounceTimer;

// --- Utility: Format angka ke rupiah ---
function formatRupiah(number) {
  return "Rp. " + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// --- Template pembuat order card ---
function createOrderCard(order) {
  const itemsHtml = order.items
    .map(
      (item) => `
        <div class="order-product-item">
          <div class="product-image-placeholder">
            <img src="/api/image?file=${item.main_image_path}" alt="${item.product_name}" />
          </div>
          <div class="product-info">
            <p class="product-name">${item.product_name}</p>
            <p class="product-quantity">${item.quantity} pcs</p>
          </div>
        </div>
      `
    )
    .join("");

  // --- Tombol aksi sesuai status ---
  let actionButtons = "";
  switch (order.status) {
    case "waiting_approval":
      actionButtons = `
        <button class="btn-reject" data-id="${order.order_id}">Reject</button>
        <button class="btn-approve" data-id="${order.order_id}">Approve</button>
      `;
      break;
    case "approved":
      actionButtons = `
        <button class="btn-deliver" data-id="${order.order_id}">Deliver</button>
      `;
      break;
    default:
      actionButtons = "";
  }

  // --- Warna status ---
  const statusColorClass =
    {
      waiting_approval: "status-pending",
      approved: "status-approved",
      rejected: "status-rejected",
      on_delivery: "status-delivery",
      received: "status-received",
    }[order.status] || "status-default";

  // --- Template Card ---
  return `
    <article class="order-card">
      <header class="order-header">
        <h3 class="order-title">#${order.order_id} - ${
    order.buyer_name || "Nama Buyer"
  }</h3>
        <span class="order-date"> ${order.created_at.split('.')[0]}</span>
        <span class="order-status ${statusColorClass}">
          ${order.status.replace("_", " ")}
        </span>
      </header>

      <div class="order-products-box">
        ${itemsHtml}
      </div>

      <footer class="order-footer">
        <div class="footer-left">
          <button class="btn-detail" data-id="${order.order_id}">Detail</button>
        </div>
        <div class="footer-right">
          <p class="order-total">Total: ${formatRupiah(order.total_price)}</p>
          <div class="footer-actions">${actionButtons}</div>
        </div>
      </footer>
    </article>
  `;
}

function fetchOrders() {
  const params = {};

  if (currentStatus) {
    params.status = currentStatus;
  }

  if (currentSearch) {
    params.title = currentSearch;
  }

  if (currentPage) {
    params.page = currentPage;
    params.limit = itemsPerPage;
  }

  console.log("Fetching products with params:", params);

  GET("/api/order", params, LoadOrder, SellerOrderErr);
}

function SellerOrderErr(err) {
  if (!err) {
    return;
  }

  const container = document.getElementById("og1");
  if (!container) return;

  console.log("Error fetching order history:", err);
  container.innerHTML =
    "<p class='error-message'>Error loading order history. Please try again later.</p>";
}

function renderPaginationButtons(totalPages) {
  const navContainer = document.getElementById("pagination-nav-buttons");
  if (!navContainer) return;

  navContainer.innerHTML = "";

  const createPageButton = (page) => {
    const pageButton = document.createElement("a");
    pageButton.href = "#";
    pageButton.textContent = page;
    pageButton.dataset.page = page;

    if (page === currentPage) {
      pageButton.classList.add("active");
    }

    pageButton.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = page;
      fetchOrders();
    });

    return pageButton;
  };

  const createEllipsis = () => {
    const ellipsis = document.createElement("span");
    ellipsis.textContent = "...";
    return ellipsis;
  };

  const pagesToShow = new Set();
  const siblingCount = 1;

  pagesToShow.add(1);
  const startPage = Math.max(2, currentPage - siblingCount);
  const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

  for (let i = startPage; i <= endPage; i++) {
    pagesToShow.add(i);
  }

  pagesToShow.add(totalPages);

  let lastPage = 0;
  pagesToShow.forEach((page) => {
    if (lastPage !== 0 && page - lastPage > 1) {
      navContainer.appendChild(createEllipsis());
    }

    navContainer.appendChild(createPageButton(page));
    lastPage = page;
  });
  const footer = document.querySelector(".pagination-footer");
  footer?.classList.add("visible");
}

// --- Loader utama ---
function LoadOrder(data) {
  const grid = document.querySelector(".order-grid");
  const footer = document.getElementById("pagination-container");
  if (!grid) return;

  console.log("Order Data:", data);

  if (data.status !== "success") {
    grid.innerHTML = `<p>Gagal memuat data order.</p>`;
    return;
  }

  const orders = data.data || [];
  const totalOrders = data.count || 0;
  if (totalOrders === 0) {
    grid.innerHTML = `
          <div class="no-products-container">
            <div class="no-products-image-circle">
              <img src="/img/unauthorized.png" alt="Tidak ada produk">
            </div>
            <p class="no-products-message">Tidak terdapat order untuk status ini</p>
          </div>
    `;
    footer.style.display = "none";
    return;
  }

  footer.style.display = "flex";
  grid.innerHTML = orders.map(createOrderCard).join("");

  const totalPages = Math.ceil(totalOrders / itemsPerPage);
  renderPaginationButtons(totalPages);

  const paginationInfo = document.querySelector(".pagination-info");
  if (paginationInfo) {
    paginationInfo.textContent = `Menampilkan ${data.data.length} dari ${totalOrders} order`;
  }
  // Event listener
  document.querySelectorAll(".btn-approve").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      showModalConfirmation(
        "Approve order ?",
        () => {
          console.log("Approve order:", e.target.dataset.id);
          PUT(
            "/api/order",
            {
              action: "update_status",
              status: "approved",
              order_id: e.target.dataset.id,
            },
            (data) => {
              if (data.status == "success") {
                renderToast("Berhasil update status", "success");
                LoadOrder(data);
              } else {
                renderToast("Gagal update status", "error");
              }
            },
            (err) => {
              if (err) {
                renderToast("ERR Gagal update status", "error");
              }
            }
          );
        },
        () => {}
      );
    })
  );

  document.querySelectorAll(".btn-reject").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      showModalTextInput(
        "Reject order ? berikan alasan !",
        (reason) => {
          console.log("Reject order:", e.target.dataset.id);
          PUT(
            "/api/order",
            {
              action: "update_status",
              status: "rejected",
              order_id: e.target.dataset.id,
              msg: reason,
            },
            (data) => {
              if (data.status == "success") {
                renderToast("Berhasil update status", "success");
                LoadOrder(data);
              } else {
                renderToast("Gagal update status", "error");
              }
            },
            (err) => {
              if (err) {
                renderToast("Gagal update status", "error");
              }
            }
          );
        },
        () => {}
      );
    })
  );

  document.querySelectorAll(".btn-deliver").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      console.log("Deliver order:", e.target.dataset.id);
      showModalNumberInput(
        "Deliver barang ? masukkan estimasi durasi",
        (durasi) => {
          PUT(
            "/api/order",
            {
              action: "update_status",
              status: "on_delivery",
              order_id: e.target.dataset.id,
              durasi: durasi,
            },
            (data) => {
              if (data.status == "success") {
                renderToast("Berhasil update status", "success");
                LoadOrder(data);
              } else {
                renderToast("Gagal update status", "error");
              }
            },
            (err) => {
              if (err) {
                renderToast("Gagal update status", "error");
              }
            }
          );
        },
        () => {}
      );
    })
  );

  document.querySelectorAll(".btn-detail").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      console.log("Lihat detail order:", e.target.dataset.id);
      renderOrderDetailModal(
        orders.find((o) => o.order_id == e.target.dataset.id)
      );
    })
  );
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
  let statusClass = "status-pending";
  if (order.status === "approved") statusClass = "status-approved";
  else if (order.status === "on_delivery") statusClass = "status-delivery";
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
             order.confirmed_at && order.status === "rejected"
               ? `
          <div class="info-row">
            <span class="info-label">Rejected Time:</span>
            <span class="info-value">${new Date(
              order.confirmed_at
            ).toLocaleString("id-ID")}</span>
          </div>
          `
               : `
          <div class="info-row">
            <span class="info-label">Approved Time:</span>
            <span class="info-value">${new Date(
              order.confirmed_at
            ).toLocaleString("id-ID")}</span>
          </div>
          `
           }
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
           ${
             order.received_at
               ? `
          <div class="info-row">
            <span class="info-label">Received Time:</span>
            <span class="info-value">${new Date(
              order.received_at
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

export function InitOrderSeller() {
  currentPage = 1;
  itemsPerPage = 4;
  currentStatus = "";
  currentSearch = "";

  fetchOrders();

  let modal = document.getElementById("order-detail-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "order-detail-modal";
    modal.className = "modal";
    modal.style.display = "none";
    document.body.appendChild(modal);
  }

  const itemsPerPageSelect = document.getElementById("items-per-page-select");
  if (itemsPerPageSelect) {
    itemsPerPageSelect.addEventListener("change", (e) => {
      itemsPerPage = parseInt(e.target.value, 10);
      console.log("Items per page changed to:", itemsPerPage);
      currentPage = 1;
      fetchOrders();
    });
  }

  const statusSelect = document.getElementById("status-filter");
  if (statusSelect) {
    statusSelect.addEventListener("change", (e) => {
      currentStatus = e.target.value;
      console.log("Status filter changed to:", currentStatus);
      currentPage = 1;
      fetchOrders();
    });
  }

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        console.log("Debounce selesai, mencari:", e.target.value);

        currentSearch = e.target.value;
        currentPage = 1;
        fetchOrders();
      }, 400);
    });
  }
}
