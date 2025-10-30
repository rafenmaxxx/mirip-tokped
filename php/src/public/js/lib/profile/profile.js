import { GET, PUT } from "../../api/api.js";

// --- Ambil data user yang sedang login ---
// function getLoggedInUser() {
//     return new Promise((resolve) => {
//         GET(
//             "/api/auth",
//             {},
//             (response) => {
//                 if (response.status === "success" && response.data) {
//                     resolve(response.data);
//                 } else {
//                     resolve(null);
//                 }
//             },
//             () => resolve(null)
//         );
//     });
// }

function renderPasswordChangeModal() {
    document.getElementById("modal").innerHTML = `
    <div class="modal-content">
        <span class="close-button" id="close-modal">&times;</span>
        <h2>Ubah Password</h2>
        <form id="change-password-form">
            <label for="current-password">Password Saat Ini:</label>
            <input type="password" id="current-password" name="current-password" required>
            <label for="new-password">Password Baru:</label>
            <input type="password" id="new-password" name="new-password" required>
            <label for="confirm-password">Konfirmasi Password Baru:</label>
            <input type="password" id="confirm-password" name="confirm-password" required>
            <button type="submit" class="btn btn-save">Simpan</button>
        </form>
    </div>
    `;
    // alert("Fungsi Ubah Password belum diimplementasikan.");
}
// --- Render isi profil ke form ---
function renderProfile(data) {
    document.getElementById("nama").value = data.name || "";
    document.getElementById("email").value = data.email || "";
    document.getElementById("alamat").value = data.address || "";
    document.getElementById("password").value = data.password || "";
}

// --- Aktif / nonaktifkan mode edit ---
// function toggleEditMode(isEditing) {
//     const editableElements = [
//         document.getElementById("name"),
//         document.getElementById("address"),
//     ];
//     const editBtn = document.getElementById("edit-profile-btn");
//     const saveBtn = document.getElementById("save-profile-btn");
//     const cancelBtn = document.getElementById("cancel-edit-btn");

//     editableElements.forEach((el) => {
//         if (el) {
//             el.readOnly = !isEditing;
//             el.style.backgroundColor = isEditing ? "#fff" : "#eee";
//         }
//     });

//     editBtn.style.display = isEditing ? "none" : "inline-block";
//     saveBtn.style.display = isEditing ? "inline-block" : "none";
//     cancelBtn.style.display = isEditing ? "inline-block" : "none";
// }

// --- Setup event listener tombol edit/simpan/batal ---
function setupEditHandlers(userId) {
    const profileForm = document.getElementById("profile-form");
    const editBtn = document.getElementById("edit-profile-btn");
    const cancelBtn = document.getElementById("cancel-edit-btn");
    const changePasswordBtn = document.getElementById("change-password-btn");

    let originalFormData = {};

    // --- Tombol Edit ---
    editBtn.addEventListener("click", () => {
        const nama = document.getElementById("name").value;
        const alamat = document.getElementById("address").value;
        console
        alert("g");
        PUT("api/user", {nama: nama, alamat: alamat}, (response) => {console.log("new:" , response), editErr});
        
        // GET("/api/user", {}, () => {}, () => {});
    });

    // --- Tombol Batal ---
    // cancelBtn.addEventListener("click", () => {
    //     for (const key in originalFormData) {
    //         const el = document.getElementById(key);
    //         if (el) el.value = originalFormData[key];
    //     }
    //     toggleEditMode(false);
    // });

    // --- Submit form (Simpan perubahan) ---
    // profileForm.addEventListener("submit", (e) => {
    //     e.preventDefault();

    //     const name = document.getElementById("name").value.trim();
    //     const address = document.getElementById("address").value.trim();

    //     PUT(
    //         `/api/user?id=${userId}`,
    //         { name, address },
    //         (response) => {
    //             if (response.status === "success") {
    //                 alert("Profil berhasil diperbarui!");
    //                 toggleEditMode(false);
    //             } else {
    //                 alert(`Gagal menyimpan profil: ${response.message}`);
    //             }
    //         },
    //         () => {
    //             alert("Terjadi kesalahan koneksi saat menyimpan perubahan.");
    //         }
    //     );
    // });

    // --- Ubah Password ---
    changePasswordBtn.addEventListener("click", () => {
        renderPasswordChangeModal();
    });

    // toggleEditMode(false);
}

function editErr(err) {
    if (err) {
    alert("Error updating profile");
    console.error(err);
  }
}



// --- Fungsi utama halaman Profile ---
export function InitProfilePage() {
    const loadingIndicator = document.getElementById("loading-indicator");
    const profileContent = document.getElementById("profile-content");

    // tampilkan loading
    // loadingIndicator.style.display = "block";
    // profileContent.style.display = "none";

    GET(
        "/api/user",
        {},
        (response) => {
            // loadingIndicator.style.display = "none";

            if (response.status === "success" && response.data) {
                console.log("Data profil:", response.data);
                renderProfile(response.data);
                profileContent.style.display = "block";
                setupEditHandlers(response.data.id);
            } else {
                profileContent.innerHTML = `<p class="error-message">Gagal memuat data profil.</p>`;
            }
        },
        () => {}
    );
}