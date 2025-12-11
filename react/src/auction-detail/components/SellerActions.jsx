function SellerActions({ auction, hasBids, onCancelAuction, onStopAuction, isLoading }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Aksi Penjual</h2>

      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Anda adalah penjual dari lelang ini. Anda tidak dapat memasang bid.
          </p>
        </div>

        {!hasBids ? (
          <button
            onClick={onCancelAuction}
            disabled={isLoading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
          >
            {isLoading ? "Memproses..." : "Batalkan Lelang"}
          </button>
        ) : (
          <button
            onClick={onStopAuction}
            disabled={isLoading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
          >
            {isLoading ? "Memproses..." : "Hentikan Lelang"}
          </button>
        )}

        <p className="text-xs text-gray-500 text-center">
          {!hasBids
            ? "Anda dapat membatalkan lelang karena belum ada bid"
            : "Menghentikan lelang akan mengakhiri lelang dan menetapkan pemenang"}
        </p>
      </div>
    </div>
  );
}

export default SellerActions;
