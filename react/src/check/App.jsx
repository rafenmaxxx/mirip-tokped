import { useEffect, useState } from "react";
import { showToast } from "../lib/toast";
export default function Check() {
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    // Fungsi untuk menangani pesan dari SW
    const handleMessage = (event) => {
      console.log("Menerima pesan dari SW:", event.data);

      if (event.data && event.data.type === "PUSH_NOTIFICATION") {
        const { title, body } = event.data.payload;

        // Update UI
        setLastMessage(`${title}: ${body}`);

        // Coba alert (mungkin diblokir browser jika tab hidden)
        alert(`Notifikasi Masuk: ${title}`);
      }
    };

    if ("serviceWorker" in navigator) {
      // Dengarkan pesan
      navigator.serviceWorker.addEventListener("message", handleMessage);
    }

    // Cleanup listener saat component unmount
    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      }
    };
  }, []);

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
    </div>
  );
}
