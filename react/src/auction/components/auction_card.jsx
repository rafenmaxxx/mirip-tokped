import AuctionTimer from "./auction_timer";

function AuctionCard({ auction, currentTime, onClick }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getImageUrl = (path) => {
    return path && path !== "" ? `/api/image?file=${path}` : "no-image.png";
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer flex flex-col items-center"
    >
      <div className="w-full aspect-square overflow-hidden rounded-lg mb-2 relative">
        <img
          src={getImageUrl(auction.image)}
          alt={auction.product_name}
          className="w-full h-full object-cover rounded-lg"
        />
        <div
          className={`absolute top-2 right-2 px-3 py-1 rounded text-xs font-semibold text-white ${
            auction.status_auction === "active" ? "bg-green-600" : "bg-orange-500"
          }`}
        >
          {auction.status_auction === "active" ? "AKTIF" : "AKAN DATANG"}
        </div>
      </div>

      <div className="w-full flex flex-col items-start">
        <h3 className="font-semibold mt-2 text-left text-base leading-snug">
          {auction.product_name}
        </h3>

        <p className="font-light text-sm text-left text-gray-600 mt-1">
          {auction.bid_amount || 0} pembeli
        </p>

        <p className="text-green-600 font-bold my-2 text-lg">
          {formatCurrency(auction.current_price || auction.starting_price)}
        </p>

        <AuctionTimer auction={auction} currentTime={currentTime} />

        <p className="text-sm text-gray-700 w-full text-right mt-3">
          {auction.store_name}
        </p>
      </div>
    </div>
  );
}

export default AuctionCard;