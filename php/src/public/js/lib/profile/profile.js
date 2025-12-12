import { GET, PUT } from "../../api/api.js";
import { renderToast } from "../general/toast.js";
import { Loading } from "../general/loading.js";
import { ValidatePassword } from "../../util/password_validation.js";

// --- Modal Change Password ---
function renderPasswordChangeModal() {
  const modal = document.getElementById("modal");
  modal.innerHTML = `
    <div class="modal-overlay">
        <div class="modal-content">
            <span class="close-button" id="close-modal">&times;</span>
            <h2>Ubah Password</h2>
            <form id="change-password-form">
                <div class="form-group">
                    <label for="current-password">Password Lama:</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="current-password" name="current-password" required>
                        <button type="button" class="toggle-password" data-target="current-password">
                            show
                        </button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="new-password">Password Baru:</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="new-password" name="new-password" required>
                        <button type="button" class="toggle-password" data-target="new-password">
                            show
                        </button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="confirm-password">Konfirmasi Password Baru:</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="confirm-password" name="confirm-password" required>
                        <button type="button" class="toggle-password" data-target="confirm-password">
                            show
                        </button>
                    </div>
                </div>
                
                <div id="error-message" class="error-message"></div>
                <button type="submit" class="btn-profile btn-profile-save" id="save-password-btn-profile">Simpan</button>
            </form>
        </div>
    </div>
    `;

  modal.style.display = "block";

  // Toggle password visibility
  const toggleButtons = modal.querySelectorAll(".toggle-password");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "hide";
      } else {
        input.type = "password";
        btn.textContent = "show";
      }
    });
  });

  const submitBtn = document.getElementById("save-password-btn-profile");
  const errorDiv = document.getElementById("error-message");

  submitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    errorDiv.textContent = "";

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // Validasi client-side
    if (newPassword !== confirmPassword) {
      errorDiv.textContent =
        "Password baru dan konfirmasi password tidak cocok.";
      return;
    }

    if (!ValidatePassword(newPassword)) {
      errorDiv.textContent = "Password baru tidak valid.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Menyimpan...";

    // Verifikasi password lama

    GET(
      "/api/user",
      {},
      (verifyResult) => {
        if (verifyResult.status !== "success") {
          errorDiv.textContent = "User tidak ditemukan.";
          submitBtn.disabled = false;
          submitBtn.textContent = "Simpan";
          return;
        }

        // Update password baru
        Loading.show("Mengubah password...");
        PUT(
          "/api/user",
          { password: newPassword },
          (updateResult) => {
            if (updateResult.status === "success") {
              setToastAfterReload("Password berhasil diubah", "success");
              Loading.hide();
              modal.style.display = "none";
              location.reload();
              
            } else {
              Loading.hide();
              errorDiv.textContent =
                updateResult.message || "Gagal mengubah password.";
            }
            submitBtn.disabled = false;
            submitBtn.textContent = "Simpan";
          },
          (error) => {
            Loading.hide();
            renderToast("Terjadi kesalahan saat mengubah password.", "error");
          }
        );
      },
      () => {}
    );
  });

  // Close modal handler
  document.getElementById("close-modal").addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close when clicking overlay
  modal.querySelector(".modal-overlay").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      modal.style.display = "none";
    }
  });
}

// --- Modal Konfirmasi Edit Profile ---
function renderConfirmationModal(nama, alamat, onConfirm) {
  const modal = document.getElementById("modal");
  modal.innerHTML = `
    <div class="modal-overlay">
        <div class="modal-content modal-confirmation">
            <h2>Konfirmasi Perubahan</h2>
            <p>Apakah Anda yakin ingin menyimpan perubahan berikut?</p>
            <div class="confirmation-details">
                <p><strong>Nama:</strong> ${nama || "(tidak diubah)"}</p>
                <p><strong>Alamat:</strong> ${alamat || "(tidak diubah)"}</p>
            </div>
            <div class="button-group">
                <button class="btn-profile btn-profile-edit" id="confirm-save">Ya, Simpan</button>
                <button class="btn-profile btn-profile-danger" id="cancel-save">Batal</button>
            </div>
        </div>
    </div>
    `;

  modal.style.display = "block";

  document.getElementById("confirm-save").addEventListener("click", () => {
    modal.style.display = "none";
    onConfirm();
  });

  document.getElementById("cancel-save").addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.querySelector(".modal-overlay").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      modal.style.display = "none";
    }
  });
}

