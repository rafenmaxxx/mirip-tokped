import React, { useState } from "react";
import ChatNavbar from "./components/chat_navbar";
import ChatBubble from "./components/chat_buble";
import ChatSidebar from "./components/chat_sidebar";
import AttachmentModal from "./components/attachment_modal";

function Chat() {
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [input, setInput] = useState("");
  const [modal, setModal] = useState(false);

  // ROOM INFO
  const rooms = [
    {
      id: 1,
      name: "Toko ElectroHub",
      lastMessage: "Baik kak...",
      time: "13:45",
      status: "read",
    },
    {
      id: 2,
      name: "Seller FashionKu",
      lastMessage: "Kak ukurannya...",
      time: "12:10",
      status: "sent",
    },
    {
      id: 3,
      name: "Official Store ABC",
      lastMessage: "Terima kasih...",
      time: "Kemarin",
      status: "unread",
    },
  ];

  // STORED MESSAGES PER ROOM
  const [roomMessages, setRoomMessages] = useState({
    1: [{ mine: false, text: "Halo kak, ada yang bisa dibantu?" }],
    2: [{ mine: false, text: "Kak ukuran apa?" }],
    3: [{ mine: false, text: "Terima kasih sudah order!" }],
  });

  const messages = roomMessages[selectedRoom] || [];

  // SWITCH ROOM
  const handleSelectRoom = (id) => {
    setSelectedRoom(id);
  };

  // SEND MESSAGE
  const sendMessage = () => {
    if (!input.trim()) return;

    setRoomMessages({
      ...roomMessages,
      [selectedRoom]: [...messages, { mine: true, text: input }],
    });

    setInput("");
  };

  const getLastMessageInfo = (id) => {
    const msgs = roomMessages[id];
    if (!msgs || msgs.length === 0)
      return { last: "Belum ada pesan", time: "", status: "unread" };

    const last = msgs[msgs.length - 1];
    return {
      last: last.text,
      time: "Baru saja",
      status: last.mine ? "sent" : "read",
    };
  };

  const roomsWithLastMessage = rooms.map((r) => {
    const info = getLastMessageInfo(r.id);
    return {
      ...r,
      lastMessage: info.last,
      time: info.time,
      status: info.status,
    };
  });

  return (
    <div className="w-full h-screen flex bg-white">
      <AttachmentModal show={modal} onClose={() => setModal(false)} />

      <div>
        <ChatNavbar onBack={() => alert("Back to main menu")} />

        <ChatSidebar
          rooms={roomsWithLastMessage}
          selectedRoom={selectedRoom}
          onSelect={handleSelectRoom}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 overflow-y-auto bg-green-50 flex flex-col">
          {messages.map((m, i) => (
            <ChatBubble key={i} text={m.text} mine={m.mine} />
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 bg-white flex gap-2 items-center">
          <button
            onClick={() => setModal(true)}
            className="p-2 px-4 bg-gray-200 rounded-full hover:opacity-40"
          >
            +
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tulis pesan..."
            className="flex-1 p-2 border border-gray-400 rounded-xl focus:ring-green-500"
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
