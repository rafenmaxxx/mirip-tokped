import { router } from "../../../app.js";
import { GET, POST } from "../../api/api.js";
import { ChangeInnerHtmlById } from "../../util/component_loader.js";
import { showModalConfirmation } from "../general/modal.js";

let total_price = 0;

function LoadCheckoutItems(data) {
  const container = document.getElementById("checkout-data");
  if (!container) return;

  console.log("Checkout Data:", data);

  if (data.status === "success" && Array.isArray(data.data.stores)) {
    const cartItems = data.data.stores;
    const buyer_id = data.data.buyer_id;

    const html = cartItems
      .map((item, index) => {
        const details = item.items.map((detail, dindex) => {
          const price = detail.price.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          });

          const imageUrl =
            detail.image && detail.image !== ""
              ? `/api/image?file=${detail.image}`
              : `https://picsum.photos/200/200?random=${index + 1}`;

          return ` 
            <div class="checkout_item_detail">
              <div class="checkout_item_image">
                  <img src="${imageUrl}">
              </div>
              <div class="checkout_item_info_container">
                <div class="checkout_item_info">
                  <p class="checkout_item_name">${detail.product_name}</p>
                  <p class="checkout_item_quantity">${detail.quantity}</p>
                  <p class="checkout_item_price">${price}</p>
                </div>
              </div>
            </div>`;
        });
        return `
          <div class="checkout_item_card" data-store-card-id="${item.store_id}">

            <h3 class="checkout_store_name" data-store-id="${item.store_id}">${item.store_name}</h3>

            <div class="checkout_item_details">
            ${details.join("")}
            </div>
            <div class="checkout_subtotal">
                ${item.subtotal.toLocaleString("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                })}
            </div>
          </div>
        `;
      })
      .join("");

    GET(
      "/api/cart",
      { action: "price" },
      (response) => {
        if (response.status === "success" && response.data) {
          total_price = response.data.total_price || response.data || 0;
          console.log("Total price from API:", total_price);
        } else {
          total_price = 0;
          console.log("Failed to get total price, using 0");
        }

        container.innerHTML = `
                  <h2 id="checkout-label" class="checkout_title">Checkout</h2>
                  <div class="checkout_items_wrapper">
                      ${html}
                      <div class="checkout-total" id="checkout-total">
                          <p id="checkout-total-amount">${total_price.toLocaleString(
                            "id-ID",
                            {
                              style: "currency",
                              currency: "IDR",
                              minimumFractionDigits: 0,
                            }
                          )}</p>
                      </div>
                  </div>
            `;
        
        const storeNames = container.querySelectorAll(".checkout_store_name");

        storeNames.forEach((el) => {
          el.addEventListener("click", () => {
            const storeId = el.getAttribute("data-store-id");
            router.navigateTo(`/store?store_id=${parseInt(storeId)}`);
          });
        });
        GET("/api/user", { action: "balance" }, LoadBalance, BalanceErr);
      },
      () => {}
    );
  } else {
    container.innerHTML = data.message || "No data available";
  }
}

function CheckoutItemsErr(err) {
  const container = document.getElementById("checkout-data");
  if (container) {
    container.innerHTML = "Error loading checkout items.";
  }
}

function LoadBalance(data) {
  const balanceContainer = document.getElementById("checkout-balance");
  console.log("Balance Data:", data);
  if (!balanceContainer) return;

  if (data.status === "success" && data.data) {
    const balance = data.data.balance.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    });
    const remainingAfterCo = (data.data.balance - total_price).toLocaleString(
      "id-ID",
      {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }
    );
    balanceContainer.innerHTML = `
      <div class="balance_card">
        <div class="balance_info">
          <p class="balance_label">Saldo Anda Saat Ini</p>
          <p class="balance_amount">${balance}</p>
          <p class="balance_label">Saldo Anda Setelah Checkout</p>
          <p class="balance_amount">${remainingAfterCo}</p>
          <p class="balance_label" id="balance-warn"></p>
        </div>
        <button class="btn-checkout-now" id="btn-checkout-now">
          Checkout
        </button>
      </div>
    `;
    const checkoutBtn = document.getElementById("btn-checkout-now");
    if (data.data.balance - total_price < 0) {
      ChangeInnerHtmlById("balance-warn", "Saldo Tidak Cukup ! Silahkan TopUp");
      ChangeInnerHtmlById("btn-checkout-now", "TopUp");
      if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
          document.getElementById("balance-btn").click();
        });
      }
    } else {
      ChangeInnerHtmlById("balance-warn", "");
      ChangeInnerHtmlById("btn-checkout-now", "Checkout");
      if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
          handleCheckout(data.data.balance);
        });
      }
    }

    // Attach event listener untuk tombol checkout

    GET("/api/user", { action: "address" }, LoadAddressForm, AddressErr);
  } else {
    console.log("Failed to load balance:", data);
    balanceContainer.innerHTML = `
      <div class="balance_card">
        <p class="balance_error">Error loading balance.</p>
      </div>
    `;
  }
}

function BalanceErr(err) {
  const balanceContainer = document.getElementById("checkout-balance");
  if (balanceContainer) {
    balanceContainer.innerHTML = "Error loading balance.";
  }
}

function handleCheckout(balance) {
  const shippingAddress = document.getElementById("shipping-address").value;
  showModalConfirmation(
    "Yakin Ingin Check Out?",
    () => {
      if (balance < total_price) {
        alert("kurang duit");
      } else {
        alert("bisa checkout");
        POST(
          "/api/checkout",
          { address: shippingAddress },
          () => {
            alert("Sukses Checkout");
            router.navigateTo("/");
          },
          () => {
            alert("Gagal Checkout");
          }
        );
      }
    },
    () => {}
  );
}

function LoadAddressForm(data) {
  const addressContainer = document.getElementById("checkout-address-form");
  if (!addressContainer) return;

  console.log("Address Data:", data);

  if (data.status === "success" && data.data) {
    const address = data.data.address || "";
    addressContainer.innerHTML = `<form id="address-form">
        <label for="shipping-address">Shipping Address:</label>
        <textarea id="shipping-address" name="shipping-address" rows="4" cols="50" required>${address}</textarea>
        <button type="submit" id="edit-address-btn">Edit</button>
        </form>`;
  } else {
    addressContainer.innerHTML = "Error loading address form.";
  }
}

function AddressErr(err) {
  const addressContainer = document.getElementById("checkout-address-form");
  if (addressContainer) {
    addressContainer.innerHTML = "Error loading address form.";
  }
}

export function InitCheckoutPage() {
  GET("/api/cart", {}, LoadCheckoutItems, CheckoutItemsErr);
  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "topupBtn") {
      GET("/api/user", { action: "balance" }, LoadBalance, BalanceErr);
    }
  });
}
