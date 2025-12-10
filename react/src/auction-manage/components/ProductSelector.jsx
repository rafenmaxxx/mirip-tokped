import { useState, useEffect } from "react";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getImageUrl = (path) => {
  return path && path !== "" ? `/api/image?file=${path}` : "no-image.png";
}

function ProductSelector({ onSelectProduct, storeId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    if (storeId) {
      fetchProducts();
    }
  }, [storeId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("Fetching products for storeId:", storeId);
      
      const url = `http://localhost:80/node/api/products/store/${storeId}`;
      
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Gagal memuat produk");
      }

      const products = await response.json();
      // console.log("Raw response:", products);
      // console.log("Is array:", Array.isArray(products));
      
      const availableProducts = Array.isArray(products) 
        ? products.filter(product => {
            console.log(`Product: ${product.product_name}, stock: ${product.stock}`);
            return product.stock > 0;
          })
        : [];
      // console.log("Available products after filter:", availableProducts);

      setProducts(availableProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Gagal memuat produk. Pastikan Anda sudah memiliki toko dan produk.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.product_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...new Set(products.map((p) => p.category))];

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Memuat produk...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-600 font-semibold mb-2">Gagal Memuat Produk</p>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchProducts}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Produk</h3>
        <p className="text-gray-600">Tambahkan produk ke toko Anda terlebih dahulu untuk membuat lelang</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category === "all" ? "Semua" : category}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Tidak ada produk yang sesuai dengan pencarian</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
          {filteredProducts.map((product) => (
            <button
              key={product.product_id}
              onClick={() => onSelectProduct(product)}
              className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-green-500 hover:shadow-md transition-all text-left"
            >
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                <img
                  src={getImageUrl(product.main_image_path)}
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/img/placeholder.png";
                  }}
                />
              </div>
              
              <h4 className="font-bold text-gray-900 mb-1 line-clamp-2">
                {product.product_name}
              </h4>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Stok:</span>
                <span className={`text-sm font-semibold ${
                  product.stock > 10 ? "text-green-600" : "text-orange-600"
                }`}>
                  {product.stock}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Harga:</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(product.price)}
                </span>
              </div>

              {product.category && (
                <div className="mt-2">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {product.category}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600 text-center">
        Menampilkan {filteredProducts.length} dari {products.length} produk
      </div>
    </div>
  );
}

export default ProductSelector;
