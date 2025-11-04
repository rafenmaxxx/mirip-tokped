import { LoadComponent, renderSkeleton } from "../../util/component_loader.js";
import { GET } from "../../api/api.js";
import { router } from "../../../app.js";
import { initHeroSlider } from "../slider.js";

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
  const footer = document.querySelector(".pagination-footer");
  footer?.classList.add("visible");
}

function LoadProduct(data) {
  const container = document.getElementById("product-data");
  const footer = document.getElementById("pagination-container");
  if (!container) return;

  console.log(data);

  if (data.status !== "success") {
    container.innerHTML = `<p>Gagal memuat data produk.</p>`;
    return;
  }

  const totalProducts = data.count || 0;
  if (totalProducts === 0) {
    container.innerHTML = `
              <div class="no-products-container">
                <div class="no-products-image-circle">
                  <img src="/img/unauthorized.png" alt="Tidak ada produk">
                </div>
                <p class="no-products-message">Tidak terdapat produk </p>
              </div>
        `;
    footer.style.display = "none";
    return;
  }

  if (data.status === "success" && Array.isArray(data.data)) {
    footer.style.display = "flex";

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

        let stockText = "";
        let productCardClass = "product_card";
        let productImageClass = "product_image";
        let productNameClass = "product_name";
        let productPriceClass = "product_price";
        let stockClass = "product_stock";

        if (p.stock === 0) {
          stockText = "Habis";
          productCardClass += " out_of_stock";
          productImageClass += " out_of_stock";
          productNameClass += " out_of_stock";
          productPriceClass += " out_of_stock";
          stockClass += " out_of_stock";
        } else {
          stockText = `Stok : ${p.stock}`;
        }
        return `
                <div class="${productCardClass}">
                  <div class="${productImageClass}">
                    <img src="${imageUrl}" alt="${p.product_name}">
                  </div>
                  <div class="product_desc">
                    <div class="${productNameClass}">${p.product_name}</div>
                    <div class="${productPriceClass}">${price}</div>
                    <div class="${stockClass}">${stockText}</div>
                    <div class="product_store">${p.store_name}</div>
                  </div>
                </div>
              `;
      })
      .join("");
    container.innerHTML = html;
    if (html == "") {
      container.innerHTML = `
            <div class="no-products-container">
              <div class="no-products-image-circle">
                <img src="/img/unauthorized.png" alt="Tidak ada produk">
              </div>
              <p class="no-products-message">Belum terdapat produk dengan nama ini :(</p>
              <p class="no-products-message-2">Cari produk lain, yuk!</p>
              <a href="/" class="btn-add-first">kembali ke home</a>
              </div>`;
      const el = document.getElementById("catalog-label");
      el.style.display = "none";
    }

    const cards = document.querySelectorAll(".product_card");
    cards.forEach((c, index) => {
      c.addEventListener("click", () => {
        router.navigateTo("/product-detail?id=" + products[index].product_id);
      });
    });
  } else {
    container.innerHTML = data.message || "No data available";
  }
}

function ProductErr(err) {
  if (err) {
    const container = document.getElementById("product-data");
    if (!container) return;
    container.innerHTML = "Product Fetch Error :D";
  }
}

function ChangeCatalogLabel(string) {
  const el = document.getElementById("catalog-label");
  if (!el) {
    console.warn("catalog-label tidak ditemukan!");
    return;
  }
  el.innerHTML = string;
}

function fetchProducts() {
  const container = document.getElementById("product-data");
  const footer = document.getElementById("pagination-container");

  if (footer) {
    footer.style.display = "none";
  }
  let param = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(param);

  params.page = currentPage;
  params.limit = itemsPerPage;

  console.log("Fetching products with params:", params);
  GET("/api/product", params, LoadProduct, ProductErr);

  if (!params.hasOwnProperty("search") && !params.hasOwnProperty("filter")) {
    ChangeCatalogLabel("Products You Might Want");
  } else {
    const banner = document.getElementById("slider");
    banner.innerHTML = "";
    ChangeCatalogLabel("Products Result");
  }
}

export function LoadHome() {
  currentPage = 1;
  itemsPerPage = 4;
  renderSkeleton("#product-data", 4);
  renderSkeleton("#slider", 1, "banner");
  fetchProducts();
  const slider = document.getElementById("slider");
  slider.innerHTML = `<div class="hero-slider" id="slider-id">
            <div class="hero-slider__track">
                <div class="hero-slide">
                    <img src="img/slide-1.jpeg" alt="Slide" width="1028px" height="500" />
                    <div class="hero-slide__info">
                        <h2>TUBES WBD UHUY</h2>
                        <p>Alfian, Joel, dan Max</p>
                    </div>
                </div>
            </div>
        </div>`;
  const itemsPerPageSelect = document.getElementById("items-per-page-select");
  if (itemsPerPageSelect) {
    itemsPerPageSelect.addEventListener("change", (e) => {
      itemsPerPage = parseInt(e.target.value, 10);
      console.log("Items per page changed to:", itemsPerPage);
      currentPage = 1;
      fetchProducts();
    });
  }
}
