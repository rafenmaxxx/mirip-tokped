import { router } from "../../../app.js";
import { GET, POST } from "../../api/api.js";
import {
  ChangeInnerHtmlById,
  LoadComponent,
  RemoveComponent,
} from "../../util/component_loader.js";
import { showModalConfirmation } from "./modal.js";
import { renderToast } from "./toast.js";

let debounceTimer = null;
let filterActive = false;

function HandleSearchNavbar(param) {
  router.navigateTo("/home?search=" + param);
}

export function InitCountCart() {
  GET(
    "/api/cart",
    { action: "get_count" },
    (data) => {
      const res = data.data;
      ChangeInnerHtmlById(
        "userCart",
        `<span class="badge">${res.total_cart}</span>`
      );
    },
    () => {}
  );
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
        renderToast("Sukses Top Up", "success");
        InitBalance();
      } else {
        renderToast("Gagal Top Up", "error");
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
  const search = document.getElementById("navbar__search");
  const filter = document.getElementById("filter-btn");
  const menu = document.getElementById("navbar-menu");

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
                renderToast("Berhasil Log Out", "success");
                morphAuthBtn({ status: "error" });
                router.navigateTo("/login");
              } else {
                renderToast("Berhasil Log Out", "success");
              }
            },
            () => {}
          );
        },
        () => {}
      );
    });

    const profile = document.getElementById("btn-profile");
    profile.addEventListener("click", () => {
      menu.classList.remove("is-active");
      router.navigateTo("/profile");
    });
    if (data.data.role == "BUYER") {
      chart.addEventListener("click", () => {
        menu.classList.remove("is-active");
        router.navigateTo("/cart");
      });
      orderHist.addEventListener("click", () => {
        menu.classList.remove("is-active");
        router.navigateTo("/order-history");
      });
      document.getElementById("balance-n").innerHTML = "";
      InitBalance();
      InitCountCart();
    }
    if (data.data.role == "SELLER") {
      chart.innerHTML = `<button class="btn btn-login" id="chartBtn">Produk</button>`;

      orderHist.innerHTML = `<button class="btn btn-login" id="chartBtn">Order</button>`;
      chart.addEventListener("click", () => {
        menu.classList.remove("is-active");
        router.navigateTo("/seller/products");
      });
      orderHist.addEventListener("click", () => {
        menu.classList.remove("is-active");
        router.navigateTo("/seller/orders");
      });
      balance.innerHTML = ``;
      InitBalance();
      search.innerHTML = "";
      filter.innerHTML = "";
    }
  } else {
    // blom login
    btn.innerHTML = ` <a href="/login"><button class="btn btn-login">Login</button></a>
        <a href="/register "><button class="btn btn-register">Register</button></a>`;
    chart.innerHTML = "";
    balance.innerHTML = "";
    orderHist.innerHTML = "";
    document.getElementById("balance-n").innerHTML = "";
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
  const toggleBtn = document.getElementById("navbar-toggle");
  const menu = document.getElementById("navbar-menu");

  if (toggleBtn && menu) {
    toggleBtn.addEventListener("click", () => {
      menu.classList.toggle("is-active");
      balanceContainer.classList.remove("active");
      filterContainer.classList.remove("active");
    });
  }

  searchBtn.addEventListener("click", () => {
    HandleSearchNavbar(searchInput.value.trim());
    menu.classList.remove("is-active");
  });

  logo.addEventListener("click", () => {
    menu.classList.remove("is-active");
    router.navigateTo("/home");
  });

  searchInput.addEventListener("input", (e) => {
    menu.classList.remove("is-active");
    showSuggestion(e.target.value);
  });

  // --- FILTER ---
  filterBtn.addEventListener("click", () => {
    menu.classList.remove("is-active");
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
          RemoveComponent("filter-id");
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
    menu.classList.remove("is-active");
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
            renderToast("Masukkan nominal Top Up yang valid!", "error");
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
