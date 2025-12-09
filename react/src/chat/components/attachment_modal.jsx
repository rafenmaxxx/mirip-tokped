import React, { useState, useEffect, useRef } from "react";

const AttachmentModal = ({
  show,
  onClose,
  onProductSelect,
  onImageSelect,
  onCameraSelect,
  disabled,
}) => {
  const [activeTab, setActiveTab] = useState("images");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [storeId, setStoreId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show && activeTab === "products") {
      fetchProducts();
    }
  }, [show, activeTab]);

  const fetchProducts = async () => {
    if (!storeId || disabled) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/product?store_id=${storeId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          setProducts(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Store ID akan di-set dari localStorage
  useEffect(() => {
    const currentStoreId = localStorage.getItem("currentStoreId");
    if (currentStoreId) {
      setStoreId(currentStoreId);
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onImageSelect) {
      onImageSelect(file);
    }
    // Reset input
    e.target.value = "";
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    if (onCameraSelect) {
      onCameraSelect();
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-xl w-96 max-w-[90vw] max-h-[80vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Lampirkan</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`flex-1 py-2 text-center font-medium ${
              activeTab === "images"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("images")}
          >
            Gambar
          </button>
          <button
            className={`flex-1 py-2 text-center font-medium ${
              activeTab === "products"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("products")}
          >
            Produk
          </button>
          <button
            className={`flex-1 py-2 text-center font-medium ${
              activeTab === "documents"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("documents")}
            disabled
          >
            Dokumen
          </button>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
        />

        {/* Content berdasarkan tab */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "images" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {/* Gallery option */}
                <button
                  onClick={handleGalleryClick}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Gallery
                  </span>
                </button>

                {/* Camera option */}
                <button
                  onClick={handleTakePhoto}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Camera
                  </span>
                </button>

                {/* Recent images (optional) */}
                <div className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500">Recent</span>
                </div>
              </div>

              <div className="text-center text-gray-500 text-sm">
                <p>Max size: 5MB</p>
                <p>Supported: JPEG, PNG, GIF, WebP</p>
              </div>
            </div>
          ) : activeTab === "products" ? (
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Memuat produk...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Tidak ada produk tersedia</p>
                  <p className="text-sm mt-1">
                    Store ID: {storeId || "Belum dipilih"}
                  </p>
                </div>
              ) : (
                products.map((product) => (
                  <button
                    key={product.product_id}
                    onClick={() => onProductSelect(product)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <div className="w-16 h-16 bg-gray-300 rounded overflow-hidden flex-shrink-0">
                      {product.main_image_path ? (
                        <img
                          src={product.main_image_path}
                          alt={product.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                          <span className="text-xs text-white">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {product.product_name}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {product.description}
                      </p>
                      <p className="text-sm font-semibold text-green-600">
                        Rp {product.price.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-gray-500">
                        Stok: {product.stock}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Fitur {activeTab} akan segera hadir</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full p-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};

export default AttachmentModal;
