import { GET } from "../../api/api.js";
import { POST } from "../../api/api.js";
import { router } from "../../../app.js";

function LoadOrderHistoryData(data) {
  const container = document.getElementById("order_history-data");
  if (!container) return;

  console.log("Order History Data:", data);

  if (data.status === "success" && Array.isArray(data.data)) {
    const orders = data.data;
    container.innerHTML = ""; // bersihkan isi lama

    orders.forEach(order => {
      let itemsHtml = ""; // ✅ deklarasi di sini agar bisa dipakai di bawah

      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          itemsHtml += `
            <div class="order_item">
              <p>${item.product_name}</p>
              <p>(${item.quantity}x)</p>
            </div>
          `;
        });
      }

      const orderElement = document.createElement("div"); // ✅ buat elemen
      orderElement.classList.add("order");
      orderElement.innerHTML = `
        <div class="order_header">
          <h3>Order ID: ${order.order_id}</h3>
          <h3>Date: ${order.created_at}</h3>
          <h3>Status: ${order.status}</h3>
          <h4>${order.store_name}</h4>
        </div>
        <div class="order_items">
          ${itemsHtml}
        </div>
        <p>Total Price: ${order.total_price}</p>
        <button class="view_details_btn" 
                data-order-id="${order.order_id}" 
                data-store-id="${order.store_id}">
          View Details
        </button>
      `;

      container.appendChild(orderElement); // ✅ tambahkan elemen ke container
    });
  }
}


function OrderHistoryErr(err) {
  const container = document.getElementById("order_history-data");
  if (!container) return;

//   console.error("Error loading order history:", err);
  container.innerHTML = "<p>Error loading order history. Please try again later.</p>";
}

export async function InitOrderHistoryPage() {
    
  GET("/api/order", {}, LoadOrderHistoryData, OrderHistoryErr);
//   GET("/api/user", { id: buyer_id}, LoadBalance, BalanceErr);
//   GET("/api/user", { id: buyer_id}, LoadAddressForm, AddressErr);
}