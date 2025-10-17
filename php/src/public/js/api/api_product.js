export async function LoadProduct() {
  const container = document.getElementById("data");
  if (!container) return;

  try {
    const res = await fetch("/api/product", {
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
