import { router } from "../../../../app.js";
import { DELETE, GET } from "../../../api/api.js";
import { renderSkeleton } from "../../../util/component_loader.js";
import { showModalConfirmation } from "../../general/modal.js";
import { renderToast } from "../../general/toast.js";

let allProducts = [];
let productCounts = 0;
let productCategory = [];
let currentPage = 1;
let itemsPerPage = 4;
let currentCategory = "";
let currentSort = 0;
let currentSearch = "";
let debounceTimer;

function renderFilterDropdown(data) {
  const filterContainer = document.getElementById("category-filter");
  if (!filterContainer) return;

  console.log("Category Data for Filter:", data);
  let categories = [];

  categories.push({ value: "", label: "All Categories" });

  if (data.status === "success" && Array.isArray(data.data)) {
    data.data.forEach((category) => {
      categories.push({
        value: category.name,
        label: category.name,
      });
      productCategory.push(category.name);
    });
  }

  const optionsHtml = categories
    .map(
      (cat) => `
    <option value="${cat.value}">
      ${cat.label}
    </option>
  `
    )
    .join("");

  filterContainer.innerHTML = optionsHtml;
}

function renderFilteredProducts() {
  const container = document.getElementById("pg1");
  if (!container) return;

  const filteredProducts = allProducts;
  const totalPages = Math.ceil(productCounts / itemsPerPage);
  renderPaginationButtons(totalPages);

  container.innerHTML = "";
  if (filteredProducts.length === 0) {
    container.innerHTML = "<p class='no-orders'>Belum ada produk.</p>";
    const paginationInfoEmpty = document.querySelector(".pagination-info");
    if (paginationInfoEmpty) {
      paginationInfoEmpty.textContent = "Menampilkan 0 dari 0 product";
    }
    return;
  } else {
    let productHtml = "";
    filteredProducts.forEach((product) => {
      productHtml += renderProductCard(product, container);
    });
  }

  const paginationInfo = document.querySelector(".pagination-info");
  if (paginationInfo) {
    paginationInfo.textContent = `Menampilkan ${filteredProducts.length} dari ${productCounts} produk`;
  }
}

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

function renderProductCard(product, container) {
  const imageUrl =
    product.main_image_path && product.main_image_path !== ""
      ? `/api/image?file=${product.main_image_path}`
      : `https://picsum.photos/200/200?random=${product.product_id}`;

  const productName = product.product_name || "Nama Produk";
  const productStock = product.stock !== undefined ? product.stock : "N/A";
  const productPrice = product.price
    ? parseInt(product.price).toLocaleString("id-ID")
    : "0";

  const cardElement = document.createElement("article");
  cardElement.className = "product-card";

  const categoryPlaceholderId = `category-for-product-${product.product_id}`;

  cardElement.innerHTML = `
    <div class="card-contents">
      <div class="card-image">
        <img src="${imageUrl}" alt="${productName}" width=150 height=150>
      </div>
      <div class="card-description">
          <h2 class="product-name">${productName}</h2>
          <p class="product-info">Stok: ${productStock}</p>
          <p class="product-info">Harga: Rp ${productPrice}</p>
          
          <div class="categories-container" id="${categoryPlaceholderId}">
            <span class="tag">Loading kategori...</span>
          </div>
      </div>
    </div>
    <div class="card-actions">
        <button class="btn-delete" data-id="${product.product_id}">Delete</button>
        <button class="btn-edit" data-id="${product.product_id}">Edit</button>
    </div>
  `;

  const onCategorySuccess = (categories) => {
    const categoryContainer = cardElement.querySelector(
      `#${categoryPlaceholderId}`
    );
    if (!categoryContainer) return;

    if (categories.status === "success" && Array.isArray(categories.data)) {
      if (categories.data.length === 0) {
        categoryContainer.innerHTML = "<span class='tag'>Uncategorized</span>";
      } else {
        const tags = categories.data
          .map((cat) => `<span class="tag">${cat.category_name}</span>`)
          .join(" ");
        categoryContainer.innerHTML = `<span>kategori:</span> ${tags}`;
      }
    } else {
      onCategoryError();
    }
  };

  const onCategoryError = () => {
    const categoryContainer = cardElement.querySelector(
      `#${categoryPlaceholderId}`
    );
    if (categoryContainer) {
      categoryContainer.innerHTML =
        "<span class='tag error'>Gagal memuat kategori</span>";
    }
  };

  GET(
    "/api/category",
    { product_id: product.product_id },
    onCategorySuccess,
    onCategoryError
  );

  cardElement.querySelector(".btn-edit").addEventListener("click", () => {
    router.navigateTo("/seller/products/edit?product_id=" + product.product_id);
  });

  cardElement.querySelector(".btn-delete").addEventListener("click", () => {
    showModalConfirmation("Yakin menghapus product?", () => {
      DELETE(
        "/api/product",
        { product_id: product.product_id },
        (data) => {
          if (data.status == "success") {
            renderToast("Berhasil Menghapus Produk !", "success");
            fetchProducts();
          } else {
            renderToast("Gagal Menghapus Product !", "error");
          }
        },
        () => {
          renderToast("Gagal Menghapus Product", "info");
        }
      );
    });
  });

  container.appendChild(cardElement);
}

