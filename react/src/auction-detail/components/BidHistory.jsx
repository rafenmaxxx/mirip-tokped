import { useState } from "react";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function BidHistory({ bids, currentUserId, totalBidders }) {
  const [displayCount, setDisplayCount] = useState(10);

  const visibleBids = bids.slice(0, displayCount);
  const hasMore = displayCount < bids.length;

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + 10, bids.length));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Riwayat Bid</h2>
        <div className="text-sm text-gray-600">
          Total <span className="font-semibold text-green-600">{totalBidders}</span> pembeli
        </div>
      </div>

      {bids.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Belum ada bid untuk lelang ini
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Pembeli
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                    Jumlah Bid
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                    Waktu
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleBids.map((bid, index) => {
                  const isCurrentUser = bid.bidder_id === currentUserId;
                  const isHighest = index === 0;
                  
                  return (
                    <tr
                      key={bid.bid_id}
                      className={`border-b border-gray-100 ${
                        isCurrentUser ? "bg-green-50" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isCurrentUser ? "text-green-700" : ""}`}>
                            {isCurrentUser ? "Anda" : bid.bidder_name || "Anonim"}
                          </span>
                          {isHighest && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                              Tertinggi
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        isCurrentUser ? "text-green-700" : "text-gray-900"
                      }`}>
                        {formatCurrency(bid.amount)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600">
                        {formatTime(bid.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              >
                Muat Lebih Banyak
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BidHistory;
