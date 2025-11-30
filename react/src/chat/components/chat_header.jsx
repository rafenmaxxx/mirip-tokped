import React from "react";

export default function ChatHeader({ room }) {
  if (!room) return null;

  return (
    <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3">
      <img
        src={room.avatar || "/img/default-shop.png"}
        alt="profile"
        className="w-10 h-10 rounded-full object-cover"
      />

      <div className="flex flex-col">
        <h2 className="font-semibold">{room.name}</h2>
        <p className="text-sm text-gray-500">Online</p>
      </div>
    </div>
  );
}
