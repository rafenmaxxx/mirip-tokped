import { useEffect, useState } from "react";
import { showToast } from "../lib/toast";

export default function Check() {
  const [lastMessage, setLastMessage] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Listener SW
    const handleMessage = (event) => {
      console.log("Menerima pesan dari SW:", event.data);

      if (event.data && event.data.type === "PUSH_NOTIFICATION") {
        const { title, body } = event.data.payload;
        setLastMessage(`${title}: ${body}`);
        alert(`Notifikasi Masuk: ${title}`);
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleMessage);
    }

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      }
    };
  }, []);

  // =============================
  // FETCH PRODUCTS
  // =============================
  const loadProducts = async () => {
    try {
      const res = await fetch("http://localhost:80/api/product", {
        method: "GET",
        credentials: "include",
      });

      const json = await res.json();
      console.log("PRODUCT DATA:", json);

      if (json.status === "success") {
        setProducts(json.data);
        showToast("Success", "Produk berhasil dimuat!");
      } else {
        showToast("Error", "Gagal memuat produk");
      }
    } catch (error) {
      console.error("Error fetch product:", error);
      showToast("Error", "Tidak bisa fetch produk");
    }
  };

  // Helper untuk image
  const getImageUrl = (path) => {
    return path && path !== "" ? `/api/image?file=${path}` : "/no-image.png";
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Check Page</h1>
      <p>Menunggu notifikasi...</p>

      <div style={{ marginTop: 20, border: "1px solid #ccc", padding: 10 }}>
        <strong>Status Terakhir:</strong>
        <p>{lastMessage || "Belum ada pesan masuk"}</p>
      </div>

      <button onClick={() => showToast("Hello", "Ini toast!")}>
        Test Toast
      </button>

      <button
        onClick={async () => {
          const res = await fetch("http://localhost:80/node/api/user/me", {
            method: "GET",
            credentials: "include",
          });
          const data = await res.json();
          console.log("TEST SESSION:", data);
          showToast("Test", JSON.stringify(data));
        }}
      >
        Test Session
      </button>

      <hr />

      <h2>Product List</h2>

      <button onClick={loadProducts}>Load Products</button>

      <div style={{ marginTop: 20 }}>
        {products.length === 0 && <p>Belum ada data produk.</p>}

        {products.map((p) => {
          const imageUrl = getImageUrl(p.main_image_path);

          return (
            <div
              key={p.product_id}
              style={{
                marginBottom: 15,
                padding: 10,
                border: "1px solid #ddd",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <img
                src={imageUrl}
                alt={p.product_name}
                style={{ width: 80, height: 80, objectFit: "cover" }}
              />

              <div>
                <strong>{p.product_name}</strong>
                <p>{p.description}</p>
                <p>Rp {p.price.toLocaleString()}</p>
                <p>Stock: {p.stock}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
