import { useState, useCallback, useEffect, useRef } from "react";
import { socketManager } from "../lib/socket";

export const useChat = (user) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomMessages, setRoomMessages] = useState({});
  const [isLoadingMessages, setIsLoadingMessages] = useState({});
  const [hasMoreMessages, setHasMoreMessages] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [messageReadStatus, setMessageReadStatus] = useState({});

  const initialLoadDoneRef = useRef({});
  const fetchMessagesAbortRef = useRef({});
  const typingTimeoutRef = useRef(null);

  // Helper: buat room key unik
  const getRoomKey = useCallback((room) => {
    if (!room) return "";
    return `${room.store_id?.toString()}-${room.buyer_id?.toString()}`;
  }, []);

  // Format message untuk UI
  const formatMessage = useCallback((msg, currentUser) => {
    if (!msg || !currentUser) return null;

    const isMyMessage = msg.sender_id === currentUser.user_id;
    const isItemPreview = msg.message_type === "item_preview";
    const isImage = msg.message_type === "image";

    let parsedContent = null;
    let productData = undefined;
    let imageData = undefined;

    if (isItemPreview || isImage) {
      try {
        parsedContent = JSON.parse(msg.content);
        if (isItemPreview) {
          productData = parsedContent;
        } else if (isImage) {
          imageData = parsedContent;
        }
      } catch (e) {
        console.error("Error parsing message content:", e);
        parsedContent = msg.content;
      }
    }

    return {
      id: msg.message_id,
      text: msg.content,
      mine: isMyMessage,
      type: msg.message_type,
      timestamp: msg.created_at,
      status: "delivered",
      product: productData,
      image: imageData,
      read: msg.is_read || false,
    };
  }, []);

  // Setup socket connection
  useEffect(() => {
    if (!user) return;

    const SERVER_URL = "http://localhost:80";

    socketManager.onStatusChange = (status) => {
      setConnectionStatus(status);
    };

    const socket = socketManager.connect(SERVER_URL);

    // Setup message listeners
    const handleNewMessage = (msg) => {
      if (!msg || !msg.store_id || !msg.buyer_id || !user) {
        console.log("Invalid message received:", msg);
        return;
      }

      const formattedMessage = formatMessage(msg, user);
      if (!formattedMessage) return;

      const roomKey = `${msg.store_id.toString()}-${msg.buyer_id.toString()}`;
      const isMyMessage = msg.sender_id === user.user_id;

      // Update messages
      setRoomMessages((prev) => {
        const currentMessages = prev[roomKey] || [];

        // Cek apakah message sudah ada
        const messageExists = currentMessages.some(
          (m) => m.id === msg.message_id
        );
        if (messageExists) return prev;

        // Cari optimistic message untuk pesan sendiri
        if (isMyMessage) {
          const optimisticIndex = currentMessages.findIndex(
            (m) => m.status === "sending" && m.mine === true
          );

          if (optimisticIndex !== -1) {
            const updatedMessages = [...currentMessages];
            updatedMessages[optimisticIndex] = formattedMessage;
            return { ...prev, [roomKey]: updatedMessages };
          }
        }

        return {
          ...prev,
          [roomKey]: [...currentMessages, formattedMessage],
        };
      });

      // Update rooms list
      setRooms((prev) =>
        updateRoomList(prev, msg, user, selectedRoom, getRoomKey)
      );
    };

    const handleTypingEvent = (data) => {
      if (!selectedRoom || !user) return;

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
        }, 3000);
      }
    };

    const handleStopTypingEvent = (data) => {
      if (!selectedRoom || !user) return;

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
    };

    const handleMessagesRead = (data) => {
      if (!selectedRoom || !user) return;

      // Cek apakah ini untuk room yang sedang aktif
      if (
        data.store_id === selectedRoom.store_id &&
        data.buyer_id === selectedRoom.buyer_id &&
        data.reader_id !== user.user_id
      ) {
        // Update read status
        setMessageReadStatus((prev) => {
          const updated = { ...prev };
          data.message_ids?.forEach((messageId) => {
            updated[messageId] = true;
          });
          return updated;
        });

        // Update messages
        setRoomMessages((prev) => {
          const roomKey = `${data.store_id}-${data.buyer_id}`;
          const currentMessages = prev[roomKey] || [];

          const updatedMessages = currentMessages.map((msg) => {
            if (data.message_ids?.includes(msg.id) && msg.mine) {
              return { ...msg, status: "read", read: true };
            }
            return msg;
          });

          return { ...prev, [roomKey]: updatedMessages };
        });
      }
    };

    const handleError = (errorData) => {
      console.error("💥 Socket error:", errorData);
    };

    // Register listeners
    socket.on("new_message", handleNewMessage);
    socket.on("typing", handleTypingEvent);
    socket.on("stop_typing", handleStopTypingEvent);
    socket.on("messages_read", handleMessagesRead);
    socket.on("error_message", handleError);

    return () => {
      socketManager.off("new_message", handleNewMessage);
      socketManager.off("typing", handleTypingEvent);
      socketManager.off("stop_typing", handleStopTypingEvent);
      socketManager.off("messages_read", handleMessagesRead);
      socketManager.off("error_message", handleError);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, selectedRoom, formatMessage, getRoomKey]);

  // Helper function untuk update room list
  const updateRoomList = useCallback((rooms, msg, user, selectedRoom) => {
    const roomIndex = rooms.findIndex(
      (r) => r.store_id === msg.store_id && r.buyer_id === msg.buyer_id
    );

    if (roomIndex > -1) {
      const updatedRooms = [...rooms];
      const room = { ...updatedRooms[roomIndex] };

      room.last_message_at = msg.created_at || new Date().toISOString();

      const isMyMessage = msg.sender_id === user?.user_id;
      const isActiveRoom =
        selectedRoom &&
        selectedRoom.store_id === msg.store_id &&
        selectedRoom.buyer_id === msg.buyer_id;

      // Update last message content
      let lastMessageDisplay = msg.content;
      if (msg.message_type === "item_preview") {
        try {
          const parsed = JSON.parse(msg.content);
          lastMessageDisplay = `📦 ${parsed.product_name}`;
        } catch (e) {
          // tetap gunakan content asli
          console.log(e);
        }
      } else if (msg.message_type === "image") {
        lastMessageDisplay = "📷 Gambar";
      }

      room.last_message_content = lastMessageDisplay;
      room.last_message = {
        content: msg.content,
        created_at: msg.created_at,
      };

      if (!isMyMessage && !isActiveRoom) {
        room.unread_count = (room.unread_count || 0) + 1;
      } else if (isMyMessage) {
        room.unread_count = 0;
      }

      // Pindahkan ke atas
      updatedRooms.splice(roomIndex, 1);
      updatedRooms.unshift(room);

      return updatedRooms;
    }

    return rooms;
  }, []);

  // Fetch initial messages untuk room
  const fetchInitialMessages = useCallback(
    async (room) => {
      if (!room || !user || initialLoadDoneRef.current[getRoomKey(room)]) {
        return;
      }

      const roomKey = getRoomKey(room);
      setIsLoadingMessages((prev) => ({ ...prev, [roomKey]: true }));

      // Cancel previous fetch jika ada
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

          const formattedMessages = data.map((msg) => formatMessage(msg, user));

          // Update read status
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

          setHasMoreMessages((prev) => ({
            ...prev,
            [roomKey]: data.length === 50,
          }));

          initialLoadDoneRef.current[roomKey] = true;

          // Clear unread count di sidebar
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
    [user, formatMessage, getRoomKey]
  );

  // Load messages ketika room dipilih
  useEffect(() => {
    if (selectedRoom) {
      const roomKey = getRoomKey(selectedRoom);

      if (!initialLoadDoneRef.current[roomKey]) {
        fetchInitialMessages(selectedRoom);
      } else {
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
  }, [selectedRoom, fetchInitialMessages, getRoomKey]);

  // Handle sending message
  const sendMessage = useCallback(
    (input, messageType = "text") => {
      if (!user || !selectedRoom) {
        console.error("❌ Cannot send - missing requirements");
        return false;
      }

      const { store_id, buyer_id } = selectedRoom;
      const roomKey = getRoomKey(selectedRoom);

      // Tentukan content dan product_id
      let content = "";
      let product_id = null;
      let additionalData = {};

      if (messageType === "item_preview") {
        content = JSON.stringify(input);
        product_id = input.product_id;
        additionalData = { product: input };
      } else if (messageType === "image") {
        content = JSON.stringify(input);
        additionalData = { image: input };
      } else {
        content = input.trim();
        if (!content) {
          console.error("❌ Empty content for text message");
          return false;
        }
      }

      // Optimistic update
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

          // Update last message content
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

      const success = socketManager.sendMessage(socketData);
      return success;
    },
    [user, selectedRoom, getRoomKey]
  );

  // Handle load more messages
  const handleLoadMore = useCallback(async () => {
    if (!selectedRoom || !hasMoreMessages[getRoomKey(selectedRoom)] || !user)
      return;

    const roomKey = getRoomKey(selectedRoom);
    const room = selectedRoom;
    const currentMessages = roomMessages[roomKey] || [];
    const offset = currentMessages.length;

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

        const formattedMessages = data.map((msg) => formatMessage(msg, user));

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
  }, [
    selectedRoom,
    hasMoreMessages,
    roomMessages,
    user,
    formatMessage,
    getRoomKey,
  ]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    if (!selectedRoom || !user) return false;

    const success = socketManager.markAsRead({
      storeId: selectedRoom.store_id,
      buyerId: selectedRoom.buyer_id,
    });

    return success;
  }, [selectedRoom, user]);

  // Send typing indicator
  const sendTyping = useCallback(() => {
    if (!selectedRoom || !user) return false;

    const success = socketManager.sendTyping({
      store_id: selectedRoom.store_id,
      buyer_id: selectedRoom.buyer_id,
      user_id: user.user_id,
      user_name: user.name || "User",
    });

    return success;
  }, [selectedRoom, user]);

  // Send stop typing indicator
  const sendStopTyping = useCallback(() => {
    if (!selectedRoom || !user) return false;

    const success = socketManager.sendStopTyping({
      store_id: selectedRoom.store_id,
      buyer_id: selectedRoom.buyer_id,
      user_id: user.user_id,
      user_name: user.name || "User",
    });

    return success;
  }, [selectedRoom, user]);

  // Join room
  const joinRoom = useCallback((roomData) => {
    socketManager.joinRoom(roomData);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Abort semua fetch yang sedang berjalan
      Object.values(fetchMessagesAbortRef.current).forEach((controller) => {
        if (controller) controller.abort();
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Disconnect socket jika tidak ada komponen lain yang menggunakan
      socketManager.disconnect();
    };
  }, []);

  return {
    // State
    rooms,
    setRooms,
    selectedRoom,
    setSelectedRoom,
    roomMessages,
    setRoomMessages,
    isLoadingMessages,
    setIsLoadingMessages,
    hasMoreMessages,
    setHasMoreMessages,
    isTyping,
    connectionStatus,
    messageReadStatus,

    // Helper functions
    getRoomKey,

    // Methods
    sendMessage,
    markAsRead,
    sendTyping,
    sendStopTyping,
    joinRoom,
    handleLoadMore,
    fetchInitialMessages,
  };
};
