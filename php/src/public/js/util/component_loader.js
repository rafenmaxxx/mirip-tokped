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
  const elmt = document.getElementById(tag);
  elmt.innerHTML = data;
}
