function AuctionTimer({ auction, currentTime }) {
  const formatCountdown = (targetTime, currentTime) => {
    const diff = targetTime - currentTime;
    if (diff <= 0) return "Berakhir";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}d`;
  };

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isActive = auction.status_auction === "active";

  return (
    <div
      className={`w-full rounded-md p-2 mt-2 ${
        isActive ? "bg-yellow-50" : "bg-blue-50"
      }`}
    >
      <p
        className={`text-xs font-medium mb-1 ${
          isActive ? "text-yellow-700" : "text-blue-700"
        }`}
      >
        {isActive ? "Berakhir dalam:" : "Mulai:"}
      </p>
      <p
        className={`text-sm font-bold ${
          isActive ? "text-yellow-800" : "text-blue-800"
        }`}
      >
        {isActive
          ? formatCountdown(auction.end_time, currentTime)
          : formatDateTime(auction.start_time)}
      </p>
    </div>
  );
}

export default AuctionTimer;