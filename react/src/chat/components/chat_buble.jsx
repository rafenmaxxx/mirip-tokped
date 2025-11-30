function ChatBubble({ text, mine }) {
  return (
    <div
      className={`max-w-[60%] p-3 rounded-xl text-sm mb-2 shadow ${
        mine
          ? "bg-green-500 text-white self-end"
          : "bg-green-200 text-gray-800 self-start"
      }`}
    >
      {text}
    </div>
  );
}

export default ChatBubble;
