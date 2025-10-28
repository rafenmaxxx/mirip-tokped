import { router } from "../../../app.js";
import { GET, POST } from "../../api/api.js";

let debounceTimer = null;

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
            morphAuthBtn({ status: "error" });
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
    btn.innerHTML = ` <a href="/login"><button class="btn btn-login">Login</button></a>
        <a href="/register "><button class="btn btn-register">Register</button></a>`;
    chart.innerHTML = "";
    balance.innerHTML = "";
  }
}

function showSuggestion(query) {
  const suggestionsBox = document.getElementById("searchSuggestions");

  if (!suggestionsBox) return;

  if (query.trim() === "") {
    suggestionsBox.style.display = "none";
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    GET(
      "/api/product",
      { title: query },
      (res) => {
        if (res.status !== "success" || !Array.isArray(res.data)) {
          suggestionsBox.style.display = "none";
          return;
        }

        const items = res.data;
        if (items.length === 0) {
          suggestionsBox.style.display = "none";
          return;
        }

        suggestionsBox.innerHTML = items
          .map((p) => `<div class="suggest-item">${p.product_name}</div>`)
          .join("");

        suggestionsBox.style.display = "block";

        suggestionsBox.querySelectorAll(".suggest-item").forEach((el) => {
          el.addEventListener("click", () => {
            const searchInput = document.getElementById("searchInput");
            searchInput.value = el.textContent;
            suggestionsBox.style.display = "none";
          });
        });
      },
      () => {
        suggestionsBox.style.display = "none";
      }
    );
  }, 500);
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

  searchInput.addEventListener("input", (e) => {
    showSuggestion(e.target.value);
  });

  // CEK USER DAH LOGIN APA BELOM
  GET("/api/auth", {}, morphAuthBtn, () => {});
}
