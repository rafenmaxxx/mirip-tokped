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

        if (verifyResult.data.password !== currentPassword) {
          errorDiv.textContent = "Password lama salah.";
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
              renderToast("Password berhasil diubah", "success");
              modal.style.display = "none";
              Loading.hide();
              location.reload();
            } else {
              Loading.hide();
              errorDiv.textContent =
                updateResult.message || "Gagal mengubah password.";
            }
            submitBtn.disabled = false;
            submitBtn.textContent = "Simpan";
          },
          () => {}
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
    <div class="profile-card">
        <h2>Biodata Kamu</h2>
        <form id="view-profile-form">
            <div class="form-grid">
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
    `;

  document.getElementById("profile-content").innerHTML = html;

  document.getElementById("nama").value = data.name || "";
  document.getElementById("email").value = data.email || "";
  document.getElementById("alamat").value = data.address || "";
 
  // Isi form edit
  document.getElementById("nama-edit").value = data.name || "";
  document.getElementById("alamat-edit").value = data.address || "";
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
  const profileContent = document.getElementById("profile-content");
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
}
