import React from "react";

const IconCheck = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path
      d="M5 13l4 4L19 7"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
    />
  </svg>
);

const IconCheckDouble = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path
      d="M3 12l4 4 4-4M13 12l4 4 4-4"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
    />
  </svg>
);

const ChatBubble = ({ text, mine, type, time, status = "sent" }) => {
  const getStatusIcon = () => {
    switch (status) {
      case "read":
        return <IconCheckDouble className="text-blue-500" />;
      case "delivered":
        return <IconCheckDouble className="text-gray-400" />;
      case "sent":
        return <IconCheck className="text-gray-400" />;
      case "sending":
        return (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        );
      default:
        return null;
    }
  };

  if (type === "system") {
    return (
      <div className="text-center my-2">
        <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full">
          {text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          mine
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 rounded-bl-none"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{text}</p>
        <div
          className={`flex items-center justify-end mt-1 text-xs ${
            mine ? "text-blue-200" : "text-gray-500"
          }`}
        >
          <span className="mr-2">{time}</span>
          {mine && getStatusIcon()}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
