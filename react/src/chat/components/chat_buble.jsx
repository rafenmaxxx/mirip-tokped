import React from "react";

const ChatBubble = ({
  text,
  mine,
  type,
  time,
  status = "sent",
  product,
  image,
  read = false,
}) => {
  const getStatusIcon = () => {
    if (read)
      return (
        <div className="flex items-center">
          R
          {read && (
            <div className="ml-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      );

    switch (status) {
      case "read":
        return (
          <div className="flex items-center">
            R
            {read && (
              <div className="ml-1 w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        );
      case "delivered":
        return <p>D</p>;
      case "sent":
        return <p>S</p>;
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

  // Status text untuk debugging
  const getStatusText = () => {
    if (!mine) return "";

    switch (status) {
      case "sending":
        return "Mengirim...";
      case "sent":
        return "Terkirim";
      case "delivered":
        return "Terkirim";
      case "read":
        return "Dibaca";
      default:
        return "";
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
              className={`flex items-center justify-between text-xs ${
                mine ? "text-blue-300" : "text-gray-500"
              }`}
            >
              <span className="text-xs opacity-75">{getStatusText()}</span>
              <div className="flex items-center">
                <span className="mr-2">{formatTime(time)}</span>
                {mine && getStatusIcon()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan untuk image message
  if (type === "image") {
    const imageData = image || JSON.parse(text || "{}");
    const imageUrl = imageData.url || imageData.path;

    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-2`}>
        <div
          className={`max-w-[320px] rounded-2xl overflow-hidden border ${
            mine ? "border-blue-200" : "border-gray-200"
          } ${mine ? "bg-blue-50" : "bg-white"}`}
        >
          {/* Image Preview */}
          <div className="h-64 bg-gray-200 overflow-hidden relative">
            {imageUrl ? (
              <img
                src={"/api/image?file=" + imageUrl}
                alt={imageData.originalname || "Image"}
                className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
                onClick={() => window.open(imageUrl, "_blank")}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                <span className="text-gray-500">Image not available</span>
              </div>
            )}
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              📷
            </div>
          </div>

          {/* Image Info */}
          <div className="p-3">
            <p className="text-sm font-medium text-gray-800 mb-1 truncate">
              {imageData.originalname || "Image"}
            </p>
            <p className="text-xs text-gray-600">
              {(imageData.size / 1024).toFixed(1)} KB
            </p>
          </div>

          {/* Time and Status */}
          <div
            className={`px-3 pb-2 pt-1 border-t ${
              mine ? "border-blue-100" : "border-gray-100"
            }`}
          >
            <div
              className={`flex items-center justify-between text-xs ${
                mine ? "text-blue-300" : "text-gray-500"
              }`}
            >
              <span className="text-xs opacity-75">{getStatusText()}</span>
              <div className="flex items-center">
                <span className="mr-2">{formatTime(time)}</span>
                {mine && getStatusIcon()}
              </div>
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
          className={`flex items-center justify-between mt-1 text-xs ${
            mine ? "text-blue-200" : "text-gray-500"
          }`}
        >
          <span className="text-xs opacity-75">{getStatusText()}</span>
          <div className="flex items-center">
            <span className="mr-2">{formatTime(time)}</span>
            {mine && getStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
