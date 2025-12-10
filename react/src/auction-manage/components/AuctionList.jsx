import AuctionCard from "./AuctionCard";

function AuctionList({ auctions, onViewDetails }) {
  const activeAuctions = auctions.filter(
    a => a.status_auction === "active" || a.status_auction === "scheduled"
  );
  const endedAuctions = auctions.filter(a => a.status_auction === "ended");
  const cancelledAuctions = auctions.filter(a => a.status_auction === "cancelled");

  return (
    <div className="space-y-8">
      {/* Active/Scheduled Auctions */}
      {activeAuctions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Lelang Aktif & Terjadwal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAuctions.map((auction) => (
              <AuctionCard
                key={auction.auction_id}
                auction={auction}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ended Auctions */}
      {endedAuctions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Lelang Selesai
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {endedAuctions.map((auction) => (
              <AuctionCard
                key={auction.auction_id}
                auction={auction}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Auctions */}
      {cancelledAuctions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Lelang Dibatalkan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cancelledAuctions.map((auction) => (
              <AuctionCard
                key={auction.auction_id}
                auction={auction}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AuctionList;
