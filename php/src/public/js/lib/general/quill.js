function setupQuill() {
  const descContainer = document.getElementById("quill-desc");
  const hiddenInput = document.getElementById("quill-desc-input");

  if (!descContainer || !hiddenInput) {
    console.error("Elemen Quill tidak ditemukan");
    return;
  }

  const quill = new Quill(descContainer, {
    theme: "snow",
    placeholder: "Masukkan Deskripsi Toko...",
    modules: {
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    },
  });

  quill.on("text-change", () => {
    hiddenInput.value = quill.root.innerHTML;
  });

  const form = descContainer.closest("form");
  if (form) {
    form.addEventListener("submit", () => {
      hiddenInput.value = quill.root.innerHTML;
    });
  }
}

export function InitQuill() {
  if (!window.Quill) {
    const link = document.createElement("link");
    link.href = "https://cdn.quilljs.com/1.3.6/quill.snow.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdn.quilljs.com/1.3.6/quill.js";
    script.onload = setupQuill;
    document.head.appendChild(script);
  } else {
    setupQuill();
  }
}
