import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductInformation from "./components/ProductInformation";
import AuctionInformation from "./components/AuctionInformation";
import BidInput from "./components/BidInput";
import BidHistory from "./components/BidHistory";
import SellerActions from "./components/SellerActions";
import ConfirmationModal from "./components/ConfirmationModal";
import StatusBanner from "./components/StatusBanner";
import AutoCloseCountdown from "./components/AutoCloseCountdown";

function AuctionDetail() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [lastBidTime, setLastBidTime] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        const auctionRes = await fetch(`http://localhost:80/node/api/auctions/${auctionId}`);
        if (!auctionRes.ok) {
          throw new Error(`Failed to fetch auction: ${auctionRes.status}`);
        }
        const auctionData = await auctionRes.json();
        console.log("Fetched auction data:", auctionData);
        
        const bidsRes = await fetch(`http://localhost:80/node/api/auctionbids/${auctionId}`);
        if (!bidsRes.ok) {
          throw new Error(`Failed to fetch bids: ${bidsRes.status}`);
        }
        const bidsData = await bidsRes.json();
        console.log("Fetched bids data:", bidsData);
        
        const userRes = await fetch("http://localhost:80/node/api/user/me", {
          credentials: "include",
        });
        if (!userRes.ok) {
          throw new Error(`Failed to fetch user: ${userRes.status}`);
        }
        const userData = await userRes.json();
        console.log("Fetched user data:", userData);
        
        setAuction(auctionData);
        const bidsArray = Array.isArray(bidsData) ? bidsData : (bidsData.bids || []);
        setBids(bidsArray);
        setCurrentUser(userData);
        
        const initialPrice = bidsArray.length > 0 
          ? bidsArray[0].amount 
          : (auctionData.current_price || auctionData.starting_price);
        setCurrentPrice(initialPrice);
        
        if (bidsArray.length > 0) {
          setLastBidTime(bidsArray[0].created_at);
        }
        
        console.log("All data loaded successfully");
        console.log("Initial price:", initialPrice);
        
      } catch (error) {
        console.error("Error fetching initial data:", error);
        alert(`Error loading auction: ${error.message}`);

        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    if (auctionId) {
      fetchInitialData();
    }
  }, [auctionId]);

  useEffect(() => {
    const updateData = async () => {
      try {
        const auctionRes = await fetch(`http://localhost:80/node/api/auctions/${auctionId}`);
        const auctionData = await auctionRes.json();
        setAuction(auctionData);
        
        const bidsRes = await fetch(`http://localhost:80/node/api/auctionbids/${auctionId}`);
        const bidsData = await bidsRes.json();
        
        const bidsArray = Array.isArray(bidsData) ? bidsData : (bidsData.bids || []);
        setBids(bidsArray);
        
        if (bidsArray.length > 0) {
          setCurrentPrice(bidsArray[0].amount);
          setLastBidTime(bidsArray[0].created_at);
        }
      } catch (error) {
        console.error("Error updating data:", error);
      }
    };

    if (auction) {
      const interval = setInterval(updateData, 5000);
      return () => clearInterval(interval);
    }
  }, [auctionId, auction]);

  const handlePlaceBid = async (amount) => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`http://localhost:80/node/api/auctionbids/${auctionId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_id: currentUser.user_id, amount }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const bidsRes = await fetch(`http://localhost:80/node/api/auctionbids/${auctionId}`);
        const bidsData = await bidsRes.json();
        const bidsArray = Array.isArray(bidsData) ? bidsData : (bidsData.bids || []);
        setBids(bidsArray);
        setCurrentPrice(amount);
        setLastBidTime(new Date().toISOString());
        
        const userRes = await fetch("http://localhost:80/node/api/user/me", {
          credentials: "include",
        });
        const userData = await userRes.json();
        setCurrentUser(userData);
        
        alert("Bid berhasil dipasang!");
      } else {
        alert(data.message || "Gagal memasang bid");
      }
    } catch (error) {
      console.error("Error placing bid:", error);
      alert("Terjadi kesalahan saat memasang bid");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAuction = async () => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`http://localhost:80/node/api/auctions/${auctionId}/cancel`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: "Dibatalkan oleh penjual" }),
      });

      if (response.ok) {
        alert("Lelang berhasil dibatalkan");
        navigate("/auction");
      } else {
        const data = await response.json();
        alert(data.message || "Gagal membatalkan lelang");
      }
    } catch (error) {
      console.error("Error canceling auction:", error);
      alert("Terjadi kesalahan saat membatalkan lelang");
    } finally {
      setActionLoading(false);
      setShowCancelModal(false);
    }
  };

  const handleStopAuction = async () => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`http://localhost:80/node/api/auctions/${auctionId}/stop`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        alert("Lelang berhasil dihentikan");
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.message || "Gagal menghentikan lelang");
      }
    } catch (error) {
      console.error("Error stopping auction:", error);
      alert("Terjadi kesalahan saat menghentikan lelang");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoClose = async () => {
    console.log("Auto-closing auction after 15 seconds of no bids");
    await handleStopAuction();
  };

  const handleStoreClick = () => {
    if (auction?.store_id) {
      window.location.href = `/store?store_id=${auction.store_id}`;
    }
  };

  if (loading || !auction || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat detail lelang...</p>
        </div>
      </div>
    );
  }

  const isSeller = currentUser.user_id === auction.seller_id;
  const isActive = auction.status_auction === "active";
  const isScheduled = auction.status_auction === "scheduled";
  const hasBids = bids.length > 0;
  const canBid = !isSeller && isActive;

  const product = {
    name: auction.product_name,
    image: auction.main_image_path,
    description: auction.product_description,
    quantity: auction.quantity,
  };

  const winner = auction.status_auction === "ended" && bids.length > 0 
    ? { name: bids[0].bidder_name, bid_amount: bids[0].amount }
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <button
            onClick={() => navigate("/auction")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Daftar Lelang
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Detail Lelang</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Status Banner */}
        <StatusBanner
          status={auction.status_auction}
          startTime={new Date(auction.start_time).getTime()}
          winner={winner}

        />

        {/* Auto Close Countdown */}
        {isActive && hasBids && (
          <AutoCloseCountdown 
            lastBidTime={lastBidTime}
            onAutoClose={handleAutoClose}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product and Auction Info */}
          <div className="lg:col-span-2 space-y-6">
            <ProductInformation
              product={product}
              storeName={auction.store_name}
              onStoreClick={handleStoreClick}
            />

            <AuctionInformation
              auction={{
                starting_price: auction.starting_price,
                min_increment: auction.min_increment,
                start_time: new Date(auction.start_time).getTime(),
                end_time: new Date(auction.end_time).getTime(),
              }}
              currentPrice={currentPrice}
            />

            <BidHistory
              bids={bids}
              currentUserId={currentUser.user_id}
              totalBidders={auction.bid_amount || 0}
            />
          </div>

          {/* Bid Input or Seller Actions */}
          <div className="lg:col-span-1">
            {isSeller ? (
              isActive && (
                <SellerActions
                  auction={auction}
                  hasBids={hasBids}
                  onCancelAuction={() => setShowCancelModal(true)}
                  onStopAuction={handleStopAuction}
                  isLoading={actionLoading}
                />
              )
            ) : canBid ? (
              <BidInput
                currentPrice={currentPrice}
                minIncrement={auction.min_increment}
                userBalance={currentUser.balance || 0}
                onPlaceBid={handlePlaceBid}
                isLoading={actionLoading}
              />
            ) : isScheduled ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center text-gray-600">
                  <p className="mb-2">Lelang belum dimulai</p>
                  <p className="text-sm">Tunggu hingga lelang aktif untuk memasang bid</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center text-gray-600">
                  <p>Lelang telah berakhir</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelAuction}
        title="Batalkan Lelang"
        message="Apakah Anda yakin ingin membatalkan lelang ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Batalkan"
        cancelText="Tidak"
        isDestructive={true}
      />
    </div>
  );
}

export default AuctionDetail;