export async function LoadComponent(tag_id, components_path) {
  const container = document.getElementById(tag_id);
  if (!container) return;

  const res = await fetch(components_path);
  if (!res.ok) {
    console.error("Failed to load ", tag_id, " : ", res.status);
    return;
  }

  const html = await res.text();
  container.innerHTML = html;
}

export async function RemoveComponent(tag_id) {
  const navbar = document.getElementById(tag_id);
  navbar.innerHTML = "";
}
