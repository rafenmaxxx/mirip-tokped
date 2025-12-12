import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Helper function untuk convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Subscribe() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const initPush = async () => {
      const VITE_VAPID_PUBLIC_KEY = "BHp7HlmxLT1N6HFRan79yhwOTlnyljB1DFSsyNru-Rf0RqyKej7P70vzVgukeXrxPCw0yK0hkyzoF0kQ6W3-Rho";
      
      try {
        setStatus("Checking browser support...");
        if (!("serviceWorker" in navigator)) {
          throw new Error("Service Worker not supported in this browser");
        }

        setStatus("Requesting notification permission...");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("Notification permission denied");
        }

        setStatus("Getting VAPID key...");
        const publicKey = VITE_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error("VAPID public key not found");
        }

        console.log("VAPID Public Key:", publicKey.substring(0, 50) + "...");

        setStatus("Converting VAPID key...");
        const convertedVapidKey = urlBase64ToUint8Array(publicKey);
        console.log("Converted VAPID key to Uint8Array");

        setStatus("Registering Service Worker...");
        const registration = await navigator.serviceWorker.register("/react/sw.js", {
          scope: "/react/",
        });

        console.log("Service Worker registered:", registration);

        setStatus("Waiting for Service Worker to activate...");
        const swRegistration = await navigator.serviceWorker.ready;
        console.log("Service Worker active:", swRegistration);

        setStatus("Checking existing subscription...");
        let subscription = await swRegistration.pushManager.getSubscription();
        console.log("Existing subscription:", subscription ? "Yes" : "No");

        if (!subscription) {
          setStatus("Creating new subscription...");
          subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });
          console.log("New subscription created:", subscription);
        } else {
          console.log("Using existing subscription");
        }

        setStatus("Preparing subscription data...");
        const subscriptionJson = subscription.toJSON();
        console.log("Subscription JSON:", subscriptionJson);

        const subscriptionData = {
          endpoint: subscriptionJson.endpoint,
          expirationTime: subscriptionJson.expirationTime,
          keys: {
            p256dh: subscriptionJson.keys.p256dh,
            auth: subscriptionJson.keys.auth,
          },
        };

        console.log("Prepared subscription data:", subscriptionData);

        setStatus("Getting user information...");
        const userRes = await fetch("/api/user", {
          method: "GET",
          credentials: "include",
        });

        if (!userRes.ok) {
          throw new Error("Failed to get user information");
        }

        const userData = await userRes.json();
        if (userData.status !== "success" || !userData.data) {
          throw new Error("Invalid user data");
        }

        const userId = userData.data.user_id;
        console.log("User ID:", userId);

        setStatus("Sending subscription to server...");
        const res = await fetch("/node/api/notif/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...subscriptionData,
            userId: userId,
          }),
        });

        if (!res.ok) {
          throw new Error(`Subscription failed: ${res.status}`);
        }

        const result = await res.json();
        console.log("Subscription response:", result);

        setStatus("Redirecting...");
        
        // Redirect back to profile after 1 second
        setTimeout(() => {
          window.location.href = "/profile";
        }, 1000);

      } catch (err) {
        console.error("Push setup failed:", err);
        setError(err.message);
        setStatus("Failed");
        
        // Redirect back to profile after 3 seconds even on error
        setTimeout(() => {
          window.location.href = "/profile";
        }, 3000);
      }
    };

    initPush();
  }, [navigate]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      backgroundColor: "#f0f3f7",
      padding: "20px",
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "48px 40px",
        boxShadow: "0 1px 6px rgba(49, 53, 59, 0.12)",
        maxWidth: "480px",
        width: "100%",
        textAlign: "center"
      }}>
        {!error ? (
          <>
            <img 
              src="/react/img/flags-disabled.png" 
              alt="Notification Setup"
              style={{
                width: "180px",
                height: "180px",
                margin: "0 auto 24px",
                display: "block",
                objectFit: "contain"
              }}
            />
            <div style={{
              width: "48px",
              height: "48px",
              border: "3px solid #00AA5B",
              borderTop: "3px solid transparent",
              borderRadius: "50%",
              margin: "0 auto 24px",
              animation: "spin 0.8s linear infinite"
            }}></div>
            <h2 style={{ 
              marginBottom: "12px", 
              color: "#212121",
              fontSize: "24px",
              fontWeight: "600",
              letterSpacing: "-0.5px"
            }}>
              Mengaktifkan Notifikasi Push
            </h2>
            <p style={{ 
              color: "#6D7588", 
              fontSize: "15px",
              lineHeight: "1.6",
              margin: "0"
            }}>
              {status}
            </p>
          </>
        ) : (
          <>
            <img 
              src="/img/flags-disabled.png" 
              alt="Setup Failed"
              style={{
                width: "160px",
                height: "160px",
                margin: "0 auto 24px",
                display: "block",
                objectFit: "contain",
                opacity: "0.7"
              }}
            />
            <div style={{
              width: "64px",
              height: "64px",
              backgroundColor: "#ff5252",
              borderRadius: "50%",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "32px",
              fontWeight: "bold"
            }}>
              ✕
            </div>
            <h2 style={{ 
              marginBottom: "12px", 
              color: "#ff5252",
              fontSize: "24px",
              fontWeight: "600",
              letterSpacing: "-0.5px"
            }}>
              Pengaturan Gagal
            </h2>
            <p style={{ 
              color: "#6D7588", 
              fontSize: "15px", 
              marginBottom: "24px",
              lineHeight: "1.6"
            }}>
              {error}
            </p>
            <div style={{
              padding: "12px 16px",
              backgroundColor: "#fff3cd",
              borderRadius: "8px",
              border: "1px solid #ffeaa7"
            }}>
              <p style={{ 
                color: "#856404", 
                fontSize: "13px",
                margin: "0",
                lineHeight: "1.5"
              }}>
                🔄 Mengarahkan kembali ke halaman profil...
              </p>
            </div>
          </>
        )}
      </div>``

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
