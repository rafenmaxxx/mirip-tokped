import React, { useState, useEffect } from "react";

const AttachmentModal = ({ show, onClose, onProductSelect, disabled }) => {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [storeId, setStoreId] = useState(null);

  useEffect(() => {
    if (show && activeTab === "products") {
      fetchProducts();
    }
  }, [show, activeTab]);

  const fetchProducts = async () => {
    if (!storeId || disabled) return;

    setIsLoading(true);
    try {
      const res = await fetch(
        `http://localhost/api/product?store_id=${storeId}`
      );
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

  // Store ID akan di-set dari parent component berdasarkan selectedRoom
  useEffect(() => {
    // Ini akan di-set dari parent Chat component
    // Simpan storeId di localStorage atau context untuk akses mudah
    const currentStoreId = localStorage.getItem("currentStoreId");
    if (currentStoreId) {
      setStoreId(currentStoreId);
    }
  }, []);

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
              activeTab === "images"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("images")}
            disabled
          >
            Gambar
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

        {/* Content berdasarkan tab */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "products" ? (
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
                          src={"/api/image?file=" + product.main_image_path}
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