// --- Render isi profil ke form ---
function renderProfile(data) {
  const html = `
    <div class="profile-card" style="height: 100%;">
        <h2>Biodata Kamu</h2>
        <form id="view-profile-form" style="height: calc(100% - 50px); display: flex; flex-direction: column;">
            <div class="form-grid" style="flex: 1;">
                <div class="form-group">
                    <label for="nama">Nama</label>
                    <input type="text" id="nama" name="nama" readonly>
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" readonly>
                </div>
                <div class="form-group">
                    <label for="alamat">Alamat</label>
                    <input type="text" id="alamat" name="alamat" readonly>
                </div>
            </div>
        </form>
    </div>

    <div class="notification-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">Preferensi Notifikasi</h2>
            <button type="button" id="subscription-toggle-btn" class="btn-profile" style="padding: 8px 16px; font-size: 14px; background-color: #00AA5B; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Start Subscribing
            </button>
        </div>
        <div class="notification-group" id="notification-group" style="position: relative;">
            <div id="notification-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(156, 163, 175, 0.5); border-radius: 8px; z-index: 10; pointer-events: all;"></div>
            <div class="notification-item">
                <input type="checkbox" id="notif-chat" name="notif-chat" disabled>
                <label for="notif-chat" style="color: #9CA3AF;">Notifikasi Chat</label>
            </div>
            <div class="notification-item">
                <input type="checkbox" id="notif-lelang" name="notif-lelang" disabled>
                <label for="notif-lelang" style="color: #9CA3AF;">Notifikasi Lelang</label>
            </div>
            <div class="notification-item">
                <input type="checkbox" id="notif-pesanan" name="notif-pesanan" disabled>
                <label for="notif-pesanan" style="color: #9CA3AF;">Notifikasi Pesanan</label>
            </div>
        </div>
    </div>

    <div class="edit-card">
        <h2>Edit Profil</h2>
        <form id="edit-profile-form">
            <div class="form-group editable">
                <label for="nama-edit">Nama</label>
                <input type="text" id="nama-edit" name="nama">
            </div>

            <div class="form-group editable">
                <label for="alamat-edit">Alamat</label>
                <input type="text" id="alamat-edit" name="alamat">
            </div>

            <div class="button-group">
                <button type="submit" id="edit-profile-btn-profile" class="btn-profile btn-profile-edit">Edit Profil</button>
                <button type="button" id="change-password-btn-profile" class="btn-profile btn-profile-password">Ubah Password</button>
            </div>
        </form>
    </div>

    <div class="profile-image-card">
        <img src="/img/user-minion.png" alt="User Profile" class="profile-minion-image">
    </div>
    `;

  document.getElementById("profile-content").innerHTML = html;

  document.getElementById("nama").value = data.name || "";
  document.getElementById("email").value = data.email || "";
  document.getElementById("alamat").value = data.address || "";
 
  // Isi form edit
  document.getElementById("nama-edit").value = data.name || "";
  document.getElementById("alamat-edit").value = data.address || "";

  // Load notification preferences
  loadNotificationPreferences();
  
  // Setup subscription toggle
  setupSubscriptionToggle();
}

// --- Load Notification Preferences ---
function loadNotificationPreferences() {
  console.log("Loading notification preferences...");
  
  // Get user data from PHP API (not Node API to avoid routing issues)
  GET(
    "/api/user",
    {},
    async (response) => {
      if (response.status !== "success" || !response.data) {
        console.error("Failed to get user data");
        setDefaultPreferences();
        return;
      }

      const userId = response.data.user_id;
      console.log("User ID:", userId);

      if (!userId) {
        console.error("No user ID found");
        setDefaultPreferences();
        return;
      }

      try {
        // Now fetch preferences using userId
        const prefsResponse = await fetch(`/node/api/push-preferences/user/${userId}`, {
          method: "GET",
          credentials: "include"
        });

        console.log("Preferences response status:", prefsResponse.status, prefsResponse.ok);

        if (!prefsResponse.ok) {
          console.error("Failed to load preferences, status:", prefsResponse.status);
          setDefaultPreferences(userId);
          return;
        }

        const data = await prefsResponse.json();
        console.log("Preferences data:", data);
        
        if (data.status === "success" && data.data) {
          const prefs = data.data;
          
          // Set checkbox values based on data
          document.getElementById("notif-chat").checked = prefs.chat_enabled !== false;
          document.getElementById("notif-lelang").checked = prefs.auction_enabled !== false;
          document.getElementById("notif-pesanan").checked = prefs.order_enabled !== false;
          
          // Setup change handlers with userId
          setupNotificationHandlers(userId);
        } else {
          setDefaultPreferences(userId);
        }
      } catch (error) {
        console.error("Error loading notification preferences:", error);
        setDefaultPreferences(userId);
      }
    },
    (hasError) => {
      // hasError = false berarti sukses, true berarti error
      if (hasError) {
        console.error("Error getting user data from API");
        setDefaultPreferences();
      }
    }
  );
}

