import { GET } from "../../../api/api.js";
import { ChangeInnerHtmlById } from "../../../util/component_loader.js";
import { router } from "../../../../app.js";
function LoadSellerData() {
  GET(
    "/api/detail_store",
    {},
    (data) => {
      if (data.status == "success") {
        const res = data.data;
        ChangeInnerHtmlById("store-name", res.store_name);
        ChangeInnerHtmlById("store-description", res.store_description);
      }
    },
    () => {}
  );
}

export function InitSeller() {
  LoadSellerData();

  const editBtn = document.getElementById("editBtn");
  const kelolaBtn = document.getElementById("kelolaBtn");
  const orderBtn = document.getElementById("orderBtn");
  const addProdBtn = document.getElementById("addProdBtn");

  editBtn.addEventListener("click", () => {
    router.navigateTo("");
  });

  kelolaBtn.addEventListener("click", () => {
    router.navigateTo("");
  });

  orderBtn.addEventListener("click", () => {
    router.navigateTo("");
  });

  addProdBtn.addEventListener("click", () => {
    router.navigateTo("");
  });
}
