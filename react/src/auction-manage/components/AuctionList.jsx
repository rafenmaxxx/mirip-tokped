import AuctionCard from "./AuctionCard";

function AuctionList({ auctions, onViewDetails }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {auctions.map((auction) => (
        <AuctionCard
          key={auction.auction_id}
          auction={auction}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}

export default AuctionList;
