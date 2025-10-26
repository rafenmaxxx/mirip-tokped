import { router } from "../../../app.js";

function HandleSearchNavbar(param) {
  router.navigateTo("/home?search=" + param);
}

export function InitNavbar() {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const logo = document.getElementById("navbar-logo");
  searchBtn.addEventListener("click", () => {
    HandleSearchNavbar(searchInput.value.trim());
  });

  logo.addEventListener("click", () => {
    router.navigateTo("/home");
  });
}
