import { GET } from "../../../api/api.js";
import { ChangeInnerHtmlById } from "../../../util/component_loader.js";

// Format angka jadi Rupiah
function formatRupiah(number) {
  return "Rp. " + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Buat card untuk 1 order
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
            <p class="product-quantity">${item.quantity} piece(s)</p>
          </div>
        </div>
      `
    )
    .join("");

  return `
    <article class="order-card">
      <h3 class="order-title">#${order.order_id} - ${
    order.buyer_name || "Nama Buyer"
  }</h3>
      
      <div class="order-products-box">
        ${itemsHtml}
      </div>

      <footer class="order-footer">
        <div class="footer-left">
          <p class="order-status">Status: ${order.status}</p>
          <button class="btn-detail" data-id="${
            order.order_id
          }">lihat detail</button>
        </div>
        <div class="footer-right">
          <p class="order-total">Total Harga: ${formatRupiah(
            order.total_price
          )}</p>
          <div class="footer-actions">
            ${
              order.status === "waiting_approval"
                ? `
              <button class="btn-reject" data-id="${order.order_id}">reject</button>
              <button class="btn-approve" data-id="${order.order_id}">approve</button>
              `
                : ""
            }
          </div>
        </div>
      </footer>
    </article>
  `;
}

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

      // Tambahkan listener untuk tombol
      document.querySelectorAll(".btn-approve").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const id = e.target.dataset.id;
          console.log("Approve order:", id);
          // TODO: panggil API approve
        });
      });

      document.querySelectorAll(".btn-reject").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const id = e.target.dataset.id;
          console.log("Reject order:", id);
          // TODO: panggil API reject
        });
      });

      document.querySelectorAll(".btn-detail").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const id = e.target.dataset.id;
          console.log("Lihat detail order:", id);
          // TODO: buka modal detail atau redirect ke halaman detail
        });
      });
    },
    () => {
      const grid = document.querySelector(".order-grid");
      grid.innerHTML = `<p>Gagal menghubungi server.</p>`;
    }
  );
}

export function InitOrderSeller() {
  LoadOrder();
}
