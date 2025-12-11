import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductInformation from "./components/ProductInformation";
import AuctionInformation from "./components/AuctionInformation";
import BidInput from "./components/BidInput";
import BidHistory from "./components/BidHistory";
import SellerActions from "./components/SellerActions";
import ConfirmationModal from "./components/ConfirmationModal";
import StatusBanner from "./components/StatusBanner";
import AutoCloseCountdown from "./components/AutoCloseCountdown";
import { socketManager } from "../chat/lib/socket";

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

  // Handler untuk new bid dari socket
  const handleNewBid = useCallback(
    (bidData) => {
      console.log("New bid received via socket:", bidData);

      // Update state dengan bid baru
      setBids((prevBids) => {
        // Cek apakah bid sudah ada (untuk menghindari duplikat)
        const isDuplicate = prevBids.some(
          (bid) =>
            bid.bid_id === bidData.bid_id ||
            (bid.user_id === bidData.user_id && bid.amount === bidData.amount)
        );

        if (isDuplicate) return prevBids;

        // Tambahkan bid baru di urutan pertama (terbaru)
        const updatedBids = [bidData, ...prevBids];

        // Update current price
        setCurrentPrice(bidData.amount);
        setLastBidTime(bidData.created_at);

        // Update auction bid count
        setAuction((prev) =>
          prev
            ? {
                ...prev,
                bid_amount: (prev.bid_amount || 0) + 1,
              }
            : null
        );

        return updatedBids;
      });

      // Notification (optional)
      if (
        currentUser?.user_id !== bidData.user_id &&
        Notification.permission === "granted"
      ) {
        new Notification("Bid Baru!", {
          body: `${
            bidData.bidder_name
          } menawar: Rp ${bidData.amount.toLocaleString()}`,
          icon: "/notification-icon.png",
        });
      }
    },
    [currentUser?.user_id]
  );

  const handleAuctionUpdate = useCallback((auctionData) => {
    setAuction((prev) => ({ ...prev, ...auctionData }));
  }, []);

  const handleAuctionEnded = useCallback(() => {
    setAuction((prev) => (prev ? { ...prev, status_auction: "ended" } : null));
    alert("Lelang telah berakhir!");
    // fetchAuctionData();
  }, []);

  const handleAuctionCancelled = useCallback(() => {
    setAuction((prev) =>
      prev ? { ...prev, status_auction: "cancelled" } : null
    );
    alert("Lelang telah dibatalkan!");
    navigate("/auction");
  }, [navigate]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        const [auctionRes, bidsRes, userRes] = await Promise.all([
          fetch(`http://localhost:80/node/api/auctions/${auctionId}`),
          fetch(`http://localhost:80/node/api/auctionbids/${auctionId}`),
          fetch("http://localhost:80/node/api/user/me", {
            credentials: "include",
          }),
        ]);

        if (!auctionRes.ok)
          throw new Error(`Failed to fetch auction: ${auctionRes.status}`);
        if (!bidsRes.ok)
          throw new Error(`Failed to fetch bids: ${bidsRes.status}`);
        if (!userRes.ok)
          throw new Error(`Failed to fetch user: ${userRes.status}`);

        const [auctionData, bidsData, userData] = await Promise.all([
          auctionRes.json(),
          bidsRes.json(),
          userRes.json(),
        ]);

        const bidsArray = Array.isArray(bidsData)
          ? bidsData
          : bidsData.bids || [];

        setAuction(auctionData);
        setBids(bidsArray);
        setCurrentUser(userData.data);

        const initialPrice =
          bidsArray.length > 0
            ? bidsArray[0].amount
            : auctionData.current_price || auctionData.starting_price;
        setCurrentPrice(initialPrice);

        if (bidsArray.length > 0) {
          setLastBidTime(bidsArray[0].created_at);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        alert(`Error loading auction: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (auctionId) {
      fetchInitialData();
    }
  }, [auctionId]);

  const handlePlaceBid = async (bidAmount) => {
    if (!currentUser?.user_id) {
      alert("Harus login untuk menawar");
      return;
    }

    if (!auctionId) {
      console.error("Auction ID tidak ditemukan");
      return;
    }

    // Validasi bid amount
    const minBid = currentPrice + auction.min_increment;
    if (bidAmount < minBid) {
      alert(`Bid minimal adalah Rp ${minBid.toLocaleString()}`);
      return;
    }

    // Validasi saldo
    if (bidAmount > currentUser.balance) {
      alert("Saldo tidak mencukupi");
      return;
    }

    try {
      setActionLoading(true);

      const payload = {
        auctionId,
        userId: currentUser.user_id,
        amount: bidAmount,
        // server akan ambil bidderName dari database
      };

      console.log("Sending bid via socket:", payload);

      // Kirim via socket
      const sent = socketManager.sendBid(payload);

      if (!sent) {
        throw new Error("Socket tidak terhubung");
      }
    } catch (error) {
      console.error("Error placing bid:", error);
      alert("Gagal mengirim bid: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAuction = async () => {
    try {
      setActionLoading(true);

      const response = await fetch(
        `http://localhost:80/node/api/auctions/${auctionId}/cancel`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason: "Dibatalkan oleh penjual" }),
        }
      );

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

      const response = await fetch(
        `http://localhost:80/node/api/auctions/${auctionId}/stop`,
        {
          method: "POST",
          credentials: "include",
        }
      );

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

  // Gunakan useEffect terpisah untuk socket
  useEffect(() => {
    if (!auctionId || !currentUser?.user_id) return;

    console.log(`[Frontend] Setting up socket for auction ${auctionId}`);

    // Pastikan socket terhubung
    if (!socketManager.socket?.connected) {
      socketManager.connect("http://localhost:80");

      // Tunggu koneksi
      socketManager.socket.once("connect", () => {
        setupSocketListeners();
      });
    } else {
      setupSocketListeners();
    }

    function setupSocketListeners() {
      // Join room
      socketManager.joinAuctionRoom(auctionId, currentUser.user_id);

      // Setup listeners
      socketManager.on("new_bid", handleNewBid);
      socketManager.on("auction_updated", handleAuctionUpdate);
      socketManager.on("auction_ended", handleAuctionEnded);
      socketManager.on("auction_cancelled", handleAuctionCancelled);

      // Tambahkan debug listener
      socketManager.on("auction_room_joined", (data) => {
        console.log(`[Frontend] Joined auction room:`, data);
      });

      socketManager.on("error_message", (error) => {
        console.error("[Frontend] Socket error:", error);
      });
    }

    return () => {
      // Cleanup listeners
      socketManager.off("new_bid", handleNewBid);
      socketManager.off("auction_updated", handleAuctionUpdate);
      socketManager.off("auction_ended", handleAuctionEnded);
      socketManager.off("auction_cancelled", handleAuctionCancelled);
      socketManager.off("auction_room_joined");
      socketManager.off("error_message");

      // Leave room jika perlu
      if (auctionId && currentUser?.user_id) {
        socketManager.leaveAuctionRoom(auctionId);
      }
    };
  }, [auctionId, currentUser?.user_id]); // ← hanya depend on user_id

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

  const winner =
    auction.status_auction === "ended" && bids.length > 0
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
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
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
                userBalance={currentUser.balance}
                onPlaceBid={handlePlaceBid}
                isLoading={actionLoading}
              />
            ) : isScheduled ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center text-gray-600">
                  <p className="mb-2">Lelang belum dimulai</p>
                  <p className="text-sm">
                    Tunggu hingga lelang aktif untuk memasang bid
                  </p>
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
