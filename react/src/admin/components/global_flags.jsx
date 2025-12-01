import { useState } from "react";
import Toggle from "./toggle";

const GlobalFlags = () => {
  const [flags, setFlags] = useState({
    auction: true,
    chat: true,
    checkout: true,
  });

  const handleToggle = (key) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-[#00AA5B] text-center font-bold text-xl mb-6 border-b pb-2">
          Global Flags
        </h2>

        <div className="space-y-2">
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

        <div className="mt-8 flex justify-end">
          <button className="bg-[#00AA5B] hover:bg-[#03924e] text-white font-semibold py-2 px-6 rounded-lg transition shadow-md hover:shadow-lg text-sm">
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalFlags;
