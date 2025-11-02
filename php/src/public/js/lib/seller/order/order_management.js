import { GET, POST, PUT } from "../../../api/api.js";
import { ChangeInnerHtmlById } from "../../../util/component_loader.js";
import {
  showModalConfirmation,
  showModalNumberInput,
} from "../../general/modal.js";
import { renderToast } from "../../general/toast.js";

let currentPage = 1;
let itemsPerPage = 2;
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

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("a");
    pageButton.href = "#";
    pageButton.textContent = i;
    pageButton.dataset.page = i;

    if (i === currentPage) {
      pageButton.classList.add("active");
    }

    pageButton.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = i;
      fetchOrders();
    });

    navContainer.appendChild(pageButton);
  }
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

  const orders = data.data.orders || [];
  const totalOrders = data.data.count || 0;
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
    paginationInfo.textContent = `Menampilkan ${data.data.orders.length} dari ${totalOrders} order`;
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
                LoadOrder();
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

  document.querySelectorAll(".btn-reject").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      showModalConfirmation(
        "Reject order ?",
        () => {
          console.log("Reject order:", e.target.dataset.id);
          PUT(
            "/api/order",
            {
              action: "update_status",
              status: "rejected",
              order_id: e.target.dataset.id,
            },
            (data) => {
              if (data.status == "success") {
                renderToast("Berhasil update status", "success");
                LoadOrder();
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
                LoadOrder();
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

  document
    .querySelectorAll(".btn-detail")
    .forEach((btn) =>
      btn.addEventListener("click", (e) =>
        console.log("Lihat detail order:", e.target.dataset.id)
      )
  );
}

export function InitOrderSeller() {
  currentPage = 1;
  itemsPerPage = 2;
  currentStatus = "";
  currentSearch = "";

  fetchOrders();

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
