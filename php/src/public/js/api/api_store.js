export async function LoadStore() {
    const container = document.getElementById("store_profile");
    if (!container) return;

    try {
        const store = await fetch("/api/detail_store", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        if (!store.ok) {
            container.innerHTML = `Error loading data: ${store.status} ${store.statusText}`;
            return;
        }

        const storeData = await store.json();

        if (storeData.status === "success" && storeData.data) {
            const storeInfo = storeData.data;
            container.innerHTML = `
                <h2>${storeInfo.store_name}</h2>
                <p>${storeInfo.store_description}</p>
            `;
        } else {
            container.innerHTML = storeData.message || "No store data available";
        }

    } catch (err) {
        console.error("Fetch error:", err);
        container.innerHTML = "Error connecting to server";
    }   
}