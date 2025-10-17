import { LoadComponent } from "../util/component_loader.js";

export async function LoadHome() {
  const container = document.getElementById("data");
  await LoadComponent("slider", "/components/home/sliding_card.html");
  if (!container) return;

  try {
    const res = await fetch("/api/home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      container.innerHTML = `Error loading data: ${res.status} ${res.statusText}`;
      return;
    }

    const data = await res.json();

    if (data.status === "success" && data.data) {
      container.innerHTML = `
        <h2>${data.data.title}</h2>
        <p>${data.data.content}</p>
      `;
    } else {
      container.innerHTML = data.message || "No data available";
    }
  } catch (err) {
    console.error("Fetch error:", err);
    container.innerHTML = "Error connecting to server";
  }
}
