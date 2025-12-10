const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getImageUrl = (path) => {
  return path && path !== "" ? `/api/image?file=${path}` : "no-image.png";
};

function AuctionCard({ auction, onViewDetails }) {
  const isActive = auction.status_auction === "active";
  const isScheduled = auction.status_auction === "scheduled";
  const isEnded = auction.status_auction === "ended";
  const isCancelled = auction.status_auction === "cancelled";

  const getStatusBadge = () => {
    if (isActive) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
          🟢 Aktif
        </span>
      );
    }
    if (isScheduled) {
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
          🕐 Terjadwal
        </span>
      );
    }
    if (isEnded) {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
          ✓ Selesai
        </span>
      );
    }
    if (isCancelled) {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
          ✕ Dibatalkan
        </span>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden">
      {/* Product Image */}
      <div className="aspect-video bg-gray-100 relative">
        <img
          src={getImageUrl(auction.main_image_path)}
          alt={auction.product_name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = "/img/placeholder.png";
          }}
        />
        <div className="absolute top-3 right-3">{getStatusBadge()}</div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {auction.product_name}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Harga Awal:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(auction.starting_price)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Harga Saat Ini:</span>
            <span className="font-bold text-green-600">
              {formatCurrency(auction.current_price || auction.starting_price)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Min. Increment:</span>
            <span className="font-medium text-gray-700">
              {formatCurrency(auction.min_increment)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Bid:</span>
            <span className="font-medium text-blue-600">
              {auction.bid_amount || 0} bid
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-3 mb-4">
          <div className="text-xs text-gray-500">
            <p>Mulai: {formatDate(auction.start_time)}</p>
            {auction.end_time && (
              <p className="mt-1">Berakhir: {formatDate(auction.end_time)}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => onViewDetails(auction.auction_id)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Lihat Detail
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuctionCard;
