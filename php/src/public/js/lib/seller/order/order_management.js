import { GET, POST, PUT } from "../../../api/api.js";
import { ChangeInnerHtmlById } from "../../../util/component_loader.js";
import {
  showModalConfirmation,
  showModalNumberInput,
} from "../../general/modal.js";
import { renderToast } from "../../general/toast.js";

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

// --- Loader utama ---
function LoadOrder() {
  const grid = document.querySelector(".order-grid");
  if (!grid) return;

  GET(
    "/api/order",
    {},
    (res) => {
      if (res.status !== "success") {
        grid.innerHTML = `<p>Gagal memuat data order.</p>`;
        return;
      }

      const orders = res.data || [];
      if (orders.length === 0) {
        grid.innerHTML = `<p>Tidak ada order untuk ditampilkan.</p>`;
        return;
      }

      grid.innerHTML = orders.map(createOrderCard).join("");

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
    },
    () => {
      grid.innerHTML = `<p>Gagal menghubungi server.</p>`;
    }
  );
}

export function InitOrderSeller() {
  LoadOrder();
}
