import { router } from "../../../app.js";
import { GET, POST } from "../../api/api.js";

function HandleSearchNavbar(param) {
  router.navigateTo("/home?search=" + param);
}

function morphAuthBtn(data) {
  const btn = document.getElementById("navbar-auth-btn");
  const chart = document.getElementById("navbar-chart");
  const balance = document.getElementById("navbar-balance");
  if (data.status == "success") {
    // udah login
    btn.innerHTML = `<a href="/profile"><button class="btn btn-login">Profile</button></a>
       <button class="btn btn-register" id="btn-logout">Log Out</button>`;
    const logoutBtn = document.getElementById("btn-logout");
    logoutBtn.addEventListener("click", () => {
      POST(
        "/api/logout",
        {},
        (data) => {
          if (data.status) {
            router.navigateTo("/");
            // ubah navbar
            morphAuthBtn(data);
          } else {
            alert("Logout gagal: " + data.message);
          }
        },
        (err) => {
          if (err) {
            alert("Logout gagal: error jaringan");
          }
        }
      );
    });
  } else {
    // blom login
    chart.innerHTML = "";
    balance.innerHTML = "";
  }
}

export function InitNavbar() {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const logo = document.getElementById("navbar-logo");
  searchBtn.addEventListener("click", () => {
    HandleSearchNavbar(searchInput.value.trim());
  });

  logo.addEventListener("click", () => {
    router.navigateTo("/home");
  });

  // CEK USER DAH LOGIN APA BELOM
  GET("/api/auth", {}, morphAuthBtn, () => {});
}
