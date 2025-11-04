import { renderToast } from "./toast.js";

let quill = null;
let quillReady = false;
let quillReadyCallbacks = [];
let count;
function setupQuill() {
  const descContainer = document.getElementById("quill-desc");
  const hiddenInput = document.getElementById("quill-desc-input");

  if (!descContainer || !hiddenInput) {
    console.error("Elemen Quill tidak ditemukan");
    return;
  }

  quill = new Quill(descContainer, {
    theme: "snow",
    placeholder: "Masukkan Teks...",
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

  const MAX_LENGTH = 1000;
  quill.on("text-change", (delta, oldDelta, source) => {
    hiddenInput.value = quill.root.innerHTML;
    let len = quill.getLength() - 1;

    if (len > MAX_LENGTH) {
      let isInsert = delta.ops.some((op) => op.insert);
      if (isInsert) {
        const excess = len - MAX_LENGTH;
        if (excess > 0) {
          quill.deleteText(MAX_LENGTH, excess);

          len = MAX_LENGTH;

          renderToast(
            `Maksimal ${MAX_LENGTH} karakter telah tercapai!`,
            "error"
          );
        }
      }
      renderToast("Maksimal 1000 Karakter", "error");
    } else {
      quill.enable(true);
    }
  });

  const form = descContainer.closest("form");
  if (form) {
    form.addEventListener("submit", () => {
      hiddenInput.value = quill.root.innerHTML;
    });
  }

  quillReady = true;
  quillReadyCallbacks.forEach((cb) => cb());
  quillReadyCallbacks = [];
}

export function InitQuill() {
  count = 0;
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

export function onQuillReady(callback) {
  if (quillReady) callback();
  else quillReadyCallbacks.push(callback);
}

export function changePlaceHolder(text) {
  onQuillReady(() => {
    quill.clipboard.dangerouslyPasteHTML(text || "");
    document.getElementById("quill-desc-input").value = text || "";
  });
}
