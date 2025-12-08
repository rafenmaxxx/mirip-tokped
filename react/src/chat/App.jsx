import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import ChatNavbar from "./components/chat_navbar";
import ChatBubble from "./components/chat_buble";
import ChatSidebar from "./components/chat_sidebar";
import AttachmentModal from "./components/attachment_modal";
import ChatHeader from "./components/chat_header";

function Chat() {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomMessages, setRoomMessages] = useState({});
  const [input, setInput] = useState("");
  const [modal, setModal] = useState(false);
  const socketRef = useRef(null);

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

  // Helper: buat room key unik
  const getRoomKey = (room) => `${room.store_id}-${room.buyer_id}`;

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
          setRooms(data);
          if (data.length > 0) setSelectedRoom(data[0]); // object room
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRooms();
  }, [user]);

  // Ambil pesan setiap room yang dipilih
  useEffect(() => {
    if (!selectedRoom || !user) return;

    const fetchMessages = async () => {
      try {
        const { store_id, buyer_id } = selectedRoom;

        const endpoint =
          user.role === "BUYER"
            ? `/node/api/chat/messages/${store_id}/${user.user_id}`
            : `/node/api/chat/messages/${user.user_id}/${buyer_id}`;

        const res = await fetch(endpoint, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setRoomMessages((prev) => ({
            ...prev,
            [getRoomKey(selectedRoom)]: data.map((msg) => ({
              text: msg.content,
              mine: msg.sender_id === user.user_id,
              type: msg.message_type,
            })),
          }));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
  }, [selectedRoom, user]);

  // Socket.IO realtime: join room setelah rooms tersedia
  useEffect(() => {
    if (!user || rooms.length === 0) return;

    const SERVER_URL = "http://localhost:80";
    const socket = io(SERVER_URL, {
      path: "/node/api/socket.io/",
      withCredentials: true,
    });
    socketRef.current = socket;

    // Join semua room
    rooms.forEach((room) => {
      socket.emit("join_room", {
        storeId: room.store_id,
        buyerId: room.buyer_id,
      });
    });

    // Terima pesan realtime
    socket.on("new_message", (msg) => {
      const roomKey = `${msg.storeId}-${msg.buyerId}`;
      setRoomMessages((prev) => ({
        ...prev,
        [roomKey]: [
          ...(prev[roomKey] || []),
          {
            text: msg.content,
            mine: msg.sender_id === user.user_id,
            type: msg.message_type,
          },
        ],
      }));
    });

    socket.on("error_message", console.error);

    return () => socket.disconnect();
  }, [user, rooms]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    const maxHeight = 24 * 5;
    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
  };

  const sendMessage = () => {
    if (!input.trim() || !user || !selectedRoom) return;

    const { store_id, buyer_id } = selectedRoom;

    const payload = {
      storeId: store_id,
      buyerId: buyer_id,
      message: input,
      message_type: "text",
    };

    socketRef.current.emit("chat_message", payload);

    setRoomMessages((prev) => ({
      ...prev,
      [getRoomKey(selectedRoom)]: [
        ...(prev[getRoomKey(selectedRoom)] || []),
        { text: input, mine: true, type: "text" },
      ],
    }));

    setInput("");
  };

  const messages = selectedRoom
    ? roomMessages[getRoomKey(selectedRoom)] || []
    : [];

  return (
    <div className="w-full h-screen max-h-screen flex bg-white">
      <AttachmentModal show={modal} onClose={() => setModal(false)} />

      <div className="flex flex-col h-full">
        <ChatNavbar onBack={() => alert("Back to main menu")} />
        <div className="flex-1 overflow-hidden">
          <ChatSidebar
            rooms={rooms.map((r) => ({
              store_id: r.store_id,
              buyer_id: r.buyer_id,
              store_name: r.store_name,
              lastMessage:
                roomMessages[getRoomKey(r)]?.slice(-1)[0]?.text ||
                "Belum ada pesan",
              time: "Baru saja",
              status: roomMessages[getRoomKey(r)]?.slice(-1)[0]?.mine
                ? "sent"
                : "read",
            }))}
            selectedRoom={selectedRoom}
            onSelect={setSelectedRoom} // langsung object room
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <ChatHeader room={selectedRoom} />
        <div className="flex-1 p-6 overflow-y-auto bg-[url(/img/chat-background.png)] flex flex-col">
          {messages.map((m, i) => (
            <ChatBubble key={i} text={m.text} mine={m.mine} type={m.type} />
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 bg-white flex gap-2 items-center">
          <button
            onClick={() => setModal(true)}
            className="p-2 px-4 bg-gray-200 rounded-full hover:opacity-40"
          >
            +
          </button>

          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Tulis pesan..."
            className="flex-1 p-2 border border-gray-400 rounded-xl resize-none overflow-y-auto max-h-[120px] focus:outline-gray-500"
            rows={1}
          />

          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-green-600 text-white rounded-xl"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
