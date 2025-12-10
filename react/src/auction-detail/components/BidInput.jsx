import { useState } from "react";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

function BidInput({ currentPrice, minIncrement, userBalance, onPlaceBid, isLoading }) {
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  
  const minimumBid = currentPrice + minIncrement;

  const handleSubmit = () => {
    setError("");
    
    if (bidAmount === "") {
      setError("Masukkan jumlah bid");
      return;
    }

    const amount = parseInt(bidAmount);

    if (isNaN(amount) || amount <= 0) {
      setError("Jumlah bid harus berupa angka positif");
      return;
    }

    if (amount < minimumBid) {
      setError(`Bid minimum adalah ${formatCurrency(minimumBid)}`);
      return;
    }

    if (amount > userBalance) {
      setError("Saldo tidak mencukupi");
      return;
    }

    // All validations passed
    onPlaceBid(amount);
    setBidAmount("");
  };

  const handleQuickBid = (amount) => {
    setBidAmount(amount.toString());
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Hanya izinkan angka, jika ada karakter non-angka maka kosongkan
    if (value === "" || /^\d+$/.test(value)) {
      setBidAmount(value);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Pasang Bid</h2>

      {/* User Balance */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Saldo Anda</span>
          <span className="text-xl font-bold text-blue-600">
            {formatCurrency(userBalance)}
          </span>
        </div>
      </div>

      {/* Minimum Bid Requirement */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Bid Minimum</span>
          <span className="text-lg font-semibold text-gray-900">
            {formatCurrency(minimumBid)}
          </span>
        </div>
      </div>

      {/* Quick Bid Buttons */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Bid Cepat
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickBid(minimumBid)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Min Bid
          </button>
          <button
            type="button"
            onClick={() => handleQuickBid(minimumBid + minIncrement)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            +{formatCurrency(minIncrement)}
          </button>
          <button
            type="button"
            onClick={() => handleQuickBid(minimumBid + minIncrement * 2)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            +{formatCurrency(minIncrement * 2)}
          </button>
        </div>
      </div>

      {/* Bid Amount Input */}
      <div>
        <div className="mb-4">
          <label htmlFor="bidAmount" className="block text-sm font-semibold text-gray-700 mb-2">
            Jumlah Bid
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              Rp
            </span>
            <input
              type="text"
              id="bidAmount"
              value={bidAmount}
              onChange={handleInputChange}
              placeholder="0"
              className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                error
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-green-500"
              }`}
              disabled={isLoading}
            />
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
            isLoading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isLoading ? "Memproses..." : "Pasang Bid"}
        </button>
      </div>
    </div>
  );
}

export default BidInput;
