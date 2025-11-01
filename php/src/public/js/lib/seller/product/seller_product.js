import { GET } from "../../../api/api.js";
import { ChangeInnerHtmlById } from "../../../util/component_loader.js";
import { router } from "../../../../app.js";

let allProducts = [];
let productCategory = [];
let currentPage = 1;
let itemsPerPage = 2;
let currentCategory = ""; // Current active filter
let currentSort = "none"; // Current active sort

function renderFilterDropdown(data) {
  const filterContainer = document.getElementById("category-filter");
  if (!filterContainer) return;

  console.log("Category Data for Filter:", data);
  let categories = [];

  categories.push({ value: "", label: "All Categories" }); 

  if (data.status === "success" && Array.isArray(data.data)) {
    data.data.forEach(category => {
      categories.push({
        value: category.name, 
        label: category.name
      });
      productCategory.push(category.name);
    });
  }

  const optionsHtml = categories.map(cat => `
    <option value="${cat.value}">
      ${cat.label}
    </option>
  `).join('');

  filterContainer.innerHTML = optionsHtml;
}

function renderFilteredProducts(status) {
  const container = document.getElementById("pg1");
  const countElement = document.getElementById("order-count");
  if (!container) return;

  const filteredProducts = allProducts

  // Update count
//   if (countElement) {
//     const statusLabel = status === "all" ? "orders" : `orders`;
//     countElement.textContent = `${filteredOrders.length} ${statusLabel} found`;
//   }

//   if (filteredOrders.length === 0) {
//     const statusText = status === "all" ? "pesanan" : `pesanan dengan status "${status}"`;
//     container.innerHTML = `
//       <div class="no-orders">
//         <p>Tidak ada ${statusText}.</p>
//       </div>
//     `;
  //   return;
  // }

  switch (currentSort) {
        case "harga-asc":
            filteredProducts.sort((a, b) => a.price - b.price);
            console.log("Sorted Products by harga-asc:", filteredProducts);
            break;
        case "harga-desc":
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case "nama-asc":
            filteredProducts.sort((a, b) => a.product_name.localeCompare(b.product_name));
            break;
        case "nama-desc":
            filteredProducts.sort((a, b) => b.product_name.localeCompare(a.product_name));
            break;
        case "stok-asc":
            filteredProducts.sort((a, b) => a.stock - b.stock);
            break;
        case "stok-desc":
            filteredProducts.sort((a, b) => b.stock - a.stock);
            break;
        // default: (biarkan urutan asli)
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
    paginatedProducts.forEach(product => {
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
  const productPrice = product.price ? parseInt(product.price).toLocaleString('id-ID') : "0";

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
    const categoryContainer = cardElement.querySelector(`#${categoryPlaceholderId}`);
    if (!categoryContainer) return;

    if (categories.status === "success" && Array.isArray(categories.data)) {
      if (categories.data.length === 0) {
        categoryContainer.innerHTML = "<span class='tag'>Uncategorized</span>";
      } else {
        const tags = categories.data.map(cat => `<span class="tag">${cat.category_name}</span>`).join(' ');
        categoryContainer.innerHTML = `<span>kategori:</span> ${tags}`;
      }
    } else {
      onCategoryError();
    }
  };

  const onCategoryError = () => {
    const categoryContainer = cardElement.querySelector(`#${categoryPlaceholderId}`);
    if (categoryContainer) {
      categoryContainer.innerHTML = "<span class='tag error'>Gagal memuat kategori</span>";
    }
  };

  GET(
    "/api/category", 
    {"product_id": product.product_id}, 
    onCategorySuccess,
    onCategoryError
  );

  // 7. Tambahkan event listener (sekarang 'cardElement' sudah ada)
  cardElement.querySelector('.btn-edit').addEventListener('click', () => {
    // router.navigateTo(`/seller/product/edit?id=${product.product_id}`);
  });

  cardElement.querySelector('.btn-delete').addEventListener('click', () => {
    if (confirm(`Yakin ingin menghapus ${productName}?`)) {
      console.log("Menghapus produk ID:", product.product_id);
    }
  });

  // 8. Tambahkan kartu yang LENGKAP ke container
  container.appendChild(cardElement);
}

function renderOrderDetailModal(order) {
  const modal = document.getElementById("order-detail-modal");
  if (!modal) return;

  let itemsHtml = "";
  if (Array.isArray(order.items)) {
    order.items.forEach((item, index) => {
      const imageUrl =
          item.main_image_path && item.main_image_path !== ""
            ? `/api/image?file=${item.main_image_path}`
            : `https://picsum.photos/200/200?random=${index + 1}`;
      
      itemsHtml += `
        <div class="detail-item">
          <img src="${imageUrl}" 
               alt="${item.product_name}" 
               class="detail-item-image">
          <div class="detail-item-info">
            <h4>${item.product_name}</h4>
            <p class="item-quantity">Quantity: ${item.quantity}x</p>
            <p class="item-price">Rp ${parseInt(item.price_at_order).toLocaleString('id-ID')}</p>
            <p class="item-subtotal">Subtotal: Rp ${parseInt(item.subtotal).toLocaleString('id-ID')}</p>
          </div>
        </div>
      `;
    });
  }

  // Status badge color
  let statusClass = "status-waiting-approval";
  if (order.status === "approved") statusClass = "status-approved";
  else if (order.status === "on_delivery") statusClass = "status-on-delivery";
  else if (order.status === "received") statusClass = "status-received";
  else if (order.status === "rejected") statusClass = "status-rejected";

  // Reject reason (jika ada)
  const rejectReasonHtml = order.reject_reason ? `
    <div class="reject-reason">
      <h4>Alasan Penolakan:</h4>
      <p>${order.reject_reason}</p>
    </div>
  ` : '';

  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content modal-detail">
        <span class="close-button" id="close-detail-modal">&times;</span>
        
        <h2>Order Details</h2>
        
        <div class="order-info-section">
          <div class="info-row">
            <span class="info-label">Order ID:</span>
            <span class="info-value">${order.order_id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Store:</span>
            <span class="info-value">${order.store_name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value">
              <span class="status-badge ${statusClass}">${order.status}</span>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Order Date:</span>
            <span class="info-value">${new Date(order.created_at).toLocaleString('id-ID')}</span>
          </div>
          ${order.delivery_time ? `
          <div class="info-row">
            <span class="info-label">Delivery Time:</span>
            <span class="info-value">${new Date(order.delivery_time).toLocaleString('id-ID')}</span>
          </div>
          ` : ''}
        </div>

        <div class="shipping-section">
          <h3>Shipping Address</h3>
          <p>${order.shipping_address || 'No address provided'}</p>
        </div>

        ${rejectReasonHtml}

        <div class="products-section">
          <h3>Products</h3>
          <div class="detail-items-container">
            ${itemsHtml}
          </div>
        </div>

        <div class="total-section">
          <h3>Total Price: <span class="total-price">Rp ${parseInt(order.total_price).toLocaleString('id-ID')}</span></h3>
        </div>
      </div>
    </div>
  `;

  modal.style.display = "block";
  document.body.classList.add("modal-open");

  const closeModal = () => {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
  };

  document.getElementById("close-detail-modal").addEventListener("click", closeModal);

  modal.querySelector(".modal-overlay").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      closeModal();
    }
  });

  const escapeHandler = (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);
}

function LoadSellerProductData(data) {
  const container = document.getElementById("pg1");
  if (!container) return;

  console.log("Seller Product Data:", data);

  if (data.status === "success" && Array.isArray(data.data)) {
    allProducts = data.data; // Store all products

    if (allProducts.length === 0) {
      container.innerHTML = "<p class='no-orders'>Belum ada produk.</p>";
      return;
    }

    // Render all orders initially
    renderFilteredProducts();
  }
}

// --- Error Handler ---
function SellerProductErr(err) {  
  if (!err) {
      return;
  }

  const container = document.getElementById("pg1");
  if (!container) return;

  container.innerHTML = "<p class='error-message'>Error loading order history. Please try again later.</p>";
}

function CategoryProductErr(err) {  
  if (!err) {
      return;
  }

  const container = document.getElementById("pg1");
  if (!container) return;

  container.innerHTML = "<p class='error-message'>Error loading category data. Please try again later.</p>";
}

function fetchProducts() {
   const params = {};

   // 2. Buat objek filter (JIKA DIPERLUKAN)
   const filters = {};
   if (currentCategory) { // Asumsi currentCategory = "" berarti "semua"
     filters.categories = [currentCategory];
   }

   // 3. Ubah objek filter menjadi STRING JSON
   //    dan masukkan ke 'params'
   if (Object.keys(filters).length > 0) {
     params.filter = JSON.stringify(filters);
   }

   // Console log ini akan menunjukkan: 
   // { filter: '{"categories":["Elektronik"]}' }
   console.log("Fetching products with params:", params); 

   // 4. Panggil API
   // Fungsi GET akan mengirim: .../api/product?filter=%7B%22categories%22%3A%5B...%5D%7D
   // Ini adalah URL yang benar
   GET("/api/product", params, LoadSellerProductData, SellerProductErr);
}

// --- Init Page ---
export async function InitSellerProductPage() {
  // Reset filter
  currentCategory = "";
  allProducts = [];

  fetchProducts();
  
  // Render filter dropdown
  GET('/api/category', {}, renderFilterDropdown, CategoryProductErr);

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
      currentPage = 1; // Kembali ke halaman 1
      renderFilteredProducts(); // Render ulang
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