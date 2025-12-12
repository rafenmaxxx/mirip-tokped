import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AuctionList from "./components/AuctionList";
import CreateAuctionModal from "./components/CreateAuctionModal";
import { showToast } from "../lib/toast";

function AuctionManage() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeAuction, setActiveAuction] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  
  // Cursor-based pagination states
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const itemsPerPage = 4;

  // Tab counts
  const [tabCounts, setTabCounts] = useState({
    active: 0,
    ended: 0,
    cancelled: 0
  });

  useEffect(() => {
    fetchUserAndStore();
  }, []);

  useEffect(() => {
    if (store) {
      fetchAuctions(true); // Reset and fetch from beginning when tab changes
    }
  }, [activeTab, store]);

  const fetchUserAndStore = async () => {
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
        showToast("Anda belum memiliki toko. Silakan buat toko terlebih dahulu.", "warning");
        navigate("/");
        return;
      }
      
      setStore(storeData);
      
      // Fetch initial tab counts
      await fetchTabCounts(storeData.store_id);
      
    } catch (error) {
      console.error("Error fetching user and store:", error);
      showToast("Gagal memuat data: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTabCounts = async (storeId) => {
    try {
      // Fetch counts for all tabs
      const [activeRes, endedRes, cancelledRes] = await Promise.all([
        fetch(`http://localhost:80/node/api/auctions/store/${storeId}/paginated?status=active&limit=1`, {
          credentials: "include",
        }),
        fetch(`http://localhost:80/node/api/auctions/store/${storeId}/paginated?status=ended&limit=1`, {
          credentials: "include",
        }),
        fetch(`http://localhost:80/node/api/auctions/store/${storeId}/paginated?status=cancelled&limit=1`, {
          credentials: "include",
        })
      ]);

      const activeData = await activeRes.json();
      const endedData = await endedRes.json();
      const cancelledData = await cancelledRes.json();

      setTabCounts({
        active: activeData.pagination?.count || 0,
        ended: endedData.pagination?.count || 0,
        cancelled: cancelledData.pagination?.count || 0
      });
    } catch (error) {
      console.error("Error fetching tab counts:", error);
    }
  };

  const fetchAuctions = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setAuctions([]);
        setNextCursor(null);
      } else {
        setLoadingMore(true);
      }
      
      // Build query params
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        status: activeTab,
        ...(nextCursor && !reset && { cursor: nextCursor.toString() })
      });
      
      const auctionsRes = await fetch(
        `http://localhost:80/node/api/auctions/store/${store.store_id}/paginated?${params}`,
        { credentials: "include" }
      );
      
      if (!auctionsRes.ok) {
        throw new Error("Failed to fetch auctions");
      }
      
      const result = await auctionsRes.json();
      console.log("Fetched auctions data:", result);
      
      // Append or replace auctions
      setAuctions(prev => reset ? result.data : [...prev, ...result.data]);
      setNextCursor(result.pagination.nextCursor);
      setHasMore(result.pagination.hasMore);
      
      // Update active auction
      const active = result.data.find(
        auction => auction.status_auction === "active"
      );
      if (active) {
        setActiveAuction(active);
      } else if (reset) {
        // If resetting and no active auction found in first page, clear it
        setActiveAuction(null);
      }
      
    } catch (error) {
      console.error("Error fetching auctions:", error);
      showToast("Gagal memuat data lelang: " + error.message, "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleCreateAuction = () => {
    if (activeAuction) {
      showToast("Anda sudah memiliki lelang yang sedang berjalan. Hentikan lelang tersebut terlebih dahulu.", "warning");
      return;
    }
    setShowCreateModal(true);
  };

  const handleAuctionCreated = () => {
    setShowCreateModal(false);
    fetchUserAndStore(); // Refresh all data including tab counts
  };

  const handleViewDetails = useCallback((auctionId) => {
    navigate(`/auction/${auctionId}`);
  }, [navigate]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    // Fetch will be triggered by useEffect
  }, []);

  const handleLoadMore = () => {
    fetchAuctions(false);
  };

  if (loading && auctions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data lelang...</p>
        </div>
      </div>
    );
  }

  const totalAuctions = tabCounts.active + tabCounts.ended + tabCounts.cancelled;

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
        {totalAuctions === 0 ? (
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
                  {tabCounts.active}
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
                  {tabCounts.ended}
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
                  {tabCounts.cancelled}
                </span>
              </button>
            </div>

            {/* Auction List */}
            {auctions.length === 0 && !loading ? (
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
                  auctions={auctions}
                  onViewDetails={handleViewDetails}
                />
                
                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-6 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {loadingMore ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          <span>Memuat...</span>
                        </div>
                      ) : (
                        'Muat Lebih Banyak'
                      )}
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