function LoadSellerProductData(data) {
  const container = document.getElementById("pg1");
  const footer = document.getElementById("pagination-container");
  if (!container) return;

  console.log("Seller Product Data:", data);

  if (data.status === "success" && Array.isArray(data.data)) {
    allProducts = data.data;
    productCounts = data.count;

    if (productCounts === 0) {
      container.innerHTML = `
            <div class="no-products-container">
              <div class="no-products-image-circle">
                <img src="/img/unauthorized.png" alt="Tidak ada produk">
              </div>
              <p class="no-products-message">Belum terdapat produk pada kategori ini</p>
              <a class="btn-add-first" href="/seller/products/add">Tambah Produk Pertama +</a>
            </div>
      `;
      footer.style.display = "none";
      return;
    }

    footer.style.display = "flex";
    renderFilteredProducts();
  }
}

function SellerProductErr(err) {
  if (!err) {
    return;
  }

  const container = document.getElementById("pg1");
  if (!container) return;

  container.innerHTML =
    "<p class='error-message'>Error loading order history. Please try again later.</p>";
}

function CategoryProductErr(err) {
  if (!err) {
    return;
  }

  const container = document.getElementById("pg1");
  if (!container) return;

  container.innerHTML =
    "<p class='error-message'>Error loading category data. Please try again later.</p>";
}

function fetchProducts() {
  renderSkeleton("pg1", 2);
  const params = {};

  const filters = {};
  if (currentCategory) {
    filters.categories = [currentCategory];
  }

  if (Object.keys(filters).length > 0) {
    params.filter = JSON.stringify(filters);
  }

  if (currentSearch) {
    params.title = currentSearch;
  }

  if (currentPage) {
    params.page = currentPage;
    params.limit = itemsPerPage;
  }

  if (currentSort) {
    params.sort = currentSort;
  }

  console.log("Fetching products with params:", params);

  GET("/api/product", params, LoadSellerProductData, SellerProductErr);
}

export async function InitSellerProductPage() {
  // Reset filter
  currentCategory = "";
  allProducts = [];
  currentSearch = "";
  currentPage = 1;
  itemsPerPage = 4;

  fetchProducts();
  GET("/api/category", {}, renderFilterDropdown, CategoryProductErr);

  const itemsPerPageSelect = document.getElementById("items-per-page-select");
  if (itemsPerPageSelect) {
    itemsPerPageSelect.addEventListener("change", (e) => {
      itemsPerPage = parseInt(e.target.value, 10);
      console.log("Items per page changed to:", itemsPerPage);
      currentPage = 1;
      fetchProducts();
    });
  }

  const sortSelect = document.getElementById("sort-filter");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      fetchProducts();
    });
  }

  const categorySelect = document.getElementById("category-filter");
  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      currentCategory = e.target.value;
      console.log("Category filter changed to:", currentCategory);
      currentPage = 1;
      fetchProducts();
    });
  }

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        console.log("Debounce selesai, mencari:", e.target.value);

        currentSearch = e.target.value;
        currentPage = 1;
        fetchProducts();
      }, 400);
    });
  }

  const addFirstButton = document.querySelector(".btn-add-first");
  if (addFirstButton) {
    addFirstButton.addEventListener("click", () => {
      router.navigateTo("/seller/products/add");
    });
  }
}
