import { useEffect, useState, useCallback } from "react";
import { showToast } from "../lib/toast";

export default function Check() {
  const [lastMessage, setLastMessage] = useState(null);
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [queuedNotifications, setQueuedNotifications] = useState([]);
  const [testTitle, setTestTitle] = useState("Test Notification");
  const [testBody, setTestBody] = useState("This is a test push notification");
  const [userId, setUserId] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const VITE_VAPID_PUBLIC_KEY =
    "BHp7HlmxLT1N6HFRan79yhwOTlnyljB1DFSsyNru-Rf0RqyKej7P70vzVgukeXrxPCw0yK0hkyzoF0kQ6W3-Rho";
  // Load user data dengan useCallback
  const loadUser = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:80/node/api/user/me", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      setUser(data);
      if (data.user_id) {
        setUserId(data.user_id.toString());
      }
      console.log("User loaded:", data);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }, []);

  useEffect(() => {
    // Panggil loadUser di dalam useEffect tanpa langsung memanggil setState
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    // Listener SW
    const handleMessage = (event) => {
      console.log("Menerima pesan dari SW:", event.data);

      if (event.data && event.data.type === "PUSH_NOTIFICATION") {
        const { title, body, data } = event.data.payload;
        setLastMessage(`${title}: ${body}`);
        showToast(title, body);

        // Update queued notifications jika ada
        if (data?.type === "test") {
          setTimeout(() => {
            loadQueuedNotifications();
          }, 1000);
        }
      }

      // Handle queue check request dari SW
      if (event.data && event.data.type === "CHECK_QUEUE") {
        console.log("SW requesting queue check");
        setTimeout(() => {
          loadQueuedNotifications();
        }, 500);
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
  // WEBPUSH TESTING FUNCTIONS
  // =============================

  // 1. Initialize Push Notifications
  const initPush = async () => {
    setIsLoading(true);
    try {
      if (!("serviceWorker" in navigator)) {
        showToast("Error", "Service Worker not supported");
        return;
      }

      // 1. Minta izin notifikasi
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showToast("Warning", "Notifications not allowed");
        return;
      }

      // 2. Dapatkan VAPID public key dari environment variable
      const publicKey = VITE_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        showToast("Error", "VAPID public key not configured");
        console.error(
          "VITE_VAPID_PUBLIC_KEY is not set in environment variables"
        );
        return;
      }

      console.log("VAPID Public Key:", publicKey.substring(0, 50) + "...");

      // 3. Convert VAPID key dari base64 URL safe ke Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      console.log("Converted VAPID key to Uint8Array");

      // 4. Register Service Worker
      console.log("Registering Service Worker...");
      const registration = await navigator.serviceWorker.register(
        "/react/sw.js",
        {
          scope: "/react/",
        }
      );

      console.log("Service Worker registered:", registration);
      showToast("Success", "SW registered");

      // 5. Tunggu SW aktif
      const swRegistration = await navigator.serviceWorker.ready;
      console.log("Service Worker active:", swRegistration);

      // 6. CEK apakah sudah ada subscription
      let subscription = await swRegistration.pushManager.getSubscription();
      console.log("Existing subscription:", subscription ? "Yes" : "No");

      if (!subscription) {
        console.log("Creating new subscription...");

        // Subscribe dengan VAPID key yang sudah dikonversi
        subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });

        console.log("New subscription created:", subscription);
        showToast("Success", "New subscription created");
      } else {
        console.log("Using existing subscription:", subscription);
        showToast("Info", "Using existing subscription");
      }

      // 7. Konversi subscription ke format JSON untuk dikirim ke server
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

      // 8. Kirim subscription ke server
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
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }

      const result = await res.json();
      console.log("Subscription response:", result);
      showToast("Success", `Subscribed: ${result.status}`);

      // 9. Load subscriptions list
      setTimeout(() => {
        loadSubscriptions();
      }, 500);
    } catch (err) {
      console.error("Push setup failed:", err);
      showToast("Error", `Push setup failed: ${err.message}`);

      // Tampilkan error detail untuk debugging
      if (err.name === "AbortError") {
        console.error("AbortError details:", {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

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

  // 2. Send Test Notification
  const sendTestNotification = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/node/api/notif/send/user/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: testTitle,
          body: testBody,
          data: {
            testId: Date.now(),
            type: "test",
            url: "/react/check",
            timestamp: new Date().toISOString(),
          },
          icon: "/vite.svg",
          type: "test",
        }),
      });

      const result = await res.json();
      console.log("Send notification result:", result);
      showToast("Sent", `Notification sent to user ${userId}`);

      // Refresh queue setelah delay
      setTimeout(() => {
        loadQueuedNotifications();
      }, 500);
    } catch (err) {
      console.error("Error sending notification:", err);
      showToast("Error", `Failed to send: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Load Subscriptions
  const loadSubscriptions = async () => {
    try {
      const res = await fetch("/node/api/notif/list", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      setSubscriptions(data);
      console.log("Subscriptions:", data);
    } catch (err) {
      console.error("Error loading subscriptions:", err);
    }
  };

  // 4. Check Queue
  const checkQueue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/node/api/notif/queue/check?userId=${userId}`, {
        method: "GET",
        credentials: "include",
      });
      const result = await res.json();
      console.log("Queue check result:", result);
      showToast("Queue", `Processed: ${result.result?.processed || 0}`);

      // Refresh queued notifications setelah delay
      setTimeout(() => {
        loadQueuedNotifications();
      }, 500);
    } catch (err) {
      console.error("Error checking queue:", err);
      showToast("Error", "Failed to check queue");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Load Queued Notifications
  const loadQueuedNotifications = async () => {
    try {
      const res = await fetch(`/node/api/notif/queue/user/${userId}`, {
        method: "GET",
        credentials: "include",
      });
      const result = await res.json();
      setQueuedNotifications(result.notifications || []);
      console.log("Queued notifications:", result);
    } catch (err) {
      console.error("Error loading queued notifications:", err);
      setQueuedNotifications([]);
    }
  };

  // 6. Send to Multiple Users
  const sendToMultipleUsers = async () => {
    setIsLoading(true);
    try {
      const userIds = [1, 2, 3]; // Ganti dengan user IDs yang ingin di-test
      const res = await fetch(`/node/api/notif/send/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userIds: userIds,
          title: "Broadcast Message",
          body: "This is a broadcast notification to multiple users",
          data: {
            broadcast: true,
            timestamp: new Date().toISOString(),
          },
          type: "broadcast",
        }),
      });

      const result = await res.json();
      console.log("Broadcast result:", result);
      showToast("Broadcast", `Sent to ${userIds.length} users`);
    } catch (err) {
      console.error("Error broadcasting:", err);
      showToast("Error", "Broadcast failed");
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Test Offline Scenario
  const testOfflineScenario = async () => {
    setIsLoading(true);
    try {
      // Simulate sending notification while "offline"
      const res = await fetch(`/node/api/notif/send/user/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: "Offline Test",
          body: "This notification was queued while you were offline",
          data: {
            offlineTest: true,
            queuedAt: new Date().toISOString(),
          },
          type: "offline_test",
        }),
      });

      const result = await res.json();
      console.log("Offline test result:", result);
      showToast("Offline Test", "Notification queued");

      // Show queued notifications setelah delay
      setTimeout(() => {
        loadQueuedNotifications();
      }, 500);
    } catch (err) {
      console.error("Error in offline test:", err);
      showToast("Error", "Offline test failed");
    } finally {
      setIsLoading(false);
    }
  };

  // 8. Trigger SW Queue Check
  const triggerSWQueueCheck = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CHECK_QUEUE_REQUEST",
      });
      showToast("SW", "Queue check requested");

      // Refresh queued notifications setelah delay
      setTimeout(() => {
        loadQueuedNotifications();
      }, 1000);
    } else {
      showToast("Error", "Service Worker not ready");
    }
  };

  // 9. Unsubscribe
  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const swRegistration = await navigator.serviceWorker.ready;
      const subscription = await swRegistration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log("Unsubscribed from push");
        showToast("Unsubscribed", "Push notifications disabled");

        // Clear local state setelah delay
        setTimeout(() => {
          setSubscriptions([]);
          setQueuedNotifications([]);
        }, 500);
      }
    } catch (err) {
      console.error("Error unsubscribing:", err);
      showToast("Error", "Failed to unsubscribe");
    } finally {
      setIsLoading(false);
    }
  };

  // =============================
  // FETCH PRODUCTS
  // =============================
  const loadProducts = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Helper untuk image
  const getImageUrl = (path) => {
    return path && path !== "" ? `/api/image?file=${path}` : "/no-image.png";
  };

  // Format waktu
  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <h1>WebPush Testing Page</h1>

      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            backgroundColor: "#2196F3",
            color: "white",
            padding: "10px 20px",
            borderRadius: 5,
            zIndex: 1000,
          }}
        >
          Loading...
        </div>
      )}

      {/* User Info */}
      <div
        style={{
          marginBottom: 30,
          padding: 15,
          backgroundColor: "#f5f5f5",
          borderRadius: 8,
        }}
      >
        <h3>User Info</h3>
        {user ? (
          <div>
            <p>
              <strong>ID:</strong> {user.user_id}
            </p>
            <p>
              <strong>Name:</strong> {user.name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Role:</strong> {user.role}
            </p>
          </div>
        ) : (
          <p>Loading user info...</p>
        )}
        <button onClick={loadUser}>Refresh User</button>
      </div>

      {/* WebPush Testing Section */}
      <div style={{ marginBottom: 40 }}>
        <h2>WebPush Testing</h2>

        {/* Notification Input */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", marginBottom: 5 }}>
              User ID:
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{ marginLeft: 10, padding: 5 }}
              />
            </label>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", marginBottom: 5 }}>
              Title:
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 5 }}
              />
            </label>
          </div>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: "block", marginBottom: 5 }}>
              Body:
              <textarea
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  marginTop: 5,
                  minHeight: 60,
                }}
              />
            </label>
          </div>
        </div>

        {/* Testing Buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <button
            onClick={initPush}
            style={{ padding: 10, backgroundColor: "#4CAF50", color: "white" }}
          >
            1. Initialize Push
          </button>
          <button
            onClick={sendTestNotification}
            style={{ padding: 10, backgroundColor: "#2196F3", color: "white" }}
          >
            2. Send Test Notification
          </button>
          <button
            onClick={checkQueue}
            style={{ padding: 10, backgroundColor: "#FF9800", color: "white" }}
          >
            3. Check Queue
          </button>
          <button
            onClick={triggerSWQueueCheck}
            style={{ padding: 10, backgroundColor: "#9C27B0", color: "white" }}
          >
            4. Trigger SW Check
          </button>
          <button
            onClick={testOfflineScenario}
            style={{ padding: 10, backgroundColor: "#607D8B", color: "white" }}
          >
            5. Test Offline
          </button>
          <button
            onClick={sendToMultipleUsers}
            style={{ padding: 10, backgroundColor: "#795548", color: "white" }}
          >
            6. Send to Multiple
          </button>
          <button
            onClick={unsubscribe}
            style={{ padding: 10, backgroundColor: "#f44336", color: "white" }}
          >
            7. Unsubscribe
          </button>
        </div>

        {/* Last Message */}
        <div
          style={{
            marginTop: 20,
            border: "1px solid #ccc",
            padding: 10,
            borderRadius: 5,
          }}
        >
          <strong>Last Notification Received:</strong>
          <p style={{ marginTop: 5 }}>
            {lastMessage || "No notifications received yet"}
          </p>
        </div>
      </div>

      {/* Subscriptions List */}
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <h3>Subscriptions ({subscriptions.length})</h3>
          <div>
            <button onClick={loadSubscriptions} style={{ marginRight: 10 }}>
              Refresh
            </button>
            <button onClick={() => setSubscriptions([])}>Clear</button>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <p>No subscriptions found</p>
        ) : (
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {subscriptions.map((sub, index) => (
              <div
                key={index}
                style={{
                  padding: 10,
                  marginBottom: 5,
                  backgroundColor: "#f9f9f9",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                }}
              >
                <p>
                  <strong>User ID:</strong> {sub.user_id}
                </p>
                <p>
                  <strong>Endpoint:</strong> {sub.endpoints.substring(0, 50)}...
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(sub.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Queued Notifications */}
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <h3>Queued Notifications ({queuedNotifications.length})</h3>
          <div>
            <button
              onClick={loadQueuedNotifications}
              style={{ marginRight: 10 }}
            >
              Refresh
            </button>
            <button onClick={() => setQueuedNotifications([])}>Clear</button>
          </div>
        </div>

        {queuedNotifications.length === 0 ? (
          <p>No queued notifications</p>
        ) : (
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {queuedNotifications.map((notif, index) => (
              <div
                key={index}
                style={{
                  padding: 10,
                  marginBottom: 5,
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffeaa7",
                  borderRadius: 4,
                }}
              >
                <p>
                  <strong>Title:</strong> {notif.payload?.title}
                </p>
                <p>
                  <strong>Body:</strong> {notif.payload?.body}
                </p>
                <p>
                  <strong>Queued At:</strong> {formatTime(notif.queuedAt)}
                </p>
                <p>
                  <strong>Expires:</strong> {formatTime(notif.expiresAt)}
                </p>
                {notif.payload?.data && (
                  <p>
                    <small>Data: {JSON.stringify(notif.payload.data)}</small>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <hr />

      {/* Original Product Section */}
      <div>
        <h2>Product Testing</h2>
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

      {/* Additional Test Buttons */}
      <div
        style={{
          marginTop: 30,
          padding: 20,
          backgroundColor: "#e8f5e8",
          borderRadius: 8,
        }}
      >
        <h3>Additional Tests</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() =>
              showToast("Test", "This is a test toast notification")
            }
          >
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
              showToast("Session Test", `User ID: ${data.user_id}`);
            }}
          >
            Test Session
          </button>

          <button
            onClick={() => {
              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistration().then((reg) => {
                  if (reg) {
                    console.log("SW Registration:", reg);
                    showToast("SW", "Service Worker is registered");
                  } else {
                    showToast("SW", "No Service Worker found");
                  }
                });
              }
            }}
          >
            Check SW Registration
          </button>

          <button
            onClick={() => {
              const permission = Notification.permission;
              showToast("Permission", `Notification permission: ${permission}`);
            }}
          >
            Check Permission
          </button>
        </div>
      </div>
    </div>
  );
}
