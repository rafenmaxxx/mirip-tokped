import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import ChatNavbar from "./components/chat_navbar";
import ChatBubble from "./components/chat_buble";
import ChatSidebar from "./components/chat_sidebar";
import ChatHeader from "./components/chat_header";
import ChatInput from "./components/chat_input";
import ChatMessageList from "./components/chat_message_list";
import LoadingSkeleton from "./components/loading_skeleton";

function Chat() {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomMessages, setRoomMessages] = useState({});
  const [isLoadingMessages, setIsLoadingMessages] = useState({});
  const [hasMoreMessages, setHasMoreMessages] = useState({});
  const [isTyping, setIsTyping] = useState(false); // Simple typing state
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const hasJoinedRoomsRef = useRef(false);
  const initialLoadDoneRef = useRef({});
  const fetchMessagesAbortRef = useRef({});

  // Simple typing timeout ref
  const typingTimeoutRef = useRef(null);

  // Helper: buat room key unik
  const getRoomKey = (room) => {
    if (!room) return "";
    return `${room.store_id?.toString()}-${room.buyer_id?.toString()}`;
  };

  // Ambil data user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/node/api/user/me", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  // Ambil daftar room user
  useEffect(() => {
    if (!user) return;

    const fetchRooms = async () => {
      try {
        const res = await fetch("/node/api/chat/rooms", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          const roomsWithUnread = data.map((room) => ({
            ...room,
            unread_count: room.unread_count || 0,
            last_message_at: room.last_message_at || room.updated_at,
            buyer_name: room.buyer_name || "Pembeli",
          }));
          setRooms(roomsWithUnread);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRooms();
  }, [user]);

  useEffect(() => {
    // Saat selectedRoom berubah, pastikan stop typing di room sebelumnya
    return () => {
      if (socketRef.current && user && selectedRoom) {
        console.log("🔄 Room changed, stopping typing in previous room");
        socketRef.current.emit("stop_typing", {
          store_id: selectedRoom.store_id,
          buyer_id: selectedRoom.buyer_id,
          user_id: user.user_id,
          user_name: user.name || "User",
        });
      }
    };
  }, [selectedRoom, user]);

  // Socket.IO setup
  useEffect(() => {
    if (!user) return;

    const SERVER_URL = "http://localhost:80";

    if (!socketRef.current) {
      console.log("Creating new socket connection...");
      const socket = io(SERVER_URL, {
        path: "/node/api/socket.io/",
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      const originalOn = socket.on.bind(socket);
      socket.on = function (event, handler) {
        console.log(`📡 [SOCKET LISTENING] ${event}`);
        return originalOn(event, handler);
      };

      const originalEmit = socket.emit.bind(socket);
      socket.emit = function (event, data, callback) {
        console.log(`📤 [SOCKET EMIT] ${event}:`, {
          type: data?.message_type,
          storeId: data?.storeId || data?.store_id,
          buyerId: data?.buyerId || data?.buyer_id,
          hasProductId: !!data?.product_id,
          contentPreview: data?.message
            ? typeof data.message === "string"
              ? data.message.substring(0, 50) + "..."
              : "Object data"
            : "No content",
        });
        return originalEmit(event, data, callback);
      };

      // Basic socket events
      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
      });

      socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });

      // Message event handler
      socket.on("new_message", (msg) => {
        console.log("📨 [SOCKET RECEIVE] new_message:", {
          message_id: msg.message_id,
          sender_id: msg.sender_id,
          type: msg.message_type,
          has_product_id: !!msg.product_id,
          content_preview: msg.content
            ? msg.message_type === "item_preview"
              ? "item_preview data"
              : msg.content.substring(0, 50) + "..."
            : "empty",
        });
        handleNewMessage(msg);
      });

      // **SIMPLE TYPING EVENT HANDLER**
      socket.on("typing", (data) => {
        console.log("Typing event received:", data);

        if (!selectedRoom || !user) return;

        // Cek apakah typing dari room yang sama dan bukan dari diri sendiri
        if (
          data.store_id === selectedRoom.store_id &&
          data.buyer_id === selectedRoom.buyer_id &&
          data.user_id !== user.user_id
        ) {
          // Set typing indicator
          setIsTyping(true);

          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          // Set timeout untuk menghilangkan indicator setelah 3 detik
          typingTimeoutRef.current = setTimeout(() => {
            console.log("Typing timeout - clearing indicator");
            setIsTyping(false);
            typingTimeoutRef.current = null;
          }, 50000);
        }
      });
      socket.on("error_message", (errorData) => {
        console.error("💥 [SOCKET] error:", errorData);
      });

      // **STOP TYPING EVENT HANDLER**
      socket.on("stop_typing", (data) => {
        console.log("Stop typing event received:", data);

        if (!selectedRoom || !user) return;

        // Cek apakah stop typing dari room yang sama dan bukan dari diri sendiri
        if (
          data.store_id === selectedRoom.store_id &&
          data.buyer_id === selectedRoom.buyer_id &&
          data.user_id !== user.user_id
        ) {
          setIsTyping(false);

          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
        }
      });
    }

    // Cleanup
    return () => {
      console.log("Cleaning up socket...");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, selectedRoom]);

  // Join rooms
  useEffect(() => {
    if (!socketRef.current || rooms.length === 0 || hasJoinedRoomsRef.current)
      return;

    const socket = socketRef.current;

    if (!socket.connected) {
      console.log("Socket not connected yet, waiting...");
      const onConnect = () => {
        joinRooms(socket);
        socket.off("connect", onConnect);
      };
      socket.on("connect", onConnect);
      return;
    }

    joinRooms(socket);
  }, [rooms]);

  // Join rooms function
  const joinRooms = (socket) => {
    console.log("Joining rooms...");

    rooms.forEach((room) => {
      if (room && room.store_id && room.buyer_id) {
        socket.emit("join_room", {
          storeId: room.store_id,
          buyerId: room.buyer_id,
        });
      }
    });

    hasJoinedRoomsRef.current = true;
  };

  // **SIMPLE TYPING EMITTER - Jika input box ada isinya**
  const handleTypingIndicator = useCallback(
    (isTypingNow) => {
      console.log(" handleTypingIndicator called with:", isTypingNow);

      if (!selectedRoom || !socketRef.current || !user) {
        console.log("Missing requirements:", {
          selectedRoom: !!selectedRoom,
          socket: !!socketRef.current,
          user: !!user,
        });
        return;
      }

      if (isTypingNow) {
        // Emit typing event
        console.log(
          "Emitting typing event for room:",
          selectedRoom.store_id,
          selectedRoom.buyer_id
        );
        socketRef.current.emit("typing", {
          store_id: selectedRoom.store_id,
          buyer_id: selectedRoom.buyer_id,
          user_id: user.user_id,
          user_name: user.name || "User",
        });
      } else {
        // Emit stop typing event
        console.log(
          "Emitting stop typing event for room:",
          selectedRoom.store_id,
          selectedRoom.buyer_id
        );
        socketRef.current.emit("stop_typing", {
          store_id: selectedRoom.store_id,
          buyer_id: selectedRoom.buyer_id,
          user_id: user.user_id,
          user_name: user.name || "User",
        });
      }
    },
    [selectedRoom, user]
  );

  // Handler untuk new message
  // Handler untuk new message
  const handleNewMessage = useCallback(
    (msg) => {
      if (!msg || !msg.store_id || !msg.buyer_id || !user) {
        console.log("Invalid message received:", msg);
        return;
      }

      const roomKey = `${msg.store_id.toString()}-${msg.buyer_id.toString()}`;
      const isMyMessage = msg.sender_id === user.user_id; // Pakai sender_id dari server
      const isItemPreview = msg.message_type === "item_preview";

      console.log("📨 Received new_message:", {
        message_id: msg.message_id,
        sender_id: msg.sender_id,
        my_user_id: user.user_id,
        isMyMessage,
        message_type: msg.message_type,
        has_product_id: !!msg.product_id,
      });

      setRoomMessages((prev) => {
        const currentMessages = prev[roomKey] || [];

        // Cek apakah message sudah ada (untuk menghindari duplikat)
        const messageExists = currentMessages.some(
          (m) => m.id === msg.message_id
        );

        if (messageExists) {
          console.log("Message already exists, skipping");
          return prev;
        }

        // Untuk pesan dari user sendiri, cari optimistic message
        if (isMyMessage) {
          const optimisticIndex = currentMessages.findIndex(
            (m) => m.status === "sending" && m.mine === true
          );

          if (optimisticIndex !== -1) {
            console.log("Found optimistic message, updating with server data");
            const updatedMessages = [...currentMessages];

            // Parse content untuk item preview
            let productData = undefined;
            if (isItemPreview && msg.content) {
              try {
                productData = JSON.parse(msg.content);
              } catch (e) {
                console.error("Error parsing product data:", e);
              }
            }

            updatedMessages[optimisticIndex] = {
              id: msg.message_id,
              text: msg.content,
              mine: true,
              type: msg.message_type,
              timestamp: msg.created_at,
              status: "delivered",
              product: productData,
            };
            return {
              ...prev,
              [roomKey]: updatedMessages,
            };
          }
        }

        // Parse content untuk item preview
        let productData = undefined;
        if (isItemPreview && msg.content) {
          try {
            productData = JSON.parse(msg.content);
          } catch (e) {
            console.error("Error parsing product data:", e);
          }
        }

        // Tambahkan message baru
        return {
          ...prev,
          [roomKey]: [
            ...currentMessages,
            {
              id: msg.message_id,
              text: msg.content,
              mine: isMyMessage, // Gunakan sender_id untuk menentukan
              type: msg.message_type,
              timestamp: msg.created_at,
              status: "delivered",
              product: productData,
            },
          ],
        };
      });

      // Auto scroll jika room aktif
      if (
        selectedRoom &&
        selectedRoom.store_id === msg.store_id &&
        selectedRoom.buyer_id === msg.buyer_id
      ) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }

      // Update room list untuk sidebar
      setRooms((prev) => {
        const roomIndex = prev.findIndex(
          (r) => r.store_id === msg.store_id && r.buyer_id === msg.buyer_id
        );

        if (roomIndex > -1) {
          const updatedRooms = [...prev];
          const room = { ...updatedRooms[roomIndex] };

          room.last_message_at = msg.created_at || new Date().toISOString();

          // Determine last message content
          let lastMessageContent = msg.content;
          if (isItemPreview && msg.content) {
            try {
              const productData = JSON.parse(msg.content);
              lastMessageContent = `${productData.product_name}`;
            } catch (e) {
              console.error("Error parsing product for last message:", e);
            }
          }

          room.last_message = {
            content: lastMessageContent,
            created_at: msg.created_at,
          };
          room.last_message_content = lastMessageContent;

          if (!isMyMessage) {
            if (
              !selectedRoom ||
              selectedRoom.store_id !== msg.store_id ||
              selectedRoom.buyer_id !== msg.buyer_id
            ) {
              room.unread_count = (room.unread_count || 0) + 1;
            }
          } else {
            room.unread_count = 0;
          }

          updatedRooms.splice(roomIndex, 1);
          updatedRooms.unshift(room);
          return updatedRooms;
        }
        return prev;
      });
    },
    [user, selectedRoom]
  );

  useEffect(() => {
    if (selectedRoom && selectedRoom.store_id) {
      localStorage.setItem("currentStoreId", selectedRoom.store_id.toString());
    }
  }, [selectedRoom]);

  // Fetch initial messages
  const fetchInitialMessages = useCallback(
    async (room) => {
      if (!room || !user || initialLoadDoneRef.current[getRoomKey(room)]) {
        console.log(
          `Skipping fetch for room ${getRoomKey(room)} - already loaded`
        );
        return;
      }

      const roomKey = getRoomKey(room);
      console.log(`Fetching initial messages for room: ${roomKey}`);

      setIsLoadingMessages((prev) => ({ ...prev, [roomKey]: true }));

      if (fetchMessagesAbortRef.current[roomKey]) {
        fetchMessagesAbortRef.current[roomKey].abort();
      }

      const controller = new AbortController();
      fetchMessagesAbortRef.current[roomKey] = controller;

      try {
        const { store_id, buyer_id } = room;
        const endpoint =
          user.role === "BUYER"
            ? `/node/api/chat/messages/${store_id}/${user.user_id}?limit=50`
            : `/node/api/chat/messages/${user.user_id}/${buyer_id}?limit=50`;

        const res = await fetch(endpoint, {
          credentials: "include",
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          console.log(`Loaded ${data.length} messages for room ${roomKey}`);

          const formattedMessages = data.map((msg) => ({
            id: msg.message_id,
            text: msg.content,
            mine: msg.sender_id === user.user_id,
            type: msg.message_type,
            timestamp: msg.created_at,
            status: msg.status || "sent",
          }));

          setRoomMessages((prev) => ({
            ...prev,
            [roomKey]: formattedMessages,
          }));

          setHasMoreMessages((prev) => ({
            ...prev,
            [roomKey]: data.length === 50,
          }));

          initialLoadDoneRef.current[roomKey] = true;

          // Clear unread count
          setRooms((prev) =>
            prev.map((r) =>
              r.store_id === room.store_id && r.buyer_id === room.buyer_id
                ? { ...r, unread_count: 0 }
                : r
            )
          );
        }
      } catch (err) {
        if (err.name === "AbortError") {
          console.log(`Fetch aborted for room ${roomKey}`);
        } else {
          console.error(`Error fetching messages for room ${roomKey}:`, err);
        }
      } finally {
        setIsLoadingMessages((prev) => ({ ...prev, [roomKey]: false }));
        delete fetchMessagesAbortRef.current[roomKey];
      }
    },
    [user]
  );

  // Load messages ketika room dipilih
  useEffect(() => {
    if (selectedRoom) {
      const roomKey = getRoomKey(selectedRoom);

      if (!initialLoadDoneRef.current[roomKey]) {
        fetchInitialMessages(selectedRoom);
      } else {
        console.log(`Room ${roomKey} already loaded, using cached messages`);

        // Clear unread count
        setRooms((prev) =>
          prev.map((r) =>
            r.store_id === selectedRoom.store_id &&
            r.buyer_id === selectedRoom.buyer_id
              ? { ...r, unread_count: 0 }
              : r
          )
        );
      }
    }
  }, [selectedRoom, fetchInitialMessages]);

  // Handle new room created
  const handleNewRoomCreated = useCallback((newRoom) => {
    if (socketRef.current && newRoom.store_id && newRoom.buyer_id) {
      socketRef.current.emit("join_room", {
        storeId: newRoom.store_id,
        buyerId: newRoom.buyer_id,
      });
    }

    setRooms((prev) => [newRoom, ...prev]);
    setSelectedRoom(newRoom);
  }, []);

  // Handle sending message
  const sendMessage = useCallback(
    (input, messageType = "text") => {
      if (!user || !selectedRoom || !socketRef.current) return;

      const { store_id, buyer_id } = selectedRoom;
      const roomKey = getRoomKey(selectedRoom);

      // Untuk item preview, input adalah object product
      // Untuk text biasa, input adalah string
      const isItemPreview = messageType === "item_preview";
      const content = isItemPreview ? JSON.stringify(input) : input.trim();

      if (!isItemPreview && !content) return;

      // Optimistic update UI
      const optimisticMessage = {
        id: Date.now(),
        text: content,
        mine: true,
        type: messageType,
        timestamp: new Date().toISOString(),
        status: "sending",
        product: isItemPreview ? input : undefined,
      };

      setRoomMessages((prev) => ({
        ...prev,
        [roomKey]: [...(prev[roomKey] || []), optimisticMessage],
      }));

      // Update room list
      setRooms((prev) => {
        const roomIndex = prev.findIndex(
          (r) => r.store_id === store_id && r.buyer_id === buyer_id
        );

        if (roomIndex > -1) {
          const updatedRooms = [...prev];
          const room = { ...updatedRooms[roomIndex] };
          room.last_message_at = new Date().toISOString();

          // Update last message content
          if (isItemPreview) {
            room.last_message_content = ` Mengirim produk: ${input.product_name}`;
          } else {
            room.last_message_content = content;
          }

          updatedRooms.splice(roomIndex, 1);
          updatedRooms.unshift(room);

          return updatedRooms;
        }
        return prev;
      });

      // Kirim via socket
      socketRef.current.emit("chat_message", {
        storeId: store_id,
        buyerId: buyer_id,
        message: content,
        message_type: messageType,
        product_id: isItemPreview ? input.product_id : null,
      });

      // Auto scroll
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    [user, selectedRoom]
  );

  // Handle load more messages
  const handleLoadMore = useCallback(async () => {
    if (!selectedRoom || !hasMoreMessages[getRoomKey(selectedRoom)]) return;

    const roomKey = getRoomKey(selectedRoom);
    const room = selectedRoom;
    const currentMessages = roomMessages[roomKey] || [];
    const offset = currentMessages.length;

    console.log(`Loading more messages for ${roomKey}, offset: ${offset}`);

    setIsLoadingMessages((prev) => ({ ...prev, [roomKey]: true }));

    try {
      const { store_id, buyer_id } = room;
      const endpoint =
        user.role === "BUYER"
          ? `/node/api/chat/messages/${store_id}/${user.user_id}?offset=${offset}&limit=50`
          : `/node/api/chat/messages/${user.user_id}/${buyer_id}?offset=${offset}&limit=50`;

      const res = await fetch(endpoint, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();

        if (data.length === 0) {
          setHasMoreMessages((prev) => ({ ...prev, [roomKey]: false }));
          return;
        }

        const formattedMessages = data.map((msg) => ({
          id: msg.message_id,
          text: msg.content,
          mine: msg.sender_id === user.user_id,
          type: msg.message_type,
          timestamp: msg.created_at,
          status: msg.status || "sent",
        }));

        setRoomMessages((prev) => ({
          ...prev,
          [roomKey]: [...formattedMessages, ...(prev[roomKey] || [])],
        }));

        setHasMoreMessages((prev) => ({
          ...prev,
          [roomKey]: data.length === 50,
        }));
      }
    } catch (err) {
      console.error(`Error loading more messages:`, err);
    } finally {
      setIsLoadingMessages((prev) => ({ ...prev, [roomKey]: false }));
    }
  }, [selectedRoom, hasMoreMessages, roomMessages, user]);

  // Get current room messages
  const currentRoomKey = selectedRoom ? getRoomKey(selectedRoom) : null;
  const currentMessages = currentRoomKey
    ? roomMessages[currentRoomKey] || []
    : [];
  const isLoadingCurrent = currentRoomKey
    ? isLoadingMessages[currentRoomKey]
    : false;

  return (
    <div className="w-full h-screen max-h-screen flex bg-white">
      <div className="flex flex-col h-full">
        <ChatNavbar onBack={() => window.history.back()} />
        <div className="flex-1 overflow-hidden">
          <ChatSidebar
            rooms={rooms.map((room) => ({
              ...room,
              store_name: room.store_name || "Toko",
              buyer_name: room.buyer_name || "Pembeli",
              unread_count: room.unread_count || 0,
              last_message_at:
                room.last_message_at || room.updated_at || room.created_at,
              last_message: room.last_message || {
                content: room.lastMessage || "",
              },
              lastMessage: room.lastMessage || "",
            }))}
            selectedRoom={selectedRoom}
            onSelect={setSelectedRoom}
            currentUser={user}
            socket={socketRef.current}
            onNewRoomCreated={handleNewRoomCreated}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <ChatHeader
          room={selectedRoom}
          currentUser={user}
          isTyping={isTyping}
        />

        <div className="flex-1 overflow-hidden relative">
          {selectedRoom ? (
            isLoadingCurrent && currentMessages.length === 0 ? (
              <LoadingSkeleton />
            ) : (
              <ChatMessageList
                ref={messageListRef}
                messages={currentMessages}
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
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSendMessage={sendMessage}
          onTypingChange={handleTypingIndicator} // Ganti prop name
          disabled={!selectedRoom}
        />
      </div>
    </div>
  );
}

export default Chat;
