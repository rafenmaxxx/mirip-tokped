
export async function LoadDetailStore() {
  const container = document.getElementById("product-data");
  const storeProfileContainer = document.getElementById("store_profile");
//   await LoadComponent("slider", "/components/home/sliding_card.html");

  if (!container || !storeProfileContainer) return;

  try {
    const res_store = await fetch("/api/detail_store", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res_store.ok) {
        storeProfileContainer.innerHTML = `Error loading data: ${res_store.status} ${res_store.statusText}`;
        return;
    }
    const storeData = await res_store.json();
    // const text = await res_store.text();
    // console.log("Raw response:", text);
    // return;

    const res_product = await fetch(`/api/product?store_id=${storeData.data.store_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res_product.ok) {
      container.innerHTML = `Error loading data: ${res_product.status} ${res_product.statusText}`;
      return;
    }

    const data = await res_product.json();

    if (data.status === "success" && Array.isArray(data.data) && storeData.status === "success" && storeData.data) {
      const store = storeData.data;
      const products = data.data;

      // 🔹 String generator untuk setiap produk
      
      const imageStoreUrl = store.store_logo_path && store.store_logo_path !== ""
        ? `/api/image?file=${store.store_logo_path}`
        : `https://picsum.photos/200/200?random=${index + 1}`;

        
      const Storehtml = `
            <div class="store_card">
              <div class="store_image">
                <img src="${imageStoreUrl}" alt="${store.store_name}">
              </div>
              <div class="store_desc">
                <div class="store_name">${store.store_name}</div>
                <div class="store_description">${store.store_description}</div>
              </div>
            </div>
      `;
      

      const productHtml = products
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
      }).join("");

      // tampilkan hasil
      storeProfileContainer.innerHTML = Storehtml;
      container.innerHTML = productHtml;
    } else {
      storeProfileContainer.innerHTML = "Error loading store profile";
      container.innerHTML = data.message || "No data available";
    }
  } catch (err) {
    console.error("Fetch error:", err);
    storeProfileContainer.innerHTML = "Error connecting to server";
    container.innerHTML = "Error connecting to server";
  }
}
