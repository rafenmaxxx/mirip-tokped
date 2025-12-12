import { useEffect, useState } from "react";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function CountdownTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeLeft("Lelang Berakhir");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}h ${hours}j ${minutes}m ${seconds}d`);
      } else {
        setTimeLeft(`${hours}j ${minutes}m ${seconds}d`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className="text-2xl font-bold text-red-600">
      {timeLeft}
    </div>
  );
}

function AuctionInformation({ auction, currentPrice }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Informasi Lelang</h2>

      <div className="space-y-4">
        {/* Starting Price */}
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-600">Harga Awal</span>
          <span className="text-lg font-semibold">{formatCurrency(auction.starting_price)}</span>
        </div>

        {/* Highest Bid */}
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-600">Bid Tertinggi Saat Ini</span>
          <span className="text-xl font-bold text-green-600">
            {formatCurrency(currentPrice)}
          </span>
        </div>

        {/* Minimum Increment */}
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-600">Kelipatan Bid Minimum</span>
          <span className="text-lg font-semibold">{formatCurrency(auction.min_increment)}</span>
        </div>

        {/* Start Time */}
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-600">Waktu Mulai</span>
          <span className="text-sm">{formatDateTime(auction.start_time)}</span>
        </div>

        {/* End Time */}
        <div className="flex justify-between items-center py-3">
          <span className="text-gray-600">Waktu Berakhir</span>
          <span className="text-sm">{formatDateTime(auction.end_time)}</span>
        </div>
      </div>
    </div>
  );
}

export default AuctionInformation;
