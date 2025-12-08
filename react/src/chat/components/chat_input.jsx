import React, { useState, useRef, useEffect } from "react";

const ChatInput = ({ onSendMessage, onTyping, disabled }) => {
  const [input, setInput] = useState("");
  const typingTimeoutRef = useRef(null);
  const lastTypingEmitRef = useRef(0); 

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    
    e.target.style.height = "auto";
    const maxHeight = 24 * 5;
    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;

    
    if (value.trim() && onTyping) {
      const now = Date.now();
      const timeSinceLastEmit = now - lastTypingEmitRef.current;

      
      if (timeSinceLastEmit > 2000) {
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        
        typingTimeoutRef.current = setTimeout(() => {
          onTyping();
          lastTypingEmitRef.current = Date.now();
        }, 1000);
      }
    }
  };

  const handleSend = () => {
    if (!input.trim() || disabled) return;

    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    onSendMessage(input);
    setInput("");

    
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

  
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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
