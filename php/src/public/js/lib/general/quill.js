export function InitQuill() {
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
