import { GET } from "../../api/api.js";
import { POST } from "../../api/api.js";
import { router } from "../../../app.js";
import { renderToast } from "../general/toast.js";
import { renderSkeleton } from "../../util/component_loader.js";

let currentPage = 1;
let itemsPerPage = 4;

function renderPaginationButtons(totalPages) {
  const navContainer = document.getElementById("pagination-nav-buttons");
  if (!navContainer) return;

  navContainer.innerHTML = "";

  const createPageButton = (page) => {
    const pageButton = document.createElement("a");
    pageButton.href = "#";
    pageButton.textContent = page;
    pageButton.dataset.page = page;

    if (page === currentPage) {
      pageButton.classList.add("active");
    }

    pageButton.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = page;
      fetchProducts();
    });

    return pageButton;
  };

  const createEllipsis = () => {
    const ellipsis = document.createElement("span");
    ellipsis.textContent = "...";
    return ellipsis;
  };

  const pagesToShow = new Set();
  const siblingCount = 1;

  pagesToShow.add(1);
  const startPage = Math.max(2, currentPage - siblingCount);
  const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

  for (let i = startPage; i <= endPage; i++) {
    pagesToShow.add(i);
  }

  pagesToShow.add(totalPages);

  let lastPage = 0;
  pagesToShow.forEach((page) => {
    if (lastPage !== 0 && page - lastPage > 1) {
      navContainer.appendChild(createEllipsis());
    }

    navContainer.appendChild(createPageButton(page));
    lastPage = page;
  });
  const footerN = document.querySelector(".pagination-footer");
  footerN?.classList.add("visible");
}

function morphProductBtn(data) {
  if (data.status == "success" && data.data.role == "BUYER") {
    const buttons = document.querySelectorAll(".product_buttons");
    buttons.forEach((btnContainer, index) => {
      const product_id = btnContainer.getAttribute("product-id");
      const html = `
        <button class="btn btn-cart" product-id="${product_id}">Add to Cart</button>
      `;
      btnContainer.innerHTML = html;
    });

    const cartButtons = document.querySelectorAll(".btn-cart");
    cartButtons.forEach((btn, index) => {
      btn.addEventListener("click", (e) => {
        const product_id = btn.getAttribute("product-id");

        e.stopPropagation();
        POST(
          "/api/cart",
          { action: "add", product_id: product_id, buyer_id: data.data.id },
          (response) => {
            if (response.status === "success") {
              renderToast(
                "Berhasil menambahkan produk ke dalam cart",
                "success"
              );
            } else {
              renderToast("Gagal menambahkan produk ke dalam cart", "success");
            }
          },
          () => {}
        );
      });
    });
  }
}

function LoadProduct(data) {
  const container = document.getElementById("product-data");
  if (!container) return;

  const totalProducts = data.count || 0;
  if (data.status === "success" && Array.isArray(data.data)) {
    const totalPages = Math.ceil(totalProducts / itemsPerPage);
    renderPaginationButtons(totalPages);

    const paginationInfo = document.querySelector(".pagination-info");
    if (paginationInfo) {
      paginationInfo.textContent = `Menampilkan ${data.data.length} dari ${totalProducts} produk`;
    }

    const products = data.data;

    const html = products
      .map((p, index) => {
        const price = p.price.toLocaleString("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        });

        const imageUrl =
          p.main_image_path && p.main_image_path !== ""
            ? `/api/image?file=${p.main_image_path}`
            : `https://picsum.photos/200/200?random=${index + 1}`;

        return `
                <div class="product_card" >
                  <div class="product_image">
                    <img src="${imageUrl}" alt="${p.product_name}">
                  </div>
                  <div class="product_desc">
                    <div class="product_name">${p.product_name}</div>
                    <div class="product_price">${price}</div>
                    <div class="product_store">Toko ${p.store_id}</div>
                    <div class="product_buttons" product-id="${p.product_id}"></div>
                  </div>
                </div>
              `;
      })
      .join("");
    container.innerHTML = html;
    if (html == "") {
      container.innerHTML = "0 Product";
    }

    const cards = document.querySelectorAll(".product_card");
    cards.forEach((c, index) => {
      c.addEventListener("click", () => {
        router.navigateTo("/product-detail?id=" + products[index].product_id);
      });
    });

    GET("/api/auth", {}, morphProductBtn, () => {});
  } else {
    container.innerHTML = data.message || "No data available";
  }
}

function LoadProfileStore(data) {
  const container = document.getElementById("store-profile");
  if (!container) return;

  if (data.status === "success" && data.data) {
    const store = data.data;

    const imageUrl =
      store.store_logo_path && store.store_logo_path !== ""
        ? `/api/image?file=${store.store_logo_path}`
        : `https://picsum.photos/200/200?random=${index + 1}`;

    const html = `
          <div class="store_card">
            <div class="store_image">
              <img src="${imageUrl}" alt="${store.store_name}" width=150 height=150>
            </div>
            <div class="store_desc">
              <div class="store_name">${store.store_name}</div>
              <div class="store_description">${store.store_description}</div>
            </div>
          </div>
      `;

    container.innerHTML = html;
  } else {
    container.innerHTML = data.message || "No data available";
  }
}

function ProfileErr(err) {
  if (err) {
    const storeProfileContainer = document.getElementById("store-profile");
    if (!storeProfileContainer) return;
    storeProfileContainer.innerHTML = "Store Profile Fetch Error :D";
  }
}

function ProductErr(err) {
  if (err) {
    const container = document.getElementById("product-data");
    if (!container) return;
    container.innerHTML = "Product Fetch Error :D";
  }
}

function fetchProducts() {
  let param = new URLSearchParams(window.location.search);
  const param_id = param.get("store_id");

  if (!param_id) {
    router.navigateTo("/unauthorized");
  } else {
    GET(
      "/api/detail_store",
      { store_id: param_id },
      LoadProfileStore,
      ProfileErr
    );

    GET(
      "/api/product",
      { store_id: param_id, page: currentPage, limit: itemsPerPage },
      LoadProduct,
      ProductErr
    );
  }
}
export async function InitDetailStore() {
  currentPage = 1;
  itemsPerPage = 4;

  fetchProducts();

  const itemsPerPageSelect = document.getElementById("items-per-page-select");
  if (itemsPerPageSelect) {
    itemsPerPageSelect.addEventListener("change", (e) => {
      itemsPerPage = parseInt(e.target.value, 10);

      currentPage = 1;
      fetchProducts();
    });
  }
}
