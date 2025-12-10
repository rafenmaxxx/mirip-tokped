import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import ChatNavbar from "./components/chat_navbar";
import ChatBubble from "./components/chat_buble";
import ChatSidebar from "./components/chat_sidebar";
import ChatHeader from "./components/chat_header";
import ChatInput from "./components/chat_input";
import ChatMessageList from "./components/chat_message_list";
import LoadingSkeleton from "./components/loading_skeleton";

function Chat() {
  const navigate = useNavigate();
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
  const [messageReadStatus, setMessageReadStatus] = useState({});

  // Simple typing timeout ref
  const typingTimeoutRef = useRef(null);

  // Helper: buat room key unik
  const getRoomKey = (room) => {
    if (!room) return "";
    return `${room.store_id?.toString()}-${room.buyer_id?.toString()}`;
  };

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

  // Ambil data user
  useEffect(() => {
    // Di App.jsx - saat setUser
    const fetchUser = async () => {
      try {
        const res = await fetch("/node/api/user/me", {
          credentials: "include",
        });

        const result = await res.json();
        console.log("API response:", result);

        // PERBAIKAN DI SINI:
        if (result.status === "success" && result.data) {
          setUser(result.data); // HANYA simpan data-nya
        } else {
          setUser(result); // Fallback jika format berbeda
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  const getUserData = () => {
    if (!user) return null;

    // Format 1: user sudah langsung data object
    if (user.user_id && user.role) {
      return user;
    }

    // Format 2: user adalah {status: 'success', data: {...}}
    if (user.data && user.data.user_id && user.data.role) {
      return user.data;
    }

    console.error("Unknown user format:", user);
    return null;
  };

  const userData = getUserData();

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
  }, [userData]);

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
      socket.on("messages_read", (data) => {
        console.log("📖 Messages read event received:", data);

        if (!selectedRoom || !user) return;

        // Cek apakah ini untuk room yang sedang aktif
        if (
          data.store_id === selectedRoom.store_id &&
          data.buyer_id === selectedRoom.buyer_id &&
          data.reader_id !== user.user_id // Bukan diri sendiri
        ) {
          // Update read status untuk message_ids
          setMessageReadStatus((prev) => {
            const updated = { ...prev };
            data.message_ids?.forEach((messageId) => {
              updated[messageId] = true;
            });
            return updated;
          });

          // Update status pesan di roomMessages
          setRoomMessages((prev) => {
            const roomKey = `${data.store_id}-${data.buyer_id}`;
            const currentMessages = prev[roomKey] || [];

            const updatedMessages = currentMessages.map((msg) => {
              if (data.message_ids?.includes(msg.id) && msg.mine) {
                return {
                  ...msg,
                  status: "read",
                };
              }
              return msg;
            });

            return {
              ...prev,
              [roomKey]: updatedMessages,
            };
          });
        }
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
  }, [userData, selectedRoom]);

  const markMessagesAsRead = useCallback(() => {
    if (!selectedRoom || !socketRef.current || !user) return;

    const { store_id, buyer_id } = selectedRoom;

    console.log("📖 Marking messages as read for room:", {
      store_id,
      buyer_id,
    });

    socketRef.current.emit("mark_as_read", {
      storeId: store_id,
      buyerId: buyer_id,
    });
  }, [selectedRoom, user]);

  useEffect(() => {
    if (selectedRoom && user && socketRef.current?.connected) {
      // Delay sedikit untuk memastikan UI sudah render
      const timer = setTimeout(() => {
        markMessagesAsRead();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [selectedRoom, user, markMessagesAsRead]);

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
    [selectedRoom, userData]
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
      const isMyMessage = msg.sender_id === user.user_id;
      const isItemPreview = msg.message_type === "item_preview";
      const isImage = msg.message_type === "image";

      console.log("📨 Received message:", {
        type: msg.message_type,
        isMyMessage,
        isImage,
        isItemPreview,
        message_id: msg.message_id,
      });

      // Parse content berdasarkan type
      let parsedContent = null;
      if (isItemPreview || isImage) {
        try {
          parsedContent = JSON.parse(msg.content);
        } catch (e) {
          console.error("Error parsing message content:", e);
          parsedContent = msg.content;
        }
      }

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

            // Tentukan data berdasarkan type
            let productData = undefined;
            let imageData = undefined;

            if (isItemPreview && parsedContent) {
              productData = parsedContent;
            } else if (isImage && parsedContent) {
              imageData = parsedContent;
            }

            updatedMessages[optimisticIndex] = {
              id: msg.message_id,
              text: msg.content,
              mine: true,
              type: msg.message_type,
              timestamp: msg.created_at,
              status: "delivered",
              product: productData,
              image: imageData,
            };
            return {
              ...prev,
              [roomKey]: updatedMessages,
            };
          }
        }

        // Tentukan data untuk message baru
        let productData = undefined;
        let imageData = undefined;

        if (isItemPreview && parsedContent) {
          productData = parsedContent;
        } else if (isImage && parsedContent) {
          imageData = parsedContent;
        }

        // Tambahkan message baru
        return {
          ...prev,
          [roomKey]: [
            ...currentMessages,
            {
              id: msg.message_id,
              text: msg.content,
              mine: isMyMessage,
              type: msg.message_type,
              timestamp: msg.created_at,
              status: "delivered",
              product: productData,
              image: imageData,
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

          // Determine last message content berdasarkan type
          let lastMessageContent = msg.content;
          let lastMessageDisplay = msg.content;

          if (isItemPreview && parsedContent) {
            lastMessageDisplay = `📦 ${parsedContent.product_name}`;
          } else if (isImage) {
            lastMessageDisplay = "📷 Gambar";
          }

          room.last_message = {
            content: lastMessageContent,
            created_at: msg.created_at,
          };
          room.last_message_content = lastMessageDisplay;

          if (!isMyMessage) {
            if (
              !selectedRoom ||
              selectedRoom.store_id !== msg.store_id ||
              selectedRoom.buyer_id !== msg.buyer_id
            ) {
              room.unread_count = (room.unread_count || 0) + 1;
              setTimeout(() => {
                markMessagesAsRead();
              }, 1000);
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
    [userData, selectedRoom]
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

      const userRole = userData.role;
      const userId = userData.user_id;

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
        console.log(userId, "---> user");
        const endpoint =
          userRole === "BUYER"
            ? `/node/api/chat/messages/${store_id}/${userId}?limit=50`
            : `/node/api/chat/messages/${userId}/${buyer_id}?limit=50`;
        console.log(endpoint, "-> endpoint");
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

          const readStatus = {};
          data.forEach((msg) => {
            if (msg.is_read && msg.sender_id === user.user_id) {
              readStatus[msg.message_id] = true;
            }
          });
          setMessageReadStatus((prev) => ({ ...prev, ...readStatus }));

          setRoomMessages((prev) => ({
            ...prev,
            [roomKey]: formattedMessages,
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
    [userData]
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
      console.log("🚀 sendMessage called:", {
        messageType,
        inputType: typeof input,
        isObject: typeof input === "object",
      });

      if (!user || !selectedRoom || !socketRef.current) {
        console.error("❌ Cannot send - missing requirements");
        return;
      }

      const { store_id, buyer_id } = selectedRoom;
      const roomKey = getRoomKey(selectedRoom);

      // Tentukan content berdasarkan message type
      let content = "";
      let product_id = null;
      let additionalData = {};

      if (messageType === "item_preview") {
        // input adalah object product
        content = JSON.stringify(input);
        product_id = input.product_id;
        additionalData = { product: input };
      } else if (messageType === "image") {
        // input adalah object image data
        content = JSON.stringify(input);
        additionalData = { image: input };
      } else {
        // text message biasa
        content = input.trim();
        if (!content) {
          console.error("❌ Empty content for text message");
          return;
        }
      }

      // Optimistic update UI
      const optimisticMessage = {
        id: Date.now(),
        text: content,
        mine: true,
        type: messageType,
        timestamp: new Date().toISOString(),
        status: "sending",
        ...additionalData,
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

          // Update last message content berdasarkan type
          let lastMessageDisplay = content;
          if (messageType === "item_preview") {
            lastMessageDisplay = `📦 ${input.product_name}`;
          } else if (messageType === "image") {
            lastMessageDisplay = "📷 Gambar";
          }

          room.last_message_content = lastMessageDisplay;

          updatedRooms.splice(roomIndex, 1);
          updatedRooms.unshift(room);

          return updatedRooms;
        }
        return prev;
      });

      // Kirim via socket
      const socketData = {
        storeId: store_id,
        buyerId: buyer_id,
        message: content,
        message_type: messageType,
        product_id: product_id,
      };

      console.log("📤 Sending message via socket:", {
        type: messageType,
        hasProductId: !!product_id,
      });

      socketRef.current.emit("chat_message", socketData);

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
                messages={currentMessages.map((msg) => ({
                  ...msg,
                  read: messageReadStatus[msg.id] || false,
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
