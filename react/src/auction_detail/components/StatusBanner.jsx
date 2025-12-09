const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

function StatusBanner({ status, startTime, winner }) {
  const now = Date.now();

  if (status === "scheduled") {
    const timeUntilStart = startTime - now;
    const hours = Math.floor(timeUntilStart / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-orange-900 mb-1">Lelang Akan Dimulai</h3>
            <p className="text-sm text-orange-800">
              Lelang akan dimulai dalam {hours} jam {minutes} menit. Bid belum dapat dilakukan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-green-900 mb-1">Lelang Sedang Berlangsung</h3>
            <p className="text-sm text-green-800">
              Lelang sedang aktif. Pasang bid Anda sekarang!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "ended") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">Lelang Telah Berakhir</h3>
            {winner ? (
              <div className="text-sm text-blue-800">
                <p className="mb-2">Pemenang: <span className="font-semibold">{winner.name}</span></p>
                <p>Harga Akhir: <span className="font-semibold">{formatCurrency(winner.bid_amount)}</span></p>
              </div>
            ) : (
              <p className="text-sm text-blue-800">Lelang berakhir tanpa pemenang.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Lelang Dibatalkan</h3>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default StatusBanner;
