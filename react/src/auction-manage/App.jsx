import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AuctionList from "./components/AuctionList";
import CreateAuctionModal from "./components/CreateAuctionModal";

function AuctionManage() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeAuction, setActiveAuction] = useState(null);
  const [activeTab, setActiveTab] = useState("active"); // active, ended, cancelled
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    fetchUserAndAuctions();
  }, []);

  const fetchUserAndAuctions = async () => {
    try {
      setLoading(true);
      
      const userRes = await fetch("http://localhost:80/node/api/user/me", {
        credentials: "include",
      });
      
      if (!userRes.ok) {
        window.location.href = "/login";
        return;
      }
      
      const userData = await userRes.json();
      console.log("Fetched user response:", userData);
      setUser(userData.data);

      const storeRes = await fetch(`http://localhost:80/node/api/store/${userData.data.user_id}`, {
        credentials: "include",
      });
      
      if (!storeRes.ok) {
        throw new Error("Failed to fetch store");
      }
      
      const storeData = await storeRes.json();
      console.log("Fetched store data:", storeData);
      
      if (!storeData.store_id) {
        alert("Anda belum memiliki toko. Silakan buat toko terlebih dahulu.");
        navigate("/");
        return;
      }
      
      setStore(storeData);

      const auctionsRes = await fetch(`http://localhost:80/node/api/auctions/store/${storeData.store_id}`, {
        credentials: "include",
      });
      const sellerAuctions = await auctionsRes.json();
      
      console.log("Fetched auctions data:", sellerAuctions);
   
      sellerAuctions.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      setAuctions(sellerAuctions);
      
      const active = sellerAuctions.find(
        auction => auction.status_auction === "active" || auction.status_auction === "scheduled"
      );
      setActiveAuction(active || null);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAuction = () => {
    if (activeAuction) {
      alert("Anda sudah memiliki lelang yang sedang berjalan. Hentikan lelang tersebut terlebih dahulu.");
      return;
    }
    setShowCreateModal(true);
  };

  const handleAuctionCreated = () => {
    setShowCreateModal(false);
    fetchUserAndAuctions();
  };

  const handleViewDetails = useCallback((auctionId) => {
    navigate(`/auction/${auctionId}`);
  }, [navigate]);

  // Filter auctions by status
  const activeAuctions = useMemo(() => 
    auctions.filter(a => a.status_auction === "active" || a.status_auction === "scheduled"),
    [auctions]
  );
  
  const endedAuctions = useMemo(() => 
    auctions.filter(a => a.status_auction === "ended"),
    [auctions]
  );
  
  const cancelledAuctions = useMemo(() => 
    auctions.filter(a => a.status_auction === "cancelled"),
    [auctions]
  );

  const getFilteredAuctions = useCallback(() => {
    switch (activeTab) {
      case "active":
        return activeAuctions;
      case "ended":
        return endedAuctions;
      case "cancelled":
        return cancelledAuctions;
      default:
        return activeAuctions;
    }
  }, [activeTab, activeAuctions, endedAuctions, cancelledAuctions]);

  const filteredAuctions = getFilteredAuctions();
  
  const totalPages = useMemo(
    () => Math.ceil(filteredAuctions.length / itemsPerPage),
    [filteredAuctions.length, itemsPerPage]
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const paginatedAuctions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAuctions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAuctions, currentPage, itemsPerPage]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data lelang...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Kelola Lelang</h1>
              <p className="text-gray-600 mt-1">Kelola lelang produk toko Anda</p>
            </div>
            <button
              onClick={handleCreateAuction}
              disabled={!!activeAuction}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeAuction
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              + Buat Lelang Baru
            </button>
          </div>
          
          {activeAuction && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-yellow-900">
                    Anda memiliki lelang yang sedang {activeAuction.status_auction === "active" ? "aktif" : "dijadwalkan"}
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Hanya satu lelang yang dapat berjalan dalam satu waktu. Hentikan atau batalkan lelang tersebut untuk membuat lelang baru.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {auctions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum Ada Lelang</h3>
            <p className="text-gray-600 mb-6">Mulai buat lelang pertama Anda untuk produk toko</p>
            <button
              onClick={handleCreateAuction}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              + Buat Lelang Baru
            </button>
          </div>
        ) : (
          <div>
            {/* Tabs */}
            <div className="flex gap-8 border-b-2 border-gray-200 mb-8">
              <button
                onClick={() => handleTabChange("active")}
                className={`pb-3 px-0 text-base font-semibold border-b-2 -mb-0.5 transition-colors ${
                  activeTab === "active"
                    ? "text-green-600 border-green-600"
                    : "text-gray-600 border-transparent hover:text-gray-800"
                }`}
              >
                Aktif & Terjadwal
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  activeTab === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {activeAuctions.length}
                </span>
              </button>
              <button
                onClick={() => handleTabChange("ended")}
                className={`pb-3 px-0 text-base font-semibold border-b-2 -mb-0.5 transition-colors ${
                  activeTab === "ended"
                    ? "text-green-600 border-green-600"
                    : "text-gray-600 border-transparent hover:text-gray-800"
                }`}
              >
                Selesai
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  activeTab === "ended"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {endedAuctions.length}
                </span>
              </button>
              <button
                onClick={() => handleTabChange("cancelled")}
                className={`pb-3 px-0 text-base font-semibold border-b-2 -mb-0.5 transition-colors ${
                  activeTab === "cancelled"
                    ? "text-green-600 border-green-600"
                    : "text-gray-600 border-transparent hover:text-gray-800"
                }`}
              >
                Dibatalkan
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  activeTab === "cancelled"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {cancelledAuctions.length}
                </span>
              </button>
            </div>

            {/* Auction List */}
            {paginatedAuctions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  {activeTab === "active" && "Tidak ada lelang yang aktif atau terjadwal"}
                  {activeTab === "ended" && "Tidak ada lelang yang selesai"}
                  {activeTab === "cancelled" && "Tidak ada lelang yang dibatalkan"}
                </p>
              </div>
            ) : (
              <>
                <AuctionList
                  auctions={paginatedAuctions}
                  onViewDetails={handleViewDetails}
                />
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sebelumnya
                    </button>

                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-md font-medium ${
                            currentPage === page
                              ? "bg-green-600 text-white"
                              : "border border-gray-300 bg-white hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Auction Modal */}
      {showCreateModal && (
        <CreateAuctionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleAuctionCreated}
          userId={user?.user_id}
          storeId={store?.store_id}
        />
      )}
    </div>
  );
}

export default AuctionManage;
