// Global Loading Indicator
class LoadingIndicator {
  constructor() {
    this.loadingElement = null;
    this.loadingCount = 0; // Track multiple simultaneous loading states
    this.init();
  }

  init() {
    // Create loading overlay if it doesn't exist
    if (!document.getElementById("global-loading-overlay")) {
      const overlay = document.createElement("div");
      overlay.id = "global-loading-overlay";
      overlay.className = "loading-overlay";
      overlay.innerHTML = `
        <div class="loading-spinner-container">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
          <p class="loading-text" id="loading-text">Loading...</p>
        </div>
      `;
      document.body.appendChild(overlay);
      this.loadingElement = overlay;
    } else {
      this.loadingElement = document.getElementById("global-loading-overlay");
    }
  }

  show(message = "Loading...") {
    this.loadingCount++;

    if (this.loadingElement) {
      const textElement = document.getElementById("loading-text");
      if (textElement) {
        textElement.textContent = message;
      }
      this.loadingElement.classList.add("active");
      document.body.style.overflow = "hidden"; // Prevent scrolling
    }
  }

  hide() {
    this.loadingCount--;

    // Only hide if no other loading operations are active
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;

      if (this.loadingElement) {
        this.loadingElement.classList.remove("active");
        document.body.style.overflow = ""; // Restore scrolling
      }
    }
  }

  // Force hide regardless of count
  forceHide() {
    this.loadingCount = 0;
    if (this.loadingElement) {
      this.loadingElement.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  // Update loading message while showing
  updateMessage(message) {
    if (this.loadingElement) {
      const textElement = document.getElementById("loading-text");
      if (textElement) {
        textElement.textContent = message;
      }
    }
  }

  // Check if loading is currently active
  isActive() {
    return this.loadingCount > 0;
  }
}

// Create global instance
const Loading = new LoadingIndicator();

// Export for use in modules
export { Loading };

// Also make it available globally on window
// if (typeof window !== 'undefined') {
//   window.Loading = Loading;
// }

// ============================================
// USAGE EXAMPLES & PATTERNS
// ============================================

/*
// ========================================
// PATTERN 1: Basic Show/Hide
// ========================================
function basicExample() {
  Loading.show();
  setTimeout(() => {
    Loading.hide();
  }, 2000);
}


// ========================================
// PATTERN 2: With Custom Message
// ========================================
function customMessageExample() {
  Loading.show('Memuat data pesanan...');
  setTimeout(() => {
    Loading.hide();
  }, 2000);
}


// ========================================
// PATTERN 3: Update Message During Loading
// ========================================
function updateMessageExample() {
  Loading.show('Mengirim data...');
  
  setTimeout(() => {
    Loading.updateMessage('Memproses...');
  }, 1000);
  
  setTimeout(() => {
    Loading.updateMessage('Hampir selesai...');
  }, 2000);
  
  setTimeout(() => {
    Loading.hide();
  }, 3000);
}


// ========================================
// PATTERN 4: With Fetch/API Call
// ========================================
async function fetchExample() {
  Loading.show('Mengambil data...');
  
  try {
    const response = await fetch('/api/orders');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    Loading.hide(); // Always hide, even on error
  }
}


// ========================================
// PATTERN 5: Multiple Sequential Operations
// ========================================
async function multipleOperationsExample() {
  Loading.show('Memvalidasi data...');
  await validateData();
  
  Loading.updateMessage('Mengirim ke server...');
  await sendToServer();
  
  Loading.updateMessage('Memproses...');
  await processData();
  
  Loading.hide();
}


// ========================================
// PATTERN 6: With Try-Catch-Finally
// ========================================
async function tryCatchExample() {
  Loading.show('Memproses pesanan...');
  
  try {
    const result = await processOrder();
    alert('Berhasil!');
    return result;
  } catch (error) {
    console.error('Error:', error);
    alert('Gagal memproses pesanan');
  } finally {
    Loading.hide(); // Always executed
  }
}


// ========================================
// PATTERN 7: With Callback Functions
// ========================================
function callbackExample() {
  Loading.show('Memuat data...');
  
  GET('/api/orders', {},
    (response) => {
      // Success callback
      console.log('Success:', response);
      Loading.hide();
    },
    (error) => {
      // Error callback
      console.error('Error:', error);
      Loading.hide();
    }
  );
}


// ========================================
// PATTERN 8: Form Submission
// ========================================
function formSubmitExample(formData) {
  Loading.show('Mengirim formulir...');
  
  fetch('/api/submit', {
    method: 'POST',
    body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => {
    Loading.hide();
    alert('Formulir berhasil dikirim!');
  })
  .catch(error => {
    Loading.hide();
    alert('Gagal mengirim formulir');
  });
}


// ========================================
// PATTERN 9: Confirm Action (like order confirmation)
// ========================================
function confirmOrderExample(orderId) {
  if (!confirm('Apakah Anda yakin?')) {
    return;
  }
  
  Loading.show('Mengkonfirmasi pesanan...');
  
  PATCH(`/api/order/${orderId}`, { status: 'received' },
    (response) => {
      Loading.hide();
      alert('Pesanan dikonfirmasi!');
      // Refresh data
      refreshOrderList();
    },
    (error) => {
      Loading.hide();
      alert('Gagal mengkonfirmasi pesanan');
    }
  );
}


// ========================================
// PATTERN 10: Multiple Simultaneous Loading
// ========================================
async function multipleSimultaneousExample() {
  // Start multiple operations
  Loading.show('Loading operation 1...');
  const promise1 = fetchData1();
  
  Loading.show('Loading operation 2...');
  const promise2 = fetchData2();
  
  try {
    await promise1;
    Loading.hide(); // Hide first operation
    
    await promise2;
    Loading.hide(); // Hide second operation
  } catch (error) {
    Loading.forceHide(); // Force hide all on error
  }
}


// ========================================
// PATTERN 11: With Promise.all
// ========================================
async function promiseAllExample() {
  Loading.show('Memuat semua data...');
  
  try {
    const [orders, products, users] = await Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
      fetch('/api/users').then(r => r.json())
    ]);
    
    console.log({ orders, products, users });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    Loading.hide();
  }
}


// ========================================
// PATTERN 12: Conditional Loading
// ========================================
function conditionalLoadingExample(data) {
  if (Loading.isActive()) {
    console.log('Already loading, skip...');
    return;
  }
  
  Loading.show('Processing...');
  processData(data)
    .then(() => Loading.hide())
    .catch(() => Loading.hide());
}


// ========================================
// PATTERN 13: Force Hide (Emergency)
// ========================================
function forceHideExample() {
  // If something goes wrong and loading stuck
  try {
    // risky operation
  } catch (error) {
    Loading.forceHide(); // Force hide regardless of counter
    console.error('Emergency hide loading');
  }
}


// ========================================
// PATTERN 14: Page Load/Navigation
// ========================================
function pageLoadExample() {
  Loading.show('Memuat halaman...');
  
  // Simulate page load
  loadPageContent()
    .then(() => {
      Loading.hide();
    })
    .catch((error) => {
      Loading.hide();
      console.error('Page load error:', error);
    });
}


// ========================================
// PATTERN 15: File Upload
// ========================================
async function fileUploadExample(file) {
  Loading.show('Mengunggah file...');
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      Loading.updateMessage('Memproses file...');
      const result = await response.json();
      console.log('Upload success:', result);
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Gagal mengunggah file');
  } finally {
    Loading.hide();
  }
}
*/
