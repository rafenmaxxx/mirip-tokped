// ICONS
const IconUser = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);
const IconCheck = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      d="M5 13l4 4L19 7"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
    />
  </svg>
);
const IconCheckCheck = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M3 12l4 4 4-4" stroke="currentColor" fill="none" strokeWidth="2" />
    <path
      d="M13 12l4 4 4-4"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
    />
  </svg>
);

function ChatSidebar({ rooms, selectedRoom, onSelect }) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b bg-green-50">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          <IconUser className="w-6 h-6 text-gray-500" />
        </div>
        <div>
          <p className="font-semibold">YOU</p>
          <p className="text-xs text-gray-500">Online</p>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {rooms.map((room) => (
          <div
            key={`${room.store_id}-${room.buyer_id}`}
            onClick={() => onSelect(room)}
            className={`p-4 border-b border-gray-200 cursor-pointer flex gap-3 hover:bg-green-50 ${
              selectedRoom &&
              (selectedRoom.store_id === room.store_id &&
              selectedRoom.buyer_id === room.buyer_id
                ? "bg-green-100"
                : "")
            }`}
          >
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <IconUser className="w-6 h-6 text-gray-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-sm">{room.store_name}</p>
                <span className="text-xs text-gray-400">{room.time}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-600 truncate max-w-[150px]">
                  {room.lastMessage || "Belum ada pesan"}
                </p>

                {room.status === "sent" && (
                  <IconCheck className="w-4 h-4 text-gray-400" />
                )}
                {room.status === "read" && (
                  <IconCheckCheck className="w-4 h-4 text-blue-500" />
                )}
                {room.status === "unread" && (
                  <IconCheckCheck className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatSidebar;
