import { useState, useEffect } from "react";
import ProductSelector from "./ProductSelector";

const getImageUrl = (path) => {
  return path && path !== "" ? `/api/image?file=${path}` : "no-image.png";
};

function CreateAuctionModal({ onClose, onSuccess, userId, storeId }) {
  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [startingPrice, setStartingPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [minIncrement, setMinIncrement] = useState("");
  const [duration, setDuration] = useState("60");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError("");
  };

  const validateInputs = () => {
    if (!selectedProduct) {
      setError("Pilih produk terlebih dahulu");
      return false;
    }

    const startPrice = parseFloat(startingPrice);
    const increment = parseFloat(minIncrement);
    const durationMinutes = parseInt(duration);
    const qty = parseInt(quantity);

    if (!quantity || qty <= 0) {
      setError("Jumlah barang lelang harus lebih dari 0");
      return false;
    }

    if (qty > selectedProduct.stock) {
      setError(`Jumlah barang melebihi stok yang tersedia (${selectedProduct.stock})`);
      return false;
    }

    if (!startingPrice || startPrice <= 0) {
      setError("Harga awal harus lebih dari 0");
      return false;
    }

    if (!minIncrement || increment <= 0) {
      setError("Minimum increment harus lebih dari 0");
      return false;
    }

    if (increment >= startPrice) {
      setError("Minimum increment harus lebih kecil dari harga awal");
      return false;
    }

    if (!duration || durationMinutes <= 0) {
      setError("Durasi lelang harus lebih dari 0 menit");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + parseInt(duration) * 60000);

      const auctionData = {
        product_id: selectedProduct.product_id,
        starting_price: parseFloat(startingPrice),
        current_price: parseFloat(startingPrice),
        min_increment: parseFloat(minIncrement),
        quantity: parseInt(quantity),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      };

      const response = await fetch("http://localhost:80/node/api/auctions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(auctionData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Lelang berhasil dibuat dan akan dimulai segera!");
        onSuccess();
      } else {
        setError(data.message || "Gagal membuat lelang");
      }
    } catch (error) {
      console.error("Error creating auction:", error);
      setError("Terjadi kesalahan saat membuat lelang");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {step === 1 ? "Pilih Produk" : "Atur Detail Lelang"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            <ProductSelector onSelectProduct={handleProductSelect} storeId={storeId} />
          ) : (
            <div>
              {/* Selected Product Preview */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Produk yang dipilih:</p>
                <div className="flex items-center gap-4">
                  <img
                    src={getImageUrl(selectedProduct?.main_image_path) || "/img/placeholder.png"}
                    alt={selectedProduct?.product_name}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = "/img/placeholder.png";
                    }}
                  />
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedProduct?.product_name}</h3>
                    <p className="text-sm text-gray-600">Stok: {selectedProduct?.stock}</p>
                    <p className="text-sm text-green-600 font-semibold">
                      {formatCurrency(selectedProduct?.price)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleBack}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Ganti Produk
                </button>
              </div>

              {/* Auction Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Informasi:</p>
                      <p>• Lelang akan dimulai segera setelah dibuat</p>
                      <p>• Lelang akan berakhir sesuai durasi yang ditentukan</p>
                      <p>• Jika ada bid dalam 15 detik terakhir, waktu akan otomatis diperpanjang 15 detik</p>
                      <p>• Hanya satu lelang yang dapat berjalan dalam satu waktu</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jumlah Barang Lelang <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      Qty
                    </span>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Jumlah barang yang akan dilelang (maksimal sesuai stok produk)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Harga Awal Lelang <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={startingPrice}
                      onChange={(e) => setStartingPrice(e.target.value)}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Harga dimulai dari lelang ini (biasanya lebih rendah dari harga normal)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Minimum Increment <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={minIncrement}
                      onChange={(e) => setMinIncrement(e.target.value)}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum kenaikan bid yang harus dipasang pembeli
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Durasi Lelang <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="60"
                      className="w-full pl-4 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="1"
                      step="1"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      menit
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Durasi lelang dalam menit (contoh: 60 menit = 1 jam)
                  </p>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setDuration("30")}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      30 menit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration("60")}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      1 jam
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration("120")}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      2 jam
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration("180")}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      3 jam
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration("360")}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      6 jam
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration("720")}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      12 jam
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration("1440")}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      24 jam
                    </button>
                  </div>
                </div>

                {/* Preview */}
                {startingPrice && minIncrement && duration && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-900 mb-2">Preview:</p>
                    <div className="text-sm text-green-800 space-y-1">
                      <p>• Jumlah barang: <span className="font-bold">{quantity}</span></p>
                      <p>• Harga awal: <span className="font-bold">{formatCurrency(parseFloat(startingPrice))}</span></p>
                      <p>• Bid minimum berikutnya: <span className="font-bold">{formatCurrency(parseFloat(startingPrice) + parseFloat(minIncrement))}</span></p>
                      <p>• Setiap bid harus naik minimal: <span className="font-bold">{formatCurrency(parseFloat(minIncrement))}</span></p>
                      <p>• Durasi lelang: <span className="font-bold">{parseInt(duration)} menit</span> ({parseInt(duration) >= 60 ? `≈ ${(parseInt(duration) / 60).toFixed(1)} jam` : '< 1 jam'})</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex gap-2">
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? "Membuat..." : "Buat Lelang"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateAuctionModal;
