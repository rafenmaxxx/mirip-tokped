import React, { useState, useEffect, useRef, useCallback } from "react";

const IconUser = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

const IconSearch = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <circle
      cx="11"
      cy="11"
      r="8"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
    />
    <path
      d="M21 21l-4.35-4.35"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
    />
  </svg>
);

const IconPlus = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
    />
  </svg>
);

const IconCheck = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      d="M5 13l4 4L19 7"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
    />
  </svg>
);

const IconCheckDouble = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      d="M3 12l4 4 4-4M13 12l4 4 4-4"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
    />
  </svg>
);

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

function ChatSidebar({
  rooms: initialRooms,
  selectedRoom,
  onSelect,
  currentUser,
  socket,
  onNewRoomCreated,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortedRooms, setSortedRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [storesForNewChat, setStoresForNewChat] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");
  const [isLoadingStores, setIsLoadingStores] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedNewChatSearch = useDebounce(newChatSearch, 300);

  const formatTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  }, []);

  const truncateText = useCallback((text, length = 50) => {
    if (!text) return "Belum ada pesan";
    const str = String(text);
    return str.length > length ? str.substring(0, length) + "..." : str;
  }, []);

  useEffect(() => {
    if (!initialRooms || initialRooms.length === 0) {
      setSortedRooms([]);
      setFilteredRooms([]);
      return;
    }

    const sorted = [...initialRooms].sort((a, b) => {
      const timeA = a.last_message_at
        ? new Date(a.last_message_at)
        : new Date(0);
      const timeB = b.last_message_at
        ? new Date(b.last_message_at)
        : new Date(0);
      return timeB - timeA;
    });

    setSortedRooms(sorted);
  }, [initialRooms]);

  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setFilteredRooms(sortedRooms);
      return;
    }

    const query = debouncedSearchQuery.toLowerCase();
    const filtered = sortedRooms.filter((room) => {
      if (currentUser?.role === "BUYER") {
        return room.store_name?.toLowerCase().includes(query);
      } else {
        return room.buyer_name?.toLowerCase().includes(query);
      }
    });

    setFilteredRooms(filtered);
  }, [debouncedSearchQuery, sortedRooms, currentUser]);

  const getDisplayName = useCallback(
    (room) => {
      if (currentUser?.role === "BUYER") {
        return room.store_name || "Toko";
      } else {
        return room.buyer_name || "Pembeli";
      }
    },
    [currentUser]
  );

  const getLastMessagePreview = useCallback(
    (room) => {
      if (room.last_message?.content) {
        return truncateText(room.last_message.content);
      }

      if (room.last_message_content) {
        return truncateText(room.last_message_content);
      }

      return truncateText(room.lastMessage || "Belum ada pesan");
    },
    [truncateText]
  );

  const getDisplayTime = useCallback(
    (room) => {
      const timestamp =
        room.last_message_at ||
        room.last_message?.created_at ||
        room.updated_at ||
        room.created_at;
      return formatTimeAgo(timestamp);
    },
    [formatTimeAgo]
  );

  const handleNewChat = async (storeId) => {
    try {
      const res = await fetch("/node/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ store_id: storeId }),
      });

      if (res.ok) {
        const newRoom = await res.json();

        const formattedRoom = {
          ...newRoom,
          store_name: newRoom.store_name || "Toko",
          buyer_name: currentUser?.name || "Pembeli",
          unread_count: 0,
          last_message_at: new Date().toISOString(),
          last_message: { content: "Percakapan dimulai" },
        };

        onNewRoomCreated?.(formattedRoom);
        setShowNewChatModal(false);
        setNewChatSearch("");
      } else {
        const error = await res.json();
        alert(`Gagal memulai chat baru: ${error.message}`);
      }
    } catch (err) {
      console.error("Gagal memulai chat:", err);
      alert("Gagal memulai percakapan baru");
    }
  };

  useEffect(() => {
    const fetchStores = async () => {
      if (!showNewChatModal || currentUser?.role !== "BUYER") return;

      setIsLoadingStores(true);
      try {
        const url = debouncedNewChatSearch.trim()
          ? `/node/api/chat/stores?search=${encodeURIComponent(
              debouncedNewChatSearch
            )}`
          : `/node/api/chat/stores`;

        const res = await fetch(url, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setStoresForNewChat(data);
        } else {
          console.error("Failed to fetch stores:", res.status);
          setStoresForNewChat([]);
        }
      } catch (err) {
        console.error("Gagal mengambil daftar toko:", err);
        setStoresForNewChat([]);
      } finally {
        setIsLoadingStores(false);
      }
    };

    fetchStores();
  }, [showNewChatModal, debouncedNewChatSearch, currentUser]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      console.log(" Sidebar received new message:", {
        room: `${msg.store_id}-${msg.buyer_id}`,
        content: msg.content?.substring(0, 30) + "...",
      });

      setSortedRooms((prev) => {
        const roomIndex = prev.findIndex(
          (r) => r.store_id === msg.store_id && r.buyer_id === msg.buyer_id
        );

        if (roomIndex > -1) {
          const updated = [...prev];
          const room = { ...updated[roomIndex] };

          room.last_message_at = msg.created_at || new Date().toISOString();
          room.last_message = {
            content: msg.content,
            created_at: msg.created_at,
          };
          room.last_message_content = msg.content;

          const isMyMessage = msg.sender_id === currentUser?.user_id;
          const isActiveRoom =
            selectedRoom &&
            selectedRoom.store_id === msg.store_id &&
            selectedRoom.buyer_id === msg.buyer_id;

          if (!isMyMessage && !isActiveRoom) {
            room.unread_count = (room.unread_count || 0) + 1;
          } else if (isMyMessage) {
            room.unread_count = 0;
          }

          updated.splice(roomIndex, 1);
          updated.unshift(room);

          console.log("Sidebar updated room position");
          return updated;
        }

        console.log("Sidebar: Room not found, might need to refresh rooms");
        return prev;
      });
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, selectedRoom, currentUser]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  const isRoomActive = (room) => {
    return (
      selectedRoom &&
      selectedRoom.store_id === room.store_id &&
      selectedRoom.buyer_id === room.buyer_id
    );
  };

  const getFilteredStores = () => {
    if (!newChatSearch.trim()) return storesForNewChat;

    const query = newChatSearch.toLowerCase();
    return storesForNewChat.filter(
      (store) =>
        store.name?.toLowerCase().includes(query) ||
        store.category?.toLowerCase().includes(query)
    );
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-green-50">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          <IconUser className="w-6 h-6 text-gray-500" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{currentUser?.name || "YOU"}</p>
          <p className="text-xs text-gray-500">Online</p>
        </div>

        {/* New Chat Button (Buyer only) */}
        {currentUser?.role === "BUYER" && (
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
            title="Mulai Chat Baru"
          >
            <IconPlus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Box */}
      <div className="p-3 border-b">
        <div className="relative">
          <IconSearch className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari percakapan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="overflow-y-auto flex-1">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <IconUser className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">
              {searchQuery
                ? "Percakapan tidak ditemukan"
                : "Belum ada percakapan"}
            </p>
            {currentUser?.role === "BUYER" && !searchQuery && (
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Mulai Chat
              </button>
            )}
          </div>
        ) : (
          filteredRooms.map((room) => {
            const isActive = isRoomActive(room);
            const unreadCount = room.unread_count || 0;
            const lastMessagePreview = getLastMessagePreview(room);
            const displayTime = getDisplayTime(room);
            const displayName = getDisplayName(room);

            return (
              <div
                key={`${room.store_id}-${room.buyer_id}`}
                onClick={() => onSelect(room)}
                className={`p-4 border-b border-gray-100 cursor-pointer flex gap-3 transition-colors ${
                  isActive
                    ? "bg-green-100 border-l-4 border-l-green-500"
                    : "hover:bg-green-50"
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <IconUser className="w-6 h-6 text-gray-500" />
                  </div>

                  {/* Unread Indicator (dot) */}
                  {unreadCount > 0 && !isActive && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Room Info */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm truncate">
                      {displayName}
                    </p>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {displayTime}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-600 truncate">
                      {lastMessagePreview}
                    </p>

                    {/* Unread Badge atau Status Ikon */}
                    {unreadCount > 0 ? (
                      <span className="ml-2 bg-green-600 text-white text-xs font-medium rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : (
                      <div className="ml-2">
                        {/* Status pesan terakhir (read/delivered) */}
                        {room.last_message_status === "read" && (
                          <IconCheckDouble className="w-4 h-4 text-blue-500" />
                        )}
                        {room.last_message_status === "delivered" && (
                          <IconCheckDouble className="w-4 h-4 text-gray-400" />
                        )}
                        {room.last_message_status === "sent" && (
                          <IconCheck className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && currentUser?.role === "BUYER" && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) =>
            e.target === e.currentTarget && setShowNewChatModal(false)
          }
        >
          <div className="bg-white rounded-lg w-96 max-h-[80vh] flex flex-col shadow-xl">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">Mulai Chat Baru</h3>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="relative">
                <IconSearch className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari toko..."
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  autoFocus
                />
                {newChatSearch && (
                  <button
                    onClick={() => setNewChatSearch("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2">
              {isLoadingStores ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Memuat daftar toko...</p>
                </div>
              ) : getFilteredStores().length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconSearch className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">
                    {newChatSearch
                      ? "Toko tidak ditemukan"
                      : "Tidak ada toko tersedia"}
                  </p>
                </div>
              ) : (
                getFilteredStores().map((store) => (
                  <div
                    key={store.id}
                    onClick={() => handleNewChat(store.id)}
                    className="p-3 hover:bg-green-50 rounded-lg cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={store.name}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : null}
                      <IconUser
                        className="w-5 h-5 text-gray-500"
                        style={{ display: store.logo ? "none" : "block" }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{store.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {store.category || "Toko"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="w-full py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatSidebar;
