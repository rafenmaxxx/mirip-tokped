import { useState, useEffect } from "react";
import Toggle from "./toggle";
import Icons from "./icons";

const UserFlags = ({ isOpen, onClose, user }) => {
  // Local state untuk toggle di dalam modal
  const [flags, setFlags] = useState({
    auction: true,
    chat: true,
    checkout: true,
  });

  // Reset state ketika modal dibuka untuk user baru
  useEffect(() => {
    if (isOpen) {
      setFlags({ auction: true, chat: true, checkout: true });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    // Backdrop dengan Blur Effect
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity">
      {/* Modal Content */}
      <div className="bg-white rounded-xl shadow-2xl w-[400px] p-8 relative animate-fadeInScale">
        {/* Close Button (Optional UX improvement) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <Icons.X className="w-5 h-5" />
        </button>

        {/* Header Sesuai Gambar */}
        <div className="text-center mb-6">
          <h2 className="text-[#00AA5B] font-bold text-2xl">User Flags</h2>
          {/* Menampilkan nama user agar konteks jelas */}
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
            {user?.name}
          </p>
          <div className="h-0.5 w-full bg-gray-200 mt-4"></div>
        </div>

        {/* Toggles */}
        <div className="space-y-2 mb-8 px-2">
          <Toggle
            label="Auction Feature"
            checked={flags.auction}
            onChange={() => handleToggle("auction")}
          />

          {!flags.auction && (
            <div className="mb-4 animate-fadeIn">
              <textarea
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-600 focus:ring-1 focus:ring-[#00AA5B] focus:outline-none"
                rows="3"
                placeholder="Berikan alasan penonaktifan..."
              ></textarea>
            </div>
          )}

          <Toggle
            label="Live Chat System"
            checked={flags.chat}
            onChange={() => handleToggle("chat")}
          />

          {!flags.chat && (
            <div className="mb-4 animate-fadeIn">
              <textarea
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-600 focus:ring-1 focus:ring-[#00AA5B] focus:outline-none"
                rows="3"
                placeholder="Berikan alasan penonaktifan..."
              ></textarea>
            </div>
          )}

          <Toggle
            label="Checkout Process"
            checked={flags.checkout}
            onChange={() => handleToggle("checkout")}
          />

          {!flags.checkout && (
            <div className="mb-4 animate-fadeIn">
              <textarea
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-600 focus:ring-1 focus:ring-[#00AA5B] focus:outline-none"
                rows="3"
                placeholder="Berikan alasan penonaktifan..."
              ></textarea>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#00AA5B] hover:bg-[#03924e] text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all active:scale-95 hover:shadow-lg text-sm"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserFlags;
