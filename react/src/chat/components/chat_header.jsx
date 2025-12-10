import React from "react";

const ConnectionStatus = ({ status }) => {
  const statusConfig = {
    connected: { color: "bg-green-500", text: "[WS] : Online" },
    disconnected: { color: "bg-red-500", text: "[WS] : Offline" },
    connecting: { color: "bg-yellow-500", text: "[WS] : Connecting..." },
    error: { color: "bg-red-500", text: "[WS] : Connection Error" },
    failed: { color: "bg-red-500", text: "[WS] : Reconnect Failed" },
  };

  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 ${config.color} rounded-full`}></div>
      <span className="text-xs text-gray-600">{config.text}</span>
    </div>
  );
};

const ChatHeader = ({ room, currentUser, isTyping, connectionStatus }) => {
  if (!room) {
    return (
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="ml-3">
              <p className="font-semibold text-gray-400">Pilih percakapan</p>
            </div>
          </div>
          <ConnectionStatus status={connectionStatus} />
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">{getDisplayName()}</p>
            <div className="flex items-center gap-2">
              {isTyping ? (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                  <p className="text-sm text-green-600">Mengetik...</p>
                </div>
              ) : (
                <ConnectionStatus status={connectionStatus} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
