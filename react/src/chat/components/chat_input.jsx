import React, { useState, useRef } from "react";

const ChatInput = ({ onSendMessage, onTypingChange, disabled }) => {
  const [input, setInput] = useState("");
  const isTypingRef = useRef(false); // Track typing state

  const handleInputChange = (e) => {
    const value = e.target.value;
    const wasEmpty = input.trim().length === 0;
    const isEmpty = value.trim().length === 0;

    setInput(value);

    // Auto resize
    e.target.style.height = "auto";
    const maxHeight = 24 * 5;
    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;

    // **SIMPLE TYPING LOGIC:**
    // 1. Jika dari kosong → ada isi: start typing
    if (wasEmpty && !isEmpty && !isTypingRef.current) {
      console.log("🚀 Start typing");
      isTypingRef.current = true;
      onTypingChange?.(true);
    }

    // 2. Jika dari ada isi → kosong: stop typing
    if (!wasEmpty && isEmpty && isTypingRef.current) {
      console.log("🛑 Stop typing (input cleared)");
      isTypingRef.current = false;
      onTypingChange?.(false);
    }
    // 3. Jika tetap ada isi: tetap dalam state typing (tidak perlu emit ulang)
  };

  const handleSend = () => {
    if (!input.trim() || disabled) return;

    // Stop typing sebelum kirim
    if (isTypingRef.current) {
      console.log("📤 Stop typing before send");
      isTypingRef.current = false;
      onTypingChange?.(false);
    }

    onSendMessage(input);
    setInput("");

    // Reset textarea height
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "auto";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Jika input box kehilangan fokus, tetap dalam state typing jika ada isi
  // (tidak otomatis stop)
  const handleBlur = () => {
    console.log("👁️ Input blurred, typing state unchanged");
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-white flex gap-2 items-center">
      <button
        onClick={() => alert("Attachment feature coming soon")}
        className="p-2 px-4 bg-gray-200 rounded-full hover:opacity-80 transition-opacity"
        disabled={disabled}
      >
        +
      </button>

      <textarea
        value={input}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onBlur={handleBlur}
        placeholder={
          disabled ? "Pilih percakapan terlebih dahulu" : "Tulis pesan..."
        }
        className="flex-1 p-3 border border-gray-300 rounded-xl resize-none overflow-y-auto max-h-[120px] focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
        rows={1}
        disabled={disabled}
      />

      <button
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Kirim
      </button>
    </div>
  );
};

export default ChatInput;
