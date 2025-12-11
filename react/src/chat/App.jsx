import React, { useState, useEffect, useCallback } from "react";
import { useChat } from "./hooks/useChat";
import { useNavigate } from "react-router-dom";
import ChatNavbar from "./components/chat_navbar";
import ChatSidebar from "./components/chat_sidebar";
import ChatHeader from "./components/chat_header";
import ChatInput from "./components/chat_input";
import ChatMessageList from "./components/chat_message_list";
import LoadingSkeleton from "./components/loading_skeleton";

function Chat() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    rooms,
    setRooms,
    selectedRoom,
    setSelectedRoom,
    roomMessages,
    isLoadingMessages,
    hasMoreMessages,
    isTyping,
    connectionStatus,
    messageReadStatus,
    getRoomKey,
    sendMessage,
    sendTyping,
    sendStopTyping,
    joinRoom,
    handleLoadMore,
    markAsRead,
  } = useChat(user);

  // Check chat feature flag
  useEffect(() => {
    const checkChatAccess = async () => {
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

        // Check if chat is allowed for this user
        const flagResponse = await fetch(`http://localhost:80/node/api/flags/chat/allowed/${userId}`, {
          method: "GET",
          credentials: "include"
        });

        const flagData = await flagResponse.json();

        // Handle both error response and success response structure
        const isAllowed = flagData.data?.isAllowed ?? flagData.isAllowed ?? true;
        const reason = flagData.data?.reason || flagData.reason || "Fitur Live Chat sedang tidak tersedia";
        
        if (!isAllowed) {
          // Determine scope: check if this is global or user-specific
          const scope = reason.toLowerCase().includes("global") 
            ? "global" 
            : "user";
          
          // Navigate to feature-disabled page with query params
          navigate(`/feature-disabled?feature=chat&reason=${encodeURIComponent(reason)}&scope=${scope}`);
        }
      } catch (error) {
        console.error("Error checking chat access:", error);
      }
    };

    checkChatAccess();
  }, [navigate]);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/node/api/user/me", {
          credentials: "include",
        });
        const result = await res.json();

        if (result.status === "success" && result.data) {
          setUser(result.data);
        } else if (result.user_id) {
          setUser(result);
        } else {
          console.error("Invalid user data format:", result);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Fetch chat rooms
  const fetchRooms = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch("/node/api/chat/rooms", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();

        // Format rooms
        const formattedRooms = data.map((room) => ({
          ...room,
          unread_count: room.unread_count || 0,
          last_message_at: room.last_message_at || room.updated_at,
          buyer_name: room.buyer_name || "Pembeli",
          store_name: room.store_name || "Toko",
        }));

        setRooms(formattedRooms);

        // Join semua room
        formattedRooms.forEach((room) => {
          if (room.store_id && room.buyer_id) {
            joinRoom({
              storeId: room.store_id,
              buyerId: room.buyer_id,
            });
          }
        });
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  }, [user, setRooms, joinRoom]);

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user, fetchRooms]);

  // Handle new room created
  const handleNewRoomCreated = useCallback(
    (newRoom) => {
      if (newRoom.store_id && newRoom.buyer_id) {
        joinRoom({
          storeId: newRoom.store_id,
          buyerId: newRoom.buyer_id,
        });
      }

      // Format new room
      const formattedRoom = {
        ...newRoom,
        unread_count: 0,
        last_message_at: new Date().toISOString(),
        buyer_name: newRoom.buyer_name || user?.name || "Pembeli",
        store_name: newRoom.store_name || "Toko",
      };

      setRooms((prev) => [formattedRoom, ...prev]);
      setSelectedRoom(formattedRoom);
    },
    [joinRoom, setRooms, setSelectedRoom, user]
  );

  // Handle typing change
  const handleTypingChange = useCallback(
    (isTypingNow) => {
      if (isTypingNow) {
        sendTyping();
      } else {
        sendStopTyping();
      }
    },
    [sendTyping, sendStopTyping]
  );

  // Get current room messages
  const currentRoomKey = selectedRoom ? getRoomKey(selectedRoom) : null;
  const currentMessages = currentRoomKey
    ? roomMessages[currentRoomKey] || []
    : [];
  const isLoadingCurrent = currentRoomKey
    ? isLoadingMessages[currentRoomKey]
    : false;

  // Mark messages as read when room is selected
  useEffect(() => {
    if (selectedRoom && user) {
      // Update unread count untuk room yang dipilih
      setRooms((prev) =>
        prev.map((room) =>
          room.store_id === selectedRoom.store_id &&
          room.buyer_id === selectedRoom.buyer_id
            ? { ...room, unread_count: 0 }
            : room
        )
      );
    }
  }, [selectedRoom, user, setRooms]);

  // Di App.jsx - useEffect untuk mark as read
  useEffect(() => {
    if (selectedRoom && user && connectionStatus === "connected") {
      // Delay untuk memastikan room sudah di-join
      const timer = setTimeout(() => {
        console.log("Auto marking messages as read");
        markAsRead();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedRoom, user, markAsRead, connectionStatus]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen max-h-screen flex bg-white">
      {/* Sidebar */}
      <div className="flex flex-col h-full w-80 border-r border-gray-200">
        <ChatNavbar onBack={() => window.history.back()} />
        <div className="flex-1 overflow-hidden">
          <ChatSidebar
            rooms={rooms}
            selectedRoom={selectedRoom}
            onSelect={setSelectedRoom}
            currentUser={user}
            onNewRoomCreated={handleNewRoomCreated}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader
          room={selectedRoom}
          currentUser={user}
          isTyping={isTyping}
          connectionStatus={connectionStatus}
        />

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden relative">
          {selectedRoom ? (
            isLoadingCurrent && currentMessages.length === 0 ? (
              <LoadingSkeleton />
            ) : (
              <ChatMessageList
                messages={currentMessages.map((msg) => ({
                  ...msg,
                  read: messageReadStatus[msg.id] || msg.read || false,
                }))}
                user={user}
                onLoadMore={handleLoadMore}
                hasMore={hasMoreMessages[currentRoomKey]}
                isLoadingMore={isLoadingCurrent}
              />
            )
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Pilih Percakapan
                </h3>
                <p className="text-gray-500">
                  Pilih percakapan dari daftar untuk memulai mengobrol
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInput
          onSendMessage={sendMessage}
          onTypingChange={handleTypingChange}
          disabled={!selectedRoom}
        />
      </div>
    </div>
  );
}

export default Chat;
