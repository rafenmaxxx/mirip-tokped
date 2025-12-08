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

const ChatBubble = ({ text, mine, type, time, status = "sent", product }) => {
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

  // Format waktu
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  // Tampilan untuk item preview
  if (type === "item_preview") {
    const productData = product || JSON.parse(text || "{}");

    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-2`}>
        <div
          className={`max-w-[320px] rounded-2xl overflow-hidden border ${
            mine ? "border-blue-200" : "border-gray-200"
          } ${mine ? "bg-blue-50" : "bg-white"}`}
        >
          {/* Product Image */}
          <div className="h-40 bg-gray-200 overflow-hidden">
            {productData.main_image_path ? (
              <img
                src={"/api/image?file=" + productData.main_image_path}
                alt={productData.product_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-3">
            <h4 className="font-semibold text-gray-800 mb-1">
              {productData.product_name}
            </h4>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {productData.description}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-green-600 font-bold">
                Rp {productData.price?.toLocaleString("id-ID") || "0"}
              </span>
              <span className="text-xs text-gray-500">
                Stok: {productData.stock || "0"}
              </span>
            </div>
          </div>

          {/* Time and Status */}
          <div
            className={`px-3 pb-2 pt-1 border-t ${
              mine ? "border-blue-100" : "border-gray-100"
            }`}
          >
            <div
              className={`flex items-center justify-end text-xs ${
                mine ? "text-blue-300" : "text-gray-500"
              }`}
            >
              <span className="mr-2">{formatTime(time)}</span>
              {mine && getStatusIcon()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan untuk text message biasa
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
          <span className="mr-2">{formatTime(time)}</span>
          {mine && getStatusIcon()}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
