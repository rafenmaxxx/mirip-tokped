import React from "react";

const IconUser = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

const ChatHeader = ({ room, currentUser, isTyping }) => {
  if (!room) {
    return (
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="ml-3">
            <p className="font-semibold text-gray-400">Pilih percakapan</p>
          </div>
        </div>
      </div>
    );
  }

  const getDisplayName = () => {
    if (currentUser?.role === "BUYER") {
      return room.store_name || "Toko";
    } else {
      return room.buyer_name || "Pembeli";
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <IconUser className="w-6 h-6 text-gray-500" />
        </div>
        <div className="ml-3">
          <p className="font-semibold">{getDisplayName()}</p>
          {isTyping ? (
            <p className="text-sm text-green-600">Sedang mengetik...</p>
          ) : (
            <p className="text-sm text-gray-500">Online</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
