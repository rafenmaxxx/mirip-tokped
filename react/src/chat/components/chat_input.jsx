import React, { useState, useRef, useEffect } from "react";
import AttachmentModal from "./attachment_modal";

const ChatInput = ({ onSendMessage, onTypingChange, disabled }) => {
  const [input, setInput] = useState("");
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
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
      console.log("🚀 Start typing");
      isTypingRef.current = true;
      onTypingChange?.(true);
    }

    if (!wasEmpty && isEmpty && isTypingRef.current) {
      console.log("🛑 Stop typing (input cleared)");
      isTypingRef.current = false;
      onTypingChange?.(false);
    }
  };

  const handleImageSelect = async (file) => {
    if (!file) return;

    console.log("📸 Selected image:", file.name, file.type, file.size);

    // Validasi file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("File size too large. Maximum size is 5MB.");
      return;
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
      return;
    }

    setSelectedImage(file);
    setShowAttachmentModal(false);
  };

  const uploadImage = async (file) => {
    if (!file) return null;

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("attachment", file);

      console.log("📤 Uploading image to /api/attachment...");

      const response = await fetch("/api/attachment", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Image uploaded successfully:", result);

      return result.data; // Return uploaded file data
    } catch (error) {
      console.error("❌ Error uploading image:", error);
      alert(`Failed to upload image: ${error.message}`);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSend = async () => {
    if (disabled) return;

    // Jika ada image yang dipilih, upload dulu
    if (selectedImage) {
      const uploadedImage = await uploadImage(selectedImage);
      if (uploadedImage) {
        // Kirim image sebagai message
        sendImageMessage(uploadedImage);
        setSelectedImage(null);
      }
      return;
    }

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

    onSendMessage(input, "text");
    setInput("");

    // Reset textarea height
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "auto";
    }
  };

  const sendItemPreview = (product) => {
    if (!product || disabled) return;

    const itemPreviewData = {
      product_id: product.product_id,
      product_name: product.product_name,
      description: product.description,
      price: product.price,
      main_image_path: product.main_image_path,
      store_id: product.store_id,
      stock: product.stock,
    };

    onSendMessage(itemPreviewData, "item_preview");
    setSelectedProduct(null);
  };

  const sendImageMessage = (imageData) => {
    if (!imageData || disabled) return;

    // Data untuk dikirim sebagai message
    const imageMessageData = {
      url: imageData.url || imageData.path,
      filename: imageData.filename,
      originalname: imageData.originalname,
      mimetype: imageData.mimetype,
      size: imageData.size,
    };

    onSendMessage(imageMessageData, "image");
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
    setSelectedImage(null);
    setShowAttachmentModal(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageSelect(file);
    }
    // Reset input
    e.target.value = "";
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Reset selected items jika disabled
  useEffect(() => {
    if (disabled) {
      setSelectedProduct(null);
      setSelectedImage(null);
    }
  }, [disabled]);

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

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileInputChange}
        />

        {/* Preview produk yang dipilih */}
        {selectedProduct && (
          <div className="flex-1 flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-10 h-10 bg-gray-300 rounded overflow-hidden flex-shrink-0">
              {selectedProduct.main_image_path ? (
                <img
                  src={selectedProduct.main_image_path}
                  alt={selectedProduct.product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                  <span className="text-xs text-white">No Image</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
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

        {/* Preview image yang dipilih */}
        {selectedImage && (
          <div className="flex-1 flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
            <div className="w-10 h-10 bg-gray-300 rounded overflow-hidden flex-shrink-0 relative">
              {uploadingImage ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt={selectedImage.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 bg-green-500 text-white text-xs px-1 rounded-tl">
                    📷
                  </div>
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {selectedImage.name}
              </p>
              <p className="text-xs text-gray-600">
                {(selectedImage.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-1 text-gray-500 hover:text-gray-700"
              type="button"
              disabled={uploadingImage}
            >
              ✕
            </button>
          </div>
        )}

        {/* Input text (hanya muncul jika tidak ada produk/image yang dipilih) */}
        {!selectedProduct && !selectedImage && (
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
            disabled={disabled || uploadingImage}
          />
        )}

        <button
          onClick={handleSend}
          disabled={
            disabled ||
            uploadingImage ||
            (!input.trim() && !selectedProduct && !selectedImage)
          }
          className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          type="button"
        >
          {uploadingImage ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Uploading...</span>
            </>
          ) : selectedImage ? (
            "Kirim Gambar"
          ) : selectedProduct ? (
            "Kirim Produk"
          ) : (
            "Kirim"
          )}
        </button>
      </div>

      <AttachmentModal
        show={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        onProductSelect={handleProductSelect}
        onImageSelect={handleImageSelect}
        onCameraSelect={triggerFileInput}
        disabled={disabled}
      />
    </>
  );
};

export default ChatInput;
