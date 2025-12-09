import { Routes, Route } from "react-router-dom";
import Chat from "./chat/App.jsx";
import Admin from "./admin/App.jsx";
import Auction from "./auction/App.jsx";
import Check from "./check/App.jsx";
import AdminLogin from "./admin-login/App.jsx";
import { useEffect } from "react";
import { showToast } from "./lib/toast.js";
import ProtectedRoutes from "./_components/ProtectedRoute.jsx";
import ProtectedAdminRoute from "./_components/ProtectedAdminRoute.jsx";

export default function App() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      console.error("Service Worker not supported");
      return;
    }

    const initPush = async () => {
      try {
        // Minta izin notifikasi
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert(
            "Notifications are not allowed. Please enable notifications in your browser settings."
          );
          return;
        }

        // Register Service Worker
        await navigator.serviceWorker.register("/react/sw.js", {
          scope: "/react/",
        });
        console.log("SW registered, waiting for activation...");

        // Tunggu sampai SW aktif
        const swRegistration = await navigator.serviceWorker.ready;
        console.log("Service Worker active:", swRegistration);

        // CEK apakah sudah ada subscription
        let subscription = await swRegistration.pushManager.getSubscription();

        if (!subscription) {
          console.log("No existing subscription, creating a new one...");
          const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
          subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicKey,
          });

          console.log("New subscription created:", subscription);
        } else {
          console.log("Using existing subscription:", subscription);
        }

        // Kirim subscription ke server
        const res = await fetch(
          "http://localhost:80/node/api/notif/subscribe",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(subscription),
          }
        );

        console.log("Subscription response:", await res.json());
      } catch (err) {
        console.error("Push setup failed:", err);
        alert("Push setup failed: " + err.message);
      }
    };

    initPush();
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      console.log("Menerima pesan dari SW:", event.data);

      if (event.data && event.data.type === "PUSH_NOTIFICATION") {
        const { title, body } = event.data.payload;

        // Panggil toast custom
        showToast(title, body);
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

  return (
    <Routes>
      <Route element={<ProtectedRoutes redirectUrl="/login"></ProtectedRoutes>}>
        {" "}
        <Route path="/chat" element={<Chat />} />
      </Route>
      <Route
        element={
          <ProtectedAdminRoute redirectUrl="/react/admin-login"></ProtectedAdminRoute>
        }
      >
        {" "}
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="/auction" element={<Auction />} />
      <Route path="/check" element={<Check />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Optional: default home */}
      <Route path="/" element={<h1>Welcome</h1>} />
    </Routes>
  );
}
