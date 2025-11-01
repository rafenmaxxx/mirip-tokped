import { router } from "../../../app.js";
import { GET, POST } from "../../api/api.js";
import { LoadComponent, RemoveComponent } from "../../util/component_loader.js";
import { showModalConfirmation } from "./modal.js";

let debounceTimer = null;
let filterActive = false;

function HandleSearchNavbar(param) {
  router.navigateTo("/home?search=" + param);
}

function InitBalance() {
  GET(
    "/api/user",
    { action: "balance" },
    (data) => {
      const res = data.data;
      const userBalance = document.getElementById("userBalance");
      const val = res.balance.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      });
      userBalance.innerHTML = val;
    },
    () => {}
  );
}

function HandleTopUp(value) {
  POST(
    "/api/topup",
    { value: value },
    (data) => {
      if (data.status == "success") {
        alert("Top Up Berhasil");
        InitBalance();
      } else {
        alert("Top Up Gagal");
      }
    },
    () => {}
  );
}

function morphAuthBtn(data) {
  const btn = document.getElementById("navbar-auth-btn");
  const chart = document.getElementById("navbar-chart");
  const balance = document.getElementById("balance-btn");
  const orderHist = document.getElementById("order-hist");
  if (data.status == "success") {
    // udah login
    btn.innerHTML = `<button class="btn btn-login" id="btn-profile">Profile</button>
       <button class="btn btn-register" id="btn-logout">Log Out</button>`;
    const logoutBtn = document.getElementById("btn-logout");
    logoutBtn.addEventListener("click", () => {
      showModalConfirmation(
        "Yakin Log Out ? ",
        () => {
          POST(
            "/api/logout",
            {},
            (data) => {
              if (data.status) {
                router.navigateTo("/login");
                // ubah navbar
                morphAuthBtn({ status: "error" });
              } else {
                alert("Logout gagal: " + data.message);
              }
            },
            () => {}
          );
        },
        () => {}
      );
    });
    InitBalance();
    const profile = document.getElementById("btn-profile");
    profile.addEventListener("click", () => {
      router.navigateTo("/profile");
    });
    chart.addEventListener("click", () => {
      router.navigateTo("/cart");
    });
    orderHist.addEventListener("click", () => {
      router.navigateTo("/order-history");
    });
  } else {
    // blom login
    btn.innerHTML = ` <a href="/login"><button class="btn btn-login">Login</button></a>
        <a href="/register "><button class="btn btn-register">Register</button></a>`;
    chart.innerHTML = "";
    balance.innerHTML = "";
    orderHist.innerHTML = "";
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
let topupActive = false;

export function InitNavbar() {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const logo = document.getElementById("navbar-logo");
  const filterBtn = document.getElementById("filter-btn");
  const topupBtn = document.getElementById("balance-btn");
  const filterContainer = document.getElementById("filter-id");
  const balanceContainer = document.getElementById("balance-id");

  searchBtn.addEventListener("click", () => {
    HandleSearchNavbar(searchInput.value.trim());
  });

  logo.addEventListener("click", () => {
    router.navigateTo("/home");
  });

  searchInput.addEventListener("input", (e) => {
    showSuggestion(e.target.value);
  });

  // --- FILTER ---
  filterBtn.addEventListener("click", () => {
    if (topupActive) {
      RemoveComponent("balance-id");
      topupActive = false;
      balanceContainer.classList.remove("active");
    }
    if (!filterActive) {
      LoadComponent("filter-id", "/components/home/filter.html", () => {
        const applyBtn = document.getElementById("applyFilterBtn");
        const categoryCheckboxes = document.querySelectorAll(
          ".filter-checkboxes input[type='checkbox']"
        );
        const minPriceInput = document.getElementById("minPrice");
        const maxPriceInput = document.getElementById("maxPrice");

        applyBtn.addEventListener("click", () => {
          const selectedCategories = Array.from(categoryCheckboxes)
            .filter((cb) => cb.checked)
            .map((cb) => cb.value);

          const minPrice = minPriceInput.value
            ? parseFloat(minPriceInput.value)
            : null;
          const maxPrice = maxPriceInput.value
            ? parseFloat(maxPriceInput.value)
            : null;

          const filterObj = {
            categories: selectedCategories,
            minPrice,
            maxPrice,
          };

          const filterParam = encodeURIComponent(JSON.stringify(filterObj));
          router.navigateTo("/home?filter=" + filterParam);
        });
      });
      filterActive = true;
      filterContainer.classList.add("active");
    } else {
      RemoveComponent("filter-id");
      filterActive = false;
      filterContainer.classList.remove("active");
    }
  });

  // --- TOP UP BALANCE ---
  topupBtn?.addEventListener("click", () => {
    if (filterActive) {
      RemoveComponent("filter-id");
      filterActive = false;
      filterContainer.classList.remove("active");
    }
    if (!topupActive) {
      LoadComponent("balance-id", "/components/general/balance.html", () => {
        const topupInput = document.getElementById("topupAmount");
        const submitBtn = document.getElementById("topupBtn");

        submitBtn.addEventListener("click", (e) => {
          const amount = parseFloat(topupInput.value);
          if (!amount || amount <= 0) {
            e.preventDefault();
            alert("Masukkan nominal top up yang valid!");
            return;
          } else {
            HandleTopUp(amount);
          }
        });
      });
      topupActive = true;
      balanceContainer.classList.add("active");
    } else {
      RemoveComponent("balance-id");

      topupActive = false;
      balanceContainer.classList.remove("active");
    }
  });

  // CEK USER DAH LOGIN APA BELUM
  GET("/api/auth", {}, morphAuthBtn, () => {});
}
