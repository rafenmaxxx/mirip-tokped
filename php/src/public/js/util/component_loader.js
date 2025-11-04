import { GETMODULE } from "./../api/api.js";
export function LoadComponent(tag_id, components_path, callback) {
  const container = document.getElementById(tag_id);
  if (!container) return;

  GETMODULE(
    components_path,
    {},
    (data) => {
      container.innerHTML = data;

      if (typeof callback === "function") {
        callback(data);
      }
    },
    (err) => {
      if (err) {
        this.app.innerHTML = `<h1>404 - Page Not Found</h1>`;
      }
    }
  );
}

export async function RemoveComponent(tag_id) {
  const navbar = document.getElementById(tag_id);
  navbar.innerHTML = "";
}

export function ChangeInnerHtmlById(tag, data) {
  const el = document.getElementById(tag);
  if (!el) {
    console.error("Element not found:", tag);
    return;
  }
  el.innerHTML = data;
}

export function ChangeTextContentById(tag, data) {
  const el = document.getElementById(tag);
  if (!el) {
    console.error("Element not found:", tag);
    return;
  }
  el.textContent = data;
}

export function ChangeValuerById(tag, data) {
  const el = document.getElementById(tag);
  if (!el) {
    console.error("Element not found:", tag);
    return;
  }
  el.value = data;
}

export function renderSkeleton(targetSelector, count = 5, type = "card") {
  const el = document.querySelector(targetSelector);
  if (!el) return;

  if (type === "card") {
    el.classList.add("skeleton-grid");
    el.innerHTML = Array(count)
      .fill('<div class="skeleton-card"></div>')
      .join("");
  }

  if (type === "banner") {
    el.innerHTML = Array(count)
      .fill('<div class="skeleton-banner"></div>')
      .join("");
  }
}
