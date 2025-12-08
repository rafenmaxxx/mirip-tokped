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
  const [isLoadingMessages, setIsLoadingMessages] = useState({}); // Per room loading state
  const [hasMoreMessages, setHasMoreMessages] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const hasJoinedRoomsRef = useRef(false);
  const initialLoadDoneRef = useRef({}); // Track initial load per room
  const fetchMessagesAbortRef = useRef({}); // Untuk abort fetch jika ada yang baru

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

  // Ambil daftar room user - HANYA SEKALI
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

  // Socket.IO setup - HANYA SATU KALI
  useEffect(() => {
    if (!user) return;

    const SERVER_URL = "http://localhost:80";

    if (!socketRef.current) {
      console.log(" Creating new socket connection...");
      const socket = io(SERVER_URL, {
        path: "/node/api/socket.io/",
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      // Basic socket events
      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
      });

      socket.on("connect_error", (err) => {
        console.error(" Socket connection error:", err.message);
      });

      socket.on("disconnect", (reason) => {
        console.log(" Socket disconnected:", reason);
      });

      // Message event handler
      socket.on("new_message", handleNewMessage);

      // Typing event handler
      socket.on("typing", handleTyping);
    }

    // Cleanup
    return () => {
      console.log(" Cleaning up socket...");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  // Join rooms ketika rooms berubah
  useEffect(() => {
    if (!socketRef.current || rooms.length === 0 || hasJoinedRoomsRef.current)
      return;

    const socket = socketRef.current;

    if (!socket.connected) {
      console.log(" Socket not connected yet, waiting...");
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
    console.log(" Joining rooms...");

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

  // Handler untuk new message - REAL TIME ONLY
  // Handler untuk new message - REAL TIME ONLY
  // Handler untuk new message - REAL TIME ONLY
  // Tambahkan ref untuk scroll tracking
  // const scrollPositionRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const scrollDebounceRef = useRef(null);

  // Effect untuk auto scroll ketika ada pesan baru di room aktif
  useEffect(() => {
    if (!selectedRoom || !messagesEndRef.current) return;

    // const roomKey = getRoomKey(selectedRoom);
    // const currentMessages = roomMessages[roomKey] || [];

    // Hanya auto-scroll jika:
    // 1. Ada pesan baru ditambahkan
    // 2. User tidak sedang scroll manual
    // 3. User sudah dekat dengan bottom (dalam 200px)

    if (!isUserScrollingRef.current) {
      // Scroll ke bottom dengan smooth animation
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);
    }
  }, [roomMessages, selectedRoom]);

  // Handler untuk new message - PERBAIKAN AUTO-SCROLL
  const handleNewMessage = useCallback(
    (msg) => {
      if (!msg || !msg.store_id || !msg.buyer_id || !user) {
        console.log(" Invalid message received:", msg);
        return;
      }

      const roomKey = `${msg.store_id.toString()}-${msg.buyer_id.toString()}`;
      const isMyMessage = msg.sender_id === user.user_id;
      const isActiveRoom =
        selectedRoom &&
        selectedRoom.store_id === msg.store_id &&
        selectedRoom.buyer_id === msg.buyer_id;

      console.log(" New real-time message:", {
        room: roomKey,
        sender: msg.sender_id,
        isMyMessage,
        isActiveRoom,
        content: msg.content?.substring(0, 50) + "...",
      });

      // Update messages state
      setRoomMessages((prev) => {
        const currentMessages = prev[roomKey] || [];

        if (isMyMessage) {
          // PESAN SAYA SENDIRI
          const optimisticIndex = currentMessages.findIndex(
            (m) =>
              m.status === "sending" &&
              m.text === msg.content &&
              Math.abs(
                new Date(m.timestamp).getTime() -
                  new Date(msg.created_at).getTime()
              ) < 5000
          );

          if (optimisticIndex !== -1) {
            console.log(
              "🔄 Found optimistic message, updating with server data"
            );
            const updatedMessages = [...currentMessages];
            updatedMessages[optimisticIndex] = {
              id: msg.message_id || updatedMessages[optimisticIndex].id,
              text: msg.content,
              mine: true,
              type: msg.message_type,
              timestamp: msg.created_at,
              status: "delivered",
            };
            return {
              ...prev,
              [roomKey]: updatedMessages,
            };
          }

          return {
            ...prev,
            [roomKey]: [
              ...currentMessages,
              {
                id: msg.message_id || Date.now(),
                text: msg.content,
                mine: true,
                type: msg.message_type,
                timestamp: msg.created_at,
                status: "delivered",
              },
            ],
          };
        } else {
          // PESAN DARI ORANG LAIN
          const messageExists = currentMessages.some(
            (m) =>
              m.id === msg.message_id ||
              (m.text === msg.content &&
                m.mine === false &&
                Math.abs(
                  new Date(m.timestamp).getTime() -
                    new Date(msg.created_at).getTime()
                ) < 1000)
          );

          if (messageExists) {
            return prev;
          }

          return {
            ...prev,
            [roomKey]: [
              ...currentMessages,
              {
                id: msg.message_id || Date.now(),
                text: msg.content,
                mine: false,
                type: msg.message_type,
                timestamp: msg.created_at,
                status: "delivered",
              },
            ],
          };
        }
      });

      // **AUTO-SCROLL KE BOTTOM JIKA INI ROOM AKTIF**
      if (isActiveRoom) {
        // Clear debounce jika ada
        if (scrollDebounceRef.current) {
          clearTimeout(scrollDebounceRef.current);
        }

        // Debounce scroll untuk mencegah terlalu sering
        scrollDebounceRef.current = setTimeout(() => {
          if (messagesEndRef.current && !isUserScrollingRef.current) {
            console.log(" Auto-scrolling to bottom for active room");
            messagesEndRef.current.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
          }
        }, 50); // Delay kecil untuk memastikan DOM sudah update
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
          room.last_message = {
            content: msg.content,
            created_at: msg.created_at,
          };
          room.last_message_content = msg.content;

          if (!isMyMessage) {
            if (!isActiveRoom) {
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

  // Handler untuk sendMessage - PERBAIKAN AUTO-SCROLL
  const sendMessage = useCallback(
    (input) => {
      if (!input.trim() || !user || !selectedRoom || !socketRef.current) return;

      const { store_id, buyer_id } = selectedRoom;
      const roomKey = getRoomKey(selectedRoom);

      // Optimistic update
      const optimisticMessage = {
        id: Date.now(),
        text: input,
        mine: true,
        type: "text",
        timestamp: new Date().toISOString(),
        status: "sending",
      };

      setRoomMessages((prev) => ({
        ...prev,
        [roomKey]: [...(prev[roomKey] || []), optimisticMessage],
      }));

      // Optimistic sidebar update
      setRooms((prev) => {
        const roomIndex = prev.findIndex(
          (r) => r.store_id === store_id && r.buyer_id === buyer_id
        );

        if (roomIndex > -1) {
          const updatedRooms = [...prev];
          const room = { ...updatedRooms[roomIndex] };
          room.last_message_at = new Date().toISOString();
          room.last_message = {
            content: input,
            created_at: new Date().toISOString(),
          };
          room.last_message_content = input;
          room.unread_count = 0;
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
        message: input,
        message_type: "text",
      });

      // **IMMEDIATE AUTO-SCROLL UNTUK OPTIMISTIC UPDATE**
      setTimeout(() => {
        if (messagesEndRef.current && !isUserScrollingRef.current) {
          console.log(" Immediate scroll for optimistic message");
          messagesEndRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        }
      }, 10);
    },
    [user, selectedRoom]
  );

  // Handler untuk typing indicator
  const handleTyping = useCallback(
    (data) => {
      if (!selectedRoom || !data || !user) return;

      if (
        data.store_id === selectedRoom.store_id &&
        data.buyer_id === selectedRoom.buyer_id &&
        data.user_id !== user.user_id
      ) {
        setIsTyping(true);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          typingTimeoutRef.current = null;
        }, 3000);
      }
    },
    [selectedRoom, user]
  );

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Fetch initial messages HANYA SEKALI per room ketika pertama kali dipilih
  const fetchInitialMessages = useCallback(
    async (room) => {
      if (!room || !user || initialLoadDoneRef.current[getRoomKey(room)]) {
        console.log(
          `⏭️ Skipping fetch for room ${getRoomKey(room)} - already loaded`
        );
        return;
      }

      const roomKey = getRoomKey(room);
      console.log(` Fetching initial messages for room: ${roomKey}`);

      // Set loading state untuk room ini
      setIsLoadingMessages((prev) => ({ ...prev, [roomKey]: true }));

      // Abort previous fetch jika ada
      if (fetchMessagesAbortRef.current[roomKey]) {
        fetchMessagesAbortRef.current[roomKey].abort();
      }

      // Buat AbortController untuk fetch ini
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
          console.log(` Loaded ${data.length} messages for room ${roomKey}`);

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

          // Tandai bahwa initial load sudah done
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
          console.error(` Error fetching messages for room ${roomKey}:`, err);
        }
      } finally {
        setIsLoadingMessages((prev) => ({ ...prev, [roomKey]: false }));
        delete fetchMessagesAbortRef.current[roomKey];
      }
    },
    [user]
  );

  // Load messages ketika room BARU dipilih (belum pernah di-load sebelumnya)
  useEffect(() => {
    if (selectedRoom) {
      const roomKey = getRoomKey(selectedRoom);

      // Hanya fetch jika belum pernah di-load
      if (!initialLoadDoneRef.current[roomKey]) {
        fetchInitialMessages(selectedRoom);
      } else {
        console.log(` Room ${roomKey} already loaded, using cached messages`);

        // Clear unread count meskipun sudah loaded
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

  // Handle typing indicator
  const handleTypingIndicator = useCallback(() => {
    if (!selectedRoom || !socketRef.current || !user) return;

    socketRef.current.emit("typing", {
      store_id: selectedRoom.store_id,
      buyer_id: selectedRoom.buyer_id,
      user_id: user.user_id,
    });
  }, [selectedRoom, user]);

  // Handle load more messages (pagination)
  const handleLoadMore = useCallback(async () => {
    if (!selectedRoom || !hasMoreMessages[getRoomKey(selectedRoom)]) return;

    const roomKey = getRoomKey(selectedRoom);
    const room = selectedRoom;
    const currentMessages = roomMessages[roomKey] || [];
    const offset = currentMessages.length;

    console.log(` Loading more messages for ${roomKey}, offset: ${offset}`);

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
      console.error(` Error loading more messages:`, err);
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
              // Pastikan property ini ada
              store_name: room.store_name || "Toko",
              buyer_name: room.buyer_name || "Pembeli",
              unread_count: room.unread_count || 0,
              last_message_at:
                room.last_message_at || room.updated_at || room.created_at,
              // Untuk last message preview
              last_message: room.last_message || {
                content: room.lastMessage || "",
              },
              lastMessage: room.lastMessage || "", // Backup
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
          onTyping={handleTypingIndicator}
          disabled={!selectedRoom}
        />
      </div>
    </div>
  );
}

export default Chat;
