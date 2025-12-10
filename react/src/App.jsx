import { Routes, Route } from "react-router-dom";
import Chat from "./chat/App.jsx";
import Admin from "./admin/App.jsx";
import Auction from "./auction/App.jsx";
import AuctionDetail from "./auction_detail/App.jsx";
import Check from "./check/App.jsx";
import AdminLogin from "./admin-login/App.jsx";
import FeatureDisabled from "./_components/FeatureDisabled.jsx";
import { useEffect, useState } from "react";
import { showToast } from "./lib/toast.js";
import ProtectedRoutes from "./_components/ProtectedRoute.jsx";
import ProtectedAdminRoute from "./_components/ProtectedAdminRoute.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data (sama seperti ProtectedRoutes)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/node/api/user/me", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);

          // Simpan userId di localStorage untuk akses mudah
          if (data.user_id) {
            localStorage.setItem("userId", data.user_id.toString());
            localStorage.setItem("userRole", data.role);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.log("Error fetching user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Initialize Push Notifications setelah user data tersedia
  useEffect(() => {
    if (!user || !user.user_id) return;

    if (!("serviceWorker" in navigator)) {
      console.error("Service Worker not supported");
      return;
    }

    const initPush = async () => {
      try {
        // Minta izin notifikasi
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("Notifications not allowed");
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
          
          if (!publicKey) {
            console.warn("VAPID public key not configured. Push notifications will not work.");
            return;
          }
          
          subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicKey,
          });

          console.log("New subscription created:", subscription);
        } else {
          console.log("Using existing subscription:", subscription);
        }

        // Kirim subscription ke server DENGAN userId dari user data
        const res = await fetch("/node/api/notif/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Kirim session cookie
          body: JSON.stringify({
            ...subscription,
            userId: user.user_id, // Pakai user_id dari response API
          }),
        });

        const result = await res.json();
        console.log("Subscription response:", result);

        // Beritahu SW bahwa user online
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "USER_ONLINE",
            payload: { userId: user.user_id },
          });
        }

        // Check queued notifications setelah subscribe
        setTimeout(() => {
          checkQueuedNotifications(user.user_id);
        }, 2000);
      } catch (err) {
        console.error("Push setup failed:", err);
      }
    };

    initPush();
  }, [user]); // Jalankan ketika user data tersedia

  // Fungsi untuk check queued notifications
  const checkQueuedNotifications = async (userId) => {
    try {
      const response = await fetch(
        `/node/api/notif/queue/check?userId=${userId}`,
        {
          method: "GET",
          credentials: "include", // Kirim session cookie
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Queue check result:", result);
      }
    } catch (err) {
      console.error("Error checking queue:", err);
    }
  };

  // Event listener untuk messages dari Service Worker
  useEffect(() => {
    const handleMessage = (event) => {
      console.log("Menerima pesan dari SW:", event.data);

      if (event.data && event.data.type === "PUSH_NOTIFICATION") {
        const { title, body } = event.data.payload;
        // Panggil toast custom
        showToast(title, body);
      }

      // Handle queue check request dari SW
      if (
        event.data &&
        (event.data.type === "CHECK_QUEUE" ||
          event.data.type === "INITIAL_QUEUE_CHECK")
      ) {
        console.log("SW requesting queue check");

        if (user && user.user_id) {
          checkQueuedNotifications(user.user_id);
        }
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
  }, [user]); // Depend on user

  // Event listener untuk network online
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network online, checking queued notifications...");

      if (user && user.user_id) {
        // Beritahu SW
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "USER_ONLINE",
            payload: { userId: user.user_id },
          });
        }

        // Check queue
        setTimeout(() => {
          checkQueuedNotifications(user.user_id);
        }, 1000);
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [user]);

  // Periodic queue check (setiap 10 menit)
  useEffect(() => {
    if (!user || !user.user_id) return;

    // Check sekarang
    checkQueuedNotifications(user.user_id);

    // Set interval untuk check periodic
    const interval = setInterval(() => {
      checkQueuedNotifications(user.user_id);
    }, 10 * 60 * 1000); // 10 menit

    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route element={<ProtectedRoutes redirectUrl="/login"></ProtectedRoutes>}>
        <Route path="/chat" element={<Chat />} />
      </Route>
      <Route
        element={
          <ProtectedAdminRoute redirectUrl="/unauthorized"></ProtectedAdminRoute>
        }
      >
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="/auction" element={<Auction />} />
      <Route path="/auction/:auctionId" element={<AuctionDetail />} />
      <Route path="/check" element={<Check />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/feature-disabled" element={<FeatureDisabled />} />

      {/* Optional: default home */}
      <Route path="/" element={<h1>Welcome</h1>} />
    </Routes>
  );
}
