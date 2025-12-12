import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AuctionTabs from "./components/auction_tabs";
import AuctionCard from "./components/auction_card";
import Pagination from "./components/auction_pagination";
import AuctionSearch from "./components/auction_search";

const mockFetchAuctions = async () => {
  const response = await fetch("http://localhost:80/node/api/auctions/", {
    method: "GET",
  });

  const data = await response.json();
  // console.log("Fetched auctions:", data);

  return data.map((auction) => ({
    id: auction.auction_id,
    product_name: auction.product_name,
    store_name: auction.store_name,
    image: auction.main_image_path,
    starting_price: auction.starting_price,
    current_price: auction.current_price,
    start_time: new Date(auction.start_time).getTime(),
    end_time: new Date(auction.end_time).getTime(),
    bid_amount: auction.bid_amount,
    status_auction: auction.status_auction,
  }));
};


function Auction() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 4;

  // Check auction feature flag
  useEffect(() => {
    const checkAuctionAccess = async () => {
      try {
        // Get current user
        const userResponse = await fetch("http://localhost:80/node/api/user/me", {
          method: "GET",
          credentials: "include"
        });

        if (!userResponse.ok) {
          console.error("Failed to get user data");
          return;
        }

        const userData = await userResponse.json();
        const userId = userData.data?.user_id || userData.user_id;

        if (!userId) {
          console.error("User ID not found in response");
          return;
        }

        // Check if auction is allowed for this user
        const flagResponse = await fetch(`http://localhost:80/node/api/flags/auction/allowed/${userId}`, {
          method: "GET",
          credentials: "include"
        });

        const flagData = await flagResponse.json();
        const isAllowed = flagData.data?.isAllowed ?? flagData.isAllowed ?? true;
        const reason = flagData.data?.reason || flagData.reason || "Fitur Lelang Produk sedang tidak tersedia";
        
        if (!isAllowed) {
          navigate(`/feature-disabled?feature=auction&reason=${encodeURIComponent(reason)}`);
        }
      } catch (error) {
        console.error("Error checking auction access:", error);
      }
    };

    checkAuctionAccess();
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAuctions = async () => {
      try {
        const data = await mockFetchAuctions();
        if (isMounted) {
          setAuctions(data);
        }
      } catch (error) {
        console.error("Error fetching auctions:", error);
      }
    };

    fetchAuctions();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const filteredAuctions = useMemo(() => {
    return auctions.filter((auction) => {
      const matchesTab =
        activeTab === "active"
          ? auction.status_auction === "active"
          : auction.status_auction === "scheduled";

      const matchesSearch =
        searchQuery === "" ||
        auction.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        auction.store_name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [auctions, activeTab, searchQuery]);

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

  const handleAuctionClick = useCallback((auctionId) => {
    navigate(`/auction/${auctionId}`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Lelang Produk
          </h1>
          <p className="text-gray-600">
            Temukan produk impian Anda dengan harga terbaik
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <AuctionTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="mb-6">
          <AuctionSearch
            onSearch={handleSearch}
            placeholder="Cari produk atau toko..."
          />
        </div>

        {paginatedAuctions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Tidak ada lelang ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {paginatedAuctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                currentTime={currentTime}
                onClick={() => handleAuctionClick(auction.id)}
              />
            ))}
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

export default Auction;