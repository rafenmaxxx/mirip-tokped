const IconBack = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      d="M15 6l-6 6 6 6"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
    />
  </svg>
);

function ChatNavbar({ onBack }) {
  return (
    <div className="h-12 bg-green-600 text-white flex items-center gap-3 px-4 shadow">
      <button onClick={onBack}>
        <IconBack className="w-6 h-6" />
      </button>
      <p className="font-semibold">Chat</p>
    </div>
  );
}

export default ChatNavbar;
