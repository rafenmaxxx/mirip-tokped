import { router } from "../../../../app.js";
import { DELETE, GET } from "../../../api/api.js";
import { showModalConfirmation } from "../../general/modal.js";
import { renderToast } from "../../general/toast.js";

let allProducts = [];
let productCategory = [];
let currentPage = 1;
let itemsPerPage = 2;
let currentCategory = "";
let currentSort = "none";

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

  switch (currentSort) {
    case "harga-asc":
      filteredProducts.sort((a, b) => a.price - b.price);
      console.log("Sorted Products by harga-asc:", filteredProducts);
      break;
    case "harga-desc":
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case "nama-asc":
      filteredProducts.sort((a, b) =>
        a.product_name.localeCompare(b.product_name)
      );
      break;
    case "nama-desc":
      filteredProducts.sort((a, b) =>
        b.product_name.localeCompare(a.product_name)
      );
      break;
    case "stok-asc":
      filteredProducts.sort((a, b) => a.stock - b.stock);
      break;
    case "stok-desc":
      filteredProducts.sort((a, b) => b.stock - a.stock);
      break;
  }

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  renderPaginationButtons(totalPages);

  container.innerHTML = "";
  if (paginatedProducts.length === 0) {
    container.innerHTML = "<p class='no-orders'>Belum ada produk.</p>";
    const paginationInfoEmpty = document.querySelector(".pagination-info");
    if (paginationInfoEmpty) {
      paginationInfoEmpty.textContent = "Menampilkan 0 dari 0 product";
    }
    return;
  } else {
    paginatedProducts.forEach((product) => {
      renderProductCard(product, container);
    });
  }

  const paginationInfo = document.querySelector(".pagination-info");
  if (paginationInfo) {
    paginationInfo.textContent = `Menampilkan ${paginatedProducts.length} dari ${allProducts.length} product`;
  }
}

function renderPaginationButtons(totalPages) {
  const navContainer = document.getElementById("pagination-nav-buttons");
  if (!navContainer) return;

  navContainer.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("a");
    pageButton.href = "#";
    pageButton.textContent = i;
    pageButton.dataset.page = i;

    if (i === currentPage) {
      pageButton.classList.add("active");
    }

    pageButton.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = i;
      renderFilteredProducts();
    });

    navContainer.appendChild(pageButton);
  }
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
        <img src="${imageUrl}" alt="${productName}">
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
    showModalConfirmation("Yaking menghapus product?", () => {
      DELETE(
        "/api/product",
        { product_id: product.product_id },
        (data) => {
          if (data.status == "success") {
            renderToast("Berhasil Menghapus Produk !", "success");
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

    if (allProducts.length === 0) {
      container.innerHTML = `
            <div class="no-products-container">
              <div class="no-products-image-circle">
                <img src="/img/unauthorized.png" alt="Tidak ada produk">
              </div>
              <p class="no-products-message">Belum terdapat produk pada kategori ini</p>
              <a href="/seller/products/add" class="btn-add-first">tambah produk pertama +</a>
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
  const params = {};

  const filters = {};
  if (currentCategory) {
    filters.categories = [currentCategory];
  }

  if (Object.keys(filters).length > 0) {
    params.filter = JSON.stringify(filters);
  }

  console.log("Fetching products with params:", params);

  GET("/api/product", params, LoadSellerProductData, SellerProductErr);
}

export async function InitSellerProductPage() {
  // Reset filter
  currentCategory = "";
  allProducts = [];

  fetchProducts();
  GET("/api/category", {}, renderFilterDropdown, CategoryProductErr);

  const itemsPerPageSelect = document.getElementById("items-per-page-select");
  if (itemsPerPageSelect) {
    itemsPerPageSelect.addEventListener("change", (e) => {
      itemsPerPage = parseInt(e.target.value, 10);
      console.log("Items per page changed to:", itemsPerPage);
      currentPage = 1;
      renderFilteredProducts();
    });
  }

  const sortSelect = document.getElementById("sort-filter");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      renderFilteredProducts();
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
}
