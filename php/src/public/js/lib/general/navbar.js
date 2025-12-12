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

async function checkChatFeatureFlag(userId) {
  try {
    if (!userId) {
      return { isAllowed: true, reason: null };
    }

    const flagResponse = await fetch(
      `/node/api/flags/chat/allowed/${userId}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const flagData = await flagResponse.json();
    const isAllowed = flagData.data?.isAllowed ?? flagData.isAllowed ?? true;
    const reason = flagData.data?.reason || flagData.reason;

    return { isAllowed, reason };
  } catch (error) {
    console.error("Error checking chat access:", error);
    return { isAllowed: true, reason: null };
  }
}

async function checkAuctionFeatureFlag(userId) {
  try {
    if (!userId) {
      return { isAllowed: true, reason: null };
    }

    const flagResponse = await fetch(
      `/node/api/flags/auction/allowed/${userId}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const flagData = await flagResponse.json();
    const isAllowed = flagData.data?.isAllowed ?? flagData.isAllowed ?? true;
    const reason = flagData.data?.reason || flagData.reason;

    return { isAllowed, reason };
  } catch (error) {
    console.error("Error checking auction access:", error);
    return { isAllowed: true, reason: null };
  }
}

async function checkCheckoutFeatureFlag(userId) {
  try {
    if (!userId) {
      return { isAllowed: true, reason: null };
    }

    const flagResponse = await fetch(
      `/node/api/flags/checkout/allowed/${userId}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const flagData = await flagResponse.json();
    const isAllowed = flagData.data?.isAllowed ?? flagData.isAllowed ?? true;
    const reason = flagData.data?.reason || flagData.reason;

    return { isAllowed, reason };
  } catch (error) {
    console.error("Error checking checkout access:", error);
    return { isAllowed: true, reason: null };
  }
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
        window.dispatchEvent(new CustomEvent("balanceUpdated"));
      } else {
        renderToast("Gagal Top Up", "error");
      }
    },
    () => {}
  );
}

export function InitDropdown() {
  const dropdown = document.getElementById("userDropdown");
  const toggle = document.getElementById("dropdownToggle");
  const content = document.getElementById("dropdownContent");

  if (!dropdown || !toggle || !content) return;

  // Toggle dropdown
  toggle.addEventListener("click", (e) => {
    e.stopPropagation(); // agar klik tidak menutup langsung
    dropdown.classList.toggle("show");
  });

  // Klik di luar dropdown → close
  document.addEventListener("click", () => {
    dropdown.classList.remove("show");
  });

  // Contoh event listener tombol
  document.getElementById("btn-profile").addEventListener("click", () => {
    router.navigateTo("/profile");
    dropdown.classList.remove("show");
  });

  document.getElementById("btn-orders").addEventListener("click", () => {
    router.navigateTo("/order-history");
    dropdown.classList.remove("show");
  });

  document.getElementById("btn-logout").addEventListener("click", () => {
    console.log("Logout");
    dropdown.classList.remove("show");
  });
}

async function morphAuthBtn(data) {
  const btn = document.getElementById("navbar-auth-btn");
  const chart = document.getElementById("navbar-chart");
  const balance = document.getElementById("balance-btn");

  const search = document.getElementById("navbar__search");
  const filter = document.getElementById("filter-btn");
  const menu = document.getElementById("navbar-menu");

  const chat = document.getElementById("for-chat");
  const auction = document.getElementById("for-auction");

  // sudah login
  if (data.status == "success") {
    // Check feature flags using user_id from data
    const userId = data.data?.user_id || data.data?.id;
    const chatAccess = await checkChatFeatureFlag(userId);
    const auctionAccess = await checkAuctionFeatureFlag(userId);
    const checkoutAccess = await checkCheckoutFeatureFlag(userId);

    // responsive untuk buyer mobile
    const viewportWidth = window.innerWidth;
    if (data.data.role == "BUYER" && viewportWidth <= 480) {
      document.getElementById("balance-n").innerHTML = "";
      document.getElementById("userDropdown").innerHTML = "";
      btn.innerHTML = 
        `<button class="btn btn-login" id="btn-profile">Profile</button>
         <button class="btn btn-login" id="btn-orders">Order History</button>
         <button class="btn btn-login" id="btn-logout">Logout</button>`;
      
      // Hide buttons if disabled
      if (chatAccess.isAllowed) {
        chat.innerHTML = `<button class="btn btn-login" id="btn-chat-navbar">Chat</button>`;
      } else {
        chat.innerHTML = "";
      }
      
      if (auctionAccess.isAllowed) {
        auction.innerHTML = `<button class="btn btn-login" id="btn-auction">Auction</button>`;
      } else {
        auction.innerHTML = "";
      }

      document.getElementById("btn-profile").addEventListener("click", () => {
        router.navigateTo("/profile");
        dropdown.classList.remove("show");
      });
      document.getElementById("btn-orders").addEventListener("click", () => {
        router.navigateTo("/order-history");
        dropdown.classList.remove("show");
      });

      document.getElementById("btn-logout").addEventListener("click", () => {
        console.log("Logout");
        dropdown.classList.remove("show");
      });

      document.getElementById("btn-profile").addEventListener("click", () => {
        router.navigateTo("/profile");
      });

      document.getElementById("btn-orders").addEventListener("click", () => {
        router.navigateTo("/order-history");
      });

      document.getElementById("btn-logout").addEventListener("click", () => {
        console.log("Logout");
      });

      if (checkoutAccess.isAllowed) {
        chart.addEventListener("click", (e) => {
          e.stopPropagation();
          router.navigateTo("/cart");
        });
      } else {
        chart.style.display = "none";
      }
      
      InitBalance();
      InitCountCart();
    
      // buyer desktop
    } else if (data.data.role == "BUYER") {
      InitDropdown();
      
      // Hide buttons if disabled
      if (chatAccess.isAllowed) {
        chat.innerHTML = `<button class="btn btn-login" id="btn-chat-navbar">Chat</button>`;
      } else {
        chat.innerHTML = "";
      }
      
      if (auctionAccess.isAllowed) {
        auction.innerHTML = `<button class="btn btn-login" id="btn-auction">Auction</button>`;
      } else {
        auction.innerHTML = "";
      }
      
      if (checkoutAccess.isAllowed) {
        chart.addEventListener("click", (e) => {
          e.stopPropagation();
          menu.classList.remove("is-active");
          router.navigateTo("/cart");
        });
      } else {
        chart.style.display = "none";
      }
      
      document.getElementById("balance-n").innerHTML = "";
      document.getElementById("dropdownToggle").innerHTML = data.data.name;
      InitBalance();
      InitCountCart();
    
      // seller
    } else if (data.data.role == "SELLER") {
      document.getElementById("userDropdown").innerHTML = "";
      btn.innerHTML = 
      `<button class="btn btn-login" id="btn-home">Dashboard</button>
       <button class="btn btn-login" id="btn-profile">Profile</button>
       <button class="btn btn-register" id="btn-logout">Log Out</button>`;
      chart.innerHTML = `<button class="btn btn-login" id="chartBtn">Produk</button>`;
      
      // Hide buttons if disabled
      if (chatAccess.isAllowed) {
        chat.innerHTML = `<button class="btn btn-login" id="btn-chat-navbar">Chat</button>`;
      } else {
        chat.innerHTML = "";
      }
      
      if (auctionAccess.isAllowed) {
        auction.innerHTML = `<button class="btn btn-login" id="btn-auction">Auction</button>`;
      } else {
        auction.innerHTML = "";
      }

      document.getElementById("for-order").innerHTML = 
      `<div id="order-hist"> <button class="btn btn-login" id="chartBtn">Order</button></div>`;
    
      chart.addEventListener("click", () => {
        menu.classList.remove("is-active");
        router.navigateTo("/seller/products");
      });

      document.getElementById("btn-home").addEventListener("click", () => {
        router.navigateTo("/seller");
      });

      const orderHist = document.getElementById("order-hist");
      orderHist.addEventListener("click", () => {
        menu.classList.remove("is-active");
        router.navigateTo("/seller/orders");
      });
      balance.innerHTML = ``;
      search.innerHTML = "";
      filter.innerHTML = "";
    }

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
    if (profile) {
      profile.addEventListener("click", () => {
        menu.classList.remove("is-active");
        router.navigateTo("/profile");
      });
    }
    
    const chatBtn = document.getElementById("btn-chat-navbar");
    if (chatBtn) {
      chatBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = "/react/chat";
      });
    }

    const auctionBtn = document.getElementById("btn-auction");
    if (auctionBtn) {
      auctionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        
        // Redirect berdasarkan role
        if (data.data.role === "BUYER") {
          window.location.href = "/react/auction";
        } else if (data.data.role === "SELLER") {
          window.location.href = "/react/auction-manage";
        }
      });
    }

  // blom login
  } else {

    btn.innerHTML = 
    `<a href="/login"><button class="btn btn-login">Login</button></a>
     <a href="/register "><button class="btn btn-register">Register</button></a>`;
    chart.innerHTML = "";
    balance.innerHTML = "";
    document.getElementById("balance-n").innerHTML = "";
    document.getElementById("userDropdown").innerHTML = "";
    document.getElementById("for-chat").innerHTML = "";
    document.getElementById("for-auction").innerHTML = `<button class="btn btn-login" id="btn-auction">Auction</button>`;

    const auctionBtn = document.getElementById("btn-auction");
    auctionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = "/react/auction";
    });
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
          if (!/^\d+$/.test(topupInput.value)) {
            renderToast("Masukkan nominal Top Up yang valid!", "error");
            return;
          }
          const amount = parseInt(topupInput.value);
          if (!amount || amount <= 0) {
            e.preventDefault();
            renderToast("Masukkan nominal Top Up yang valid!", "error");
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
