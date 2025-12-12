import { router } from "../../../app.js";
import { GET, POST } from "../../api/api.js";
import { ChangeInnerHtmlById } from "../../util/component_loader.js";
import { renderToast } from "../general/toast.js";
import { InitCountCart } from "../general/navbar.js";
import {
  showModalConfirmation,
  showModalSpinnerInput,
} from "../general/modal.js";

async function checkCheckoutFeatureFlag() {
  try {
    const userResponse = await fetch("/node/api/user/me", {
      method: "GET",
      credentials: "include",
    });

    if (!userResponse.ok) {
      return { isAllowed: true, reason: null };
    }

    const userData = await userResponse.json();

    if (userData.status === "error") {
      return { isAllowed: true, reason: null };
    }

    const userId = userData.data?.user_id || userData.user_id;

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

function LoadDetail(data, productId) {
  const res = data.data;
  const price = res.price.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });
  ChangeInnerHtmlById("p-name", res.product_name);
  ChangeInnerHtmlById("p-price", price);
  ChangeInnerHtmlById("p-desc", res.description);
  ChangeInnerHtmlById(
    "p-stock",
    "<p><strong>Stok:</strong>" + res.stock + " pcs</p>"
  );
  ChangeInnerHtmlById("s-desc", res.store_description);
  ChangeInnerHtmlById("s-name", res.store_name);
  const p_img_url = "api/image?file=" + res.main_image_path;
  ChangeInnerHtmlById(
    "p-img",
    `<img src="${p_img_url}" alt="${res.product_name} Image" class="product-image">`
  );
  const s_img_url = "api/image?file=" + res.store_logo_path;
  ChangeInnerHtmlById(
    "s-img",
    `<img src="${s_img_url}" alt="${res.store_name} Logo" class="seller-avatar">`
  );
  ChangeInnerHtmlById(
    "btn-store",
    `<button class="visit-store-btn" id="v-store">Kunjungi Toko</button>`
  );
  const storeBtn = document.getElementById("v-store");
  storeBtn.addEventListener("click", () => {
    router.navigateTo("/store?store_id=" + res.store_id);
  });

  ChangeInnerHtmlById(
    "btn-chat",
    `<button class="visit-store-btn" id="chatPenjualBtn">Chat Penjual</button>`
  );
  const chatBtn = document.getElementById("chatPenjualBtn");
  if (chatBtn) {
    chatBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      GET(
        "/api/auth",
        {},
        async (authData) => {
          if (authData.status !== "success") {
            showModalConfirmation(
              "Login untuk memulai chat dengan penjual 1",
              () => {
                router.navigateTo("/login");
              },
              () => {}
            );
            return;
          }

          POST(
            "/node/api/chat/start",
            { store_id: res.store_id },
            (roomResp) => {
              const room = roomResp.data || roomResp.room || roomResp;
              const roomId =
                room.room_id ||
                room.id ||
                (room.store_id && room.buyer_id
                  ? `${room.store_id}-${room.buyer_id}`
                  : null);

              if (!roomId) {
                renderToast("Gagal membuka chat dengan penjual 2", "error");
                return;
              }

              window.location.href = `/react/chat?room_id=${encodeURIComponent(
                roomId
              )}&product_id=${encodeURIComponent(productId)}`;
            },
            (err) => {
              console.error("Failed create/get room", err);
              renderToast("Gagal membuka chat dengan penjual 3", "error");
            }
          );
        },
        (hasErr) => {
          if (hasErr) {
            showModalConfirmation(
              "Login untuk memulai chat dengan penjual",
              () => {
                router.navigateTo("/login");
              },
              () => {}
            );
          }
        }
      );
    });
  }
  if (Array.isArray(res.categories) && res.categories.length > 0) {
    ChangeInnerHtmlById("p-category", res.categories.join(", "));
  } else {
    ChangeInnerHtmlById("p-category", "-");
  }
}

async function LoadAddCartBtn(id, stock) {
  GET(
    "/api/auth",
    {},
    async (data) => {
      if (data.status == "success") {
        const res = data.data;
        if (res.role == "BUYER") {
          const checkoutAccess = await checkCheckoutFeatureFlag();

          const buttonStyle = !checkoutAccess.isAllowed
            ? 'style="background-color: #9CA3AF !important; cursor: not-allowed; opacity: 0.6;"'
            : "";

          ChangeInnerHtmlById(
            "add-cart",
            `<button class="visit-store-btn" id="cartBtn" ${buttonStyle}>Add To Cart</button>`
          );

          const cartBtn = document.getElementById("cartBtn");
          cartBtn.addEventListener("click", (e) => {
            e.stopPropagation();

            if (!checkoutAccess.isAllowed) {
              const reason =
                checkoutAccess.reason ||
                "Fitur Proses Checkout sedang tidak tersedia";
              const scope =
                reason.toLowerCase().includes("maintenance") ||
                reason.toLowerCase().includes("global")
                  ? "global"
                  : "user";

              window.location.href = `/react/feature-disabled?feature=checkout&reason=${encodeURIComponent(
                reason
              )}&scope=${scope}`;
              return;
            }

            showModalSpinnerInput(
              "Tambahkan ke keranjang",
              stock,
              (qty) => {
                const product_id = id;
                POST(
                  "/api/cart",
                  {
                    action: "add",
                    product_id: product_id,
                    buyer_id: data.data.id,
                    quantity: qty,
                  },
                  (response) => {
                    if (response.status === "success") {
                      renderToast(
                        `Berhasil menambahkan ${qty} produk  kedalam cart`,
                        "success"
                      );
                      InitCountCart();
                    } else {
                      renderToast(
                        "Gagal menambahkan produk kedalam cart",
                        "success"
                      );
                    }
                  },
                  () => {}
                );
              },
              () => {}
            );
          });
        }
      } else {
        ChangeInnerHtmlById(
          "add-cart",
          `<button class="visit-store-btn" id="cartBtn">Add To Cart</button>`
        );
        const cartBtn = document.getElementById("cartBtn");
        cartBtn.addEventListener("click", (e) => {
          showModalConfirmation(
            "Login untuk menambahkan !",
            () => {
              router.navigateTo("/login");
            },
            () => {}
          );
        });
      }
    },
    () => {}
  );
}

function IsErr(err) {}

export function InitProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const param_id = params.get("id");

  GET(
    "/api/product",
    { id: param_id },
    (data) => {
      LoadDetail(data, param_id);
      const stock = data.data.stock;
      LoadAddCartBtn(param_id, stock);
    },
    IsErr
  );
}
