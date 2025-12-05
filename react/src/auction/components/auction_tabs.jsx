function AuctionTabs({ activeTab, onTabChange }) {
  return (
    <div className="flex gap-8 border-b-2 border-gray-200 mb-8">
      <button
        onClick={() => onTabChange("active")}
        className={`pb-3 px-0 text-base font-semibold border-b-2 -mb-0.5 transition-colors ${
          activeTab === "active"
            ? "text-green-600 border-green-600"
            : "text-gray-600 border-transparent hover:text-gray-800"
        }`}
      >
        Lelang Aktif
      </button>
      <button
        onClick={() => onTabChange("scheduled")}
        className={`pb-3 px-0 text-base font-semibold border-b-2 -mb-0.5 transition-colors ${
          activeTab === "scheduled"
            ? "text-green-600 border-green-600"
            : "text-gray-600 border-transparent hover:text-gray-800"
        }`}
      >
        Lelang Akan Datang
      </button>
    </div>
  );
}

export default AuctionTabs;