// Helper function to set default preferences
function setDefaultPreferences(userId = null) {
  document.getElementById("notif-chat").checked = true;
  document.getElementById("notif-lelang").checked = true;
  document.getElementById("notif-pesanan").checked = true;
  
  if (userId) {
    setupNotificationHandlers(userId);
  } else {
    // Setup handlers without userId (will fail gracefully)
    setupNotificationHandlers(null);
  }
}

// --- Setup Notification Change Handlers ---
function setupNotificationHandlers(userId) {
  const chatCheckbox = document.getElementById("notif-chat");
  const lelangCheckbox = document.getElementById("notif-lelang");
  const pesananCheckbox = document.getElementById("notif-pesanan");

  const updatePreference = async (field, value) => {
    if (!userId) {
      renderToast("User ID tidak ditemukan", "error");
      return;
    }

    try {
      const payload = {};
      payload[field] = value;

      const response = await fetch(`/node/api/push-preferences/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        renderToast("Preferensi notifikasi berhasil diperbarui", "success");
      } else {
        renderToast("Gagal memperbarui preferensi notifikasi", "error");
      }
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      renderToast("Terjadi kesalahan saat memperbarui preferensi", "error");
    }
  };

  chatCheckbox.addEventListener("change", (e) => {
    updatePreference("chat_enabled", e.target.checked);
  });

  lelangCheckbox.addEventListener("change", (e) => {
    updatePreference("auction_enabled", e.target.checked);
  });

  pesananCheckbox.addEventListener("change", (e) => {
    updatePreference("order_enabled", e.target.checked);
  });
}

// --- Helper function untuk convert VAPID key ---
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

// --- Unsubscribe Push Notifications ---
async function unsubscribePush() {
  try {
    console.log("Starting unsubscribe process...");
    
    if (!("serviceWorker" in navigator)) {
      console.error("Service Worker not supported");
      renderToast("Browser tidak mendukung Service Worker", "error");
      return false;
    }
    
    const registration = await navigator.serviceWorker.getRegistration("/react/");
    
    if (!registration) {
      console.log("No service worker registration found");
      renderToast("Tidak ada subscription aktif", "warning");
      return true; // Consider it success since there's nothing to unsubscribe
    }
    
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log("Unsubscribing...", subscription.endpoint.substring(0, 50));
      const result = await subscription.unsubscribe();
      console.log("Unsubscribe result:", result);
      
      if (result) {
        renderToast("berhasil unsubscribe!", "success");
        return true;
      } else {
        renderToast("gagal unsubscribe", "error");
        return false;
      }
    } else {
      console.log("No subscription found");
      renderToast("Tidak ada subscription aktif", "warning");
      return true;
    }
  } catch (err) {
    console.error("Unsubscribe failed:", err);
    renderToast(`Gagal unsubscribe: ${err.message}`, "error");
    return false;
  }
}

// --- Check if user is subscribed ---
async function checkSubscriptionStatus() {
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration("/react/");
      if (!registration) {
        console.log("No service worker registered");
        return false;
      }
      const subscription = await registration.pushManager.getSubscription();
      console.log("Subscription status:", subscription ? "Subscribed" : "Not subscribed");
      return subscription !== null;
    }
    return false;
  } catch (err) {
    console.error("Error checking subscription:", err);
    return false;
  }
}

// --- Setup Subscription Toggle ---
function setupSubscriptionToggle() {
  const toggleBtn = document.getElementById("subscription-toggle-btn");
  const overlay = document.getElementById("notification-overlay");
  const checkboxes = [
    document.getElementById("notif-chat"),
    document.getElementById("notif-lelang"),
    document.getElementById("notif-pesanan")
  ];
  const labels = document.querySelectorAll(".notification-item label");
  
  if (!toggleBtn) {
    console.error("Subscription toggle button not found");
    return;
  }
  
  let isSubscribed = false;
  
  // Check subscription status asynchronously
  checkSubscriptionStatus().then(subscribed => {
    isSubscribed = subscribed;
    console.log("Initial subscription status:", isSubscribed);
    
    // Update UI based on subscription status
    if (isSubscribed) {
      toggleBtn.textContent = "Stop Subscribing";
      toggleBtn.style.backgroundColor = "#DC2626";
      overlay.style.display = "none";
      
      checkboxes.forEach(cb => {
        if (cb) cb.disabled = false;
      });
      
      labels.forEach(label => {
        label.style.color = "#000";
      });
    }
  });
  
  toggleBtn.addEventListener("click", async () => {
    console.log("Toggle button clicked, isSubscribed:", isSubscribed);
    
    if (!isSubscribed) {
      // Start subscribing - redirect to React subscribe page
      console.log("Redirecting to subscribe page");
      window.location.href = "/react/subscribe";
    } else {
      // Stop subscribing
      toggleBtn.disabled = true;
      toggleBtn.textContent = "Loading...";
      
      const success = await unsubscribePush();
      
      if (success) {
        isSubscribed = false;
        toggleBtn.textContent = "Start Subscribing";
        toggleBtn.style.backgroundColor = "#00AA5B";
        overlay.style.display = "block";
        
        checkboxes.forEach(cb => {
          if (cb) cb.disabled = true;
        });
        
        labels.forEach(label => {
          label.style.color = "#9CA3AF";
        });
      } else {
        toggleBtn.textContent = "Stop Subscribing";
      }
      
      toggleBtn.disabled = false;
    }
  });
}

// --- Setup event listener tombol edit/simpan/batal ---
function setupEditHandlers(userId) {
  const editBtn = document.getElementById("edit-profile-btn-profile");
  const changePasswordBtn = document.getElementById(
    "change-password-btn-profile"
  );

  editBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const nama = sanitizeHTML(document.getElementById("nama-edit").value.trim()) || null;
    const alamat = sanitizeHTML(document.getElementById("alamat-edit").value.trim()) || null;

    if (!nama && !alamat) {
      renderToast("Tidak ada perubahan yang dilakukan.", "warning");
      return;
    }

    // Tampilkan modal konfirmasi
    renderConfirmationModal(nama, alamat, () => {

      PUT(
        "/api/user",
        { nama: nama, alamat: alamat },
        (response) => {
          if (response.status === "success") {
            setToastAfterReload("Profil berhasil diperbarui!", "success");
            location.reload();
          } else {
            renderToast(
              "Gagal memperbarui profil: " + (response.message || ""),
              "error"
            );
          }
        },
        (error) => {
          renderToast("Terjadi kesalahan saat memperbarui profil.", "error");
        }
      );
    });
  });

  // --- Ubah Password ---
  changePasswordBtn.addEventListener("click", () => {
    renderPasswordChangeModal();
  });
}

function setToastAfterReload(message, type) {
  sessionStorage.setItem('pendingToast', JSON.stringify({ message, type }));
}

function showPendingToast() {
  const pendingToast = sessionStorage.getItem('pendingToast');
  if (pendingToast) {
    const { message, type } = JSON.parse(pendingToast);
    sessionStorage.removeItem('pendingToast');
    renderToast(message, type);
  }
}

function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  var temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

export function InitProfilePage() {
  // Tunggu sampai DOM selesai di-render
  setTimeout(() => {
    const profileContent = document.getElementById("profile-content");
    
    if (!profileContent) {
      console.error("Element 'profile-content' tidak ditemukan");
      // Coba lagi setelah delay lebih lama
      setTimeout(InitProfilePage, 100);
      return;
    }
    
    showPendingToast();
    GET(
      "/api/user",
      {},
      (response) => {
        if (response.status === "success" && response.data) {
          renderProfile(response.data);
          setupEditHandlers(response.data.user_id);
        } else {
          profileContent.innerHTML = `<p class="error-message">Gagal memuat data profil.</p>`;
        }
      },
      () => {
        profileContent.innerHTML = `<p class="error-message">Terjadi kesalahan saat memuat profil.</p>`;
      }
    );
  }, 0);
}
