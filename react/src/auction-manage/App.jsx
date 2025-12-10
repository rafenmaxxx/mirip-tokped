import { useState, useEffect } from "react";
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

  const handleViewDetails = (auctionId) => {
    navigate(`/auction/${auctionId}`);
  };

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
          <AuctionList
            auctions={auctions}
            onViewDetails={handleViewDetails}
          />
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
