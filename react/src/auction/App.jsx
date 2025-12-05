import { useState, useEffect, useMemo } from "react";
import AuctionTabs from "./components/auction_tabs";
import AuctionCard from "./components/auction_card";
import Pagination from "./components/auction_pagination";

const generateMockAuctions = () => {
  const now = Date.now();
  return [
    {
      id: 1,
      productName: "MacBook Pro M3 14 inch",
      storeName: "TechGear Indonesia",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop",
      currentBid: 28000000,
      startingPrice: 25000000,
      startTime: now - 1800000,
      endTime: now + 5400000,
      bidders: 45,
      status: "active"
    },
    {
      id: 2,
      productName: "Sony PlayStation 5 Bundle",
      storeName: "GameZone Store",
      image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&h=300&fit=crop",
      currentBid: 7800000,
      startingPrice: 7000000,
      startTime: now - 5400000,
      endTime: now + 3600000,
      bidders: 67,
      status: "active"
    },
    {
      id: 3,
      productName: "Samsung Galaxy S24 Ultra",
      storeName: "Samsung Official Store",
      image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop",
      currentBid: null,
      startingPrice: 16000000,
      startTime: now + 3600000,
      endTime: now + 14400000,
      bidders: 0,
      status: "scheduled"
    },
    {
      id: 4,
      productName: "iPad Air M2 128GB",
      storeName: "Apple Store Official",
      image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop",
      currentBid: 8200000,
      startingPrice: 8000000,
      startTime: now - 7200000,
      endTime: now + 1800000,
      bidders: 34,
      status: "active"
    },
    {
      id: 5,
      productName: "Nintendo Switch OLED",
      storeName: "GameZone Store",
      image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=300&fit=crop",
      currentBid: null,
      startingPrice: 4500000,
      startTime: now + 7200000,
      endTime: now + 18000000,
      bidders: 0,
      status: "scheduled"
    },
    {
      id: 6,
      productName: "AirPods Pro Gen 2",
      storeName: "Audio Premium Store",
      image: "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400&h=300&fit=crop",
      currentBid: 3200000,
      startingPrice: 3000000,
      startTime: now - 900000,
      endTime: now + 10800000,
      bidders: 12,
      status: "active"
    },
    {
      id: 7,
      productName: "Apple Watch Series 9",
      storeName: "Apple Store Official",
      image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=300&fit=crop",
      currentBid: null,
      startingPrice: 6500000,
      startTime: now + 5400000,
      endTime: now + 16200000,
      bidders: 0,
      status: "scheduled"
    },
    {
      id: 8,
      productName: "Canon EOS R6 Mark II",
      storeName: "Camera Pro Indonesia",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop",
      currentBid: 38500000,
      startingPrice: 35000000,
      startTime: now - 10800000,
      endTime: now + 900000,
      bidders: 18,
      status: "active"
    },
    {
      id: 9,
      productName: "DJI Mavic 3 Pro",
      storeName: "Drone World Store",
      image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=300&fit=crop",
      currentBid: null,
      startingPrice: 32000000,
      startTime: now + 10800000,
      endTime: now + 21600000,
      bidders: 0,
      status: "scheduled"
    },
    {
      id: 10,
      productName: "Bose QuietComfort Ultra",
      storeName: "Audio Premium Store",
      image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=300&fit=crop",
      currentBid: 5100000,
      startingPrice: 5000000,
      startTime: now - 5400000,
      endTime: now + 5400000,
      bidders: 29,
      status: "active"
    },
    {
      id: 11,
      productName: "Lenovo Legion 5 Pro",
      storeName: "TechGear Indonesia",
      image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop",
      currentBid: null,
      startingPrice: 18000000,
      startTime: now + 14400000,
      endTime: now + 25200000,
      bidders: 0,
      status: "scheduled"
    }
  ];
};

function Auction() {
  const [auctions, setAuctions] = useState(generateMockAuctions());
  const [activeTab, setActiveTab] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const itemsPerPage = 4;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
      
      setAuctions(prev => prev.map(auction => {
        if (auction.status === "scheduled" && Date.now() >= auction.startTime) {
          return { ...auction, status: "active", bidders: 1 };
        }
        return auction;
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const filteredAuctions = useMemo(() => {
    return auctions.filter(auction => {
      return activeTab === "active" 
        ? auction.status === "active" 
        : auction.status === "scheduled";
    });
  }, [auctions, activeTab]);

  const totalPages = Math.ceil(filteredAuctions.length / itemsPerPage);
  const paginatedAuctions = filteredAuctions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleAuctionClick = (auctionId) => {
    alert(`Navigate to auction detail: ${auctionId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
        {/* Tabs */}
        <AuctionTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Auction Grid */}
        {paginatedAuctions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Tidak ada lelang ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6 mb-8">
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

        {/* Pagination */}
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