import { LoadComponent } from "../util/component_loader.js";

export async function LoadHome() {
  const container = document.getElementById("product-data");
  await LoadComponent("slider", "/components/home/sliding_card.html");
  if (!container) return;

  try {
    const res = await fetch("/api/product", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      container.innerHTML = `Error loading data: ${res.status} ${res.statusText}`;
      return;
    }

    const data = await res.json();

    if (data.status === "success" && Array.isArray(data.data)) {
      const products = data.data;

      // 🔹 String generator untuk setiap produk
      const html = products
        .map((p, index) => {
          // format harga ke Rupiah
          const price = p.price.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          });

          // fallback image jika path kosong
          const imageUrl =
            p.main_image_path && p.main_image_path !== ""
              ? `/api/image?file=${p.main_image_path}`
              : `https://picsum.photos/200/200?random=${index + 1}`;

          return `
              <div class="product_card">
                <div class="product_image">
                  <img src="${imageUrl}" alt="${p.product_name}">
                </div>
                <div class="product_desc">
                  <div class="product_name">${p.product_name}</div>
                  <div class="product_price">${price}</div>
                  <div class="product_store">Toko ${p.store_id}</div>
                </div>
              </div>
            `;
        })
        .join("");

      // tampilkan hasil
      container.innerHTML = html;
    } else {
      container.innerHTML = data.message || "No data available";
    }
  } catch (err) {
    console.error("Fetch error:", err);
    container.innerHTML = "Error connecting to server";
  }
}
