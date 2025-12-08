import React, { useState, useRef } from "react";
import AttachmentModal from "./attachment_modal";

const ChatInput = ({ onSendMessage, onTypingChange, disabled }) => {
  const [input, setInput] = useState("");
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const isTypingRef = useRef(false);

  const handleInputChange = (e) => {
    const value = e.target.value;
    const wasEmpty = input.trim().length === 0;
    const isEmpty = value.trim().length === 0;

    setInput(value);

    // Auto resize
    e.target.style.height = "auto";
    const maxHeight = 24 * 5;
    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;

    // Typing logic
    if (wasEmpty && !isEmpty && !isTypingRef.current) {
      console.log("Start typing");
      isTypingRef.current = true;
      onTypingChange?.(true);
    }

    if (!wasEmpty && isEmpty && isTypingRef.current) {
      console.log("Stop typing (input cleared)");
      isTypingRef.current = false;
      onTypingChange?.(false);
    }
  };

  const handleSend = () => {
    if (disabled) return;

    // Jika ada produk yang dipilih, kirim sebagai item_preview
    if (selectedProduct) {
      sendItemPreview(selectedProduct);
      return;
    }

    // Jika hanya text biasa
    if (!input.trim()) return;

    // Stop typing sebelum kirim
    if (isTypingRef.current) {
      console.log("📤 Stop typing before send");
      isTypingRef.current = false;
      onTypingChange?.(false);
    }

    onSendMessage(input);
    setInput("");

    // Reset textarea height
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "auto";
    }
  };

  const sendItemPreview = (product) => {
    if (!product || disabled) return;

    // Buat payload untuk item preview
    const itemPreviewData = {
      product_id: product.product_id,
      product_name: product.product_name,
      description: product.description,
      price: product.price,
      main_image_path: product.main_image_path,
      store_id: product.store_id,
    };

    // Kirim sebagai item_preview type
    if (typeof onSendMessage === "function") {
      onSendMessage(itemPreviewData, "item_preview");
    }

    // Reset selected product
    setSelectedProduct(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBlur = () => {
    console.log("👁️ Input blurred, typing state unchanged");
  };

  const handleAttachmentClick = () => {
    setShowAttachmentModal(true);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setShowAttachmentModal(false);
  };

  // Reset selected product jika disabled
  //   useEffect(() => {
  //     if (disabled) {
  //       setSelectedProduct(null);
  //     }
  //   }, [disabled]);

  return (
    <>
      <div className="p-4 border-t border-gray-200 bg-white flex gap-2 items-center">
        <button
          onClick={handleAttachmentClick}
          className="p-2 px-4 bg-gray-200 rounded-full hover:opacity-80 transition-opacity"
          disabled={disabled}
          type="button"
        >
          +
        </button>

        {/* Preview produk yang dipilih */}
        {selectedProduct && (
          <div className="flex-1 flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-10 h-10 bg-gray-300 rounded overflow-hidden">
              {selectedProduct.main_image_path ? (
                <img
                  src={"/api/image?file=" + selectedProduct.main_image_path}
                  alt={selectedProduct.product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                  <span className="text-xs text-white">No Image</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">
                {selectedProduct.product_name}
              </p>
              <p className="text-xs text-gray-600">
                Rp {selectedProduct.price.toLocaleString("id-ID")}
              </p>
            </div>
            <button
              onClick={() => setSelectedProduct(null)}
              className="p-1 text-gray-500 hover:text-gray-700"
              type="button"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input text (hanya muncul jika tidak ada produk yang dipilih) */}
        {!selectedProduct && (
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onBlur={handleBlur}
            placeholder={
              disabled ? "Pilih percakapan terlebih dahulu" : "Tulis pesan..."
            }
            className="flex-1 p-3 border border-gray-300 rounded-xl resize-none overflow-y-auto max-h-[120px] focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
            rows={1}
            disabled={disabled}
          />
        )}

        <button
          onClick={handleSend}
          disabled={disabled || (!input.trim() && !selectedProduct)}
          className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          type="button"
        >
          {selectedProduct ? "Kirim Produk" : "Kirim"}
        </button>
      </div>

      <AttachmentModal
        show={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        onProductSelect={handleProductSelect}
        disabled={disabled}
      />
    </>
  );
};

export default ChatInput;
