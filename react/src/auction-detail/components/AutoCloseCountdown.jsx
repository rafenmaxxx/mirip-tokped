import { useEffect, useState, useRef } from "react";

function AutoCloseCountdown({ lastBidTime, onAutoClose }) {
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [isFrozen, setIsFrozen] = useState(true);
  const hasCalledAutoClose = useRef(false);

  useEffect(() => {
    if (!lastBidTime) {
      setSecondsLeft(15);
      setIsFrozen(true);
      hasCalledAutoClose.current = false;
      return;
    }

    setIsFrozen(false);

    const checkCountdown = () => {
      const now = Date.now();
      const lastBidTimestamp = new Date(lastBidTime).getTime();
      const diff = now - lastBidTimestamp;
      const secondsPassed = Math.floor(diff / 1000);
      const remaining = 15 - secondsPassed;

      if (remaining <= 0) {
        setSecondsLeft(0);
        if (!hasCalledAutoClose.current) {
          hasCalledAutoClose.current = true;
          onAutoClose();
        }
      } else {
        setSecondsLeft(remaining);
      }
    };

    checkCountdown();
    const interval = setInterval(checkCountdown, 1000);

    return () => clearInterval(interval);
  }, [lastBidTime, onAutoClose]);

  return (
    <div
      className={`border rounded-lg p-4 mb-6 ${
        isFrozen
          ? "bg-gray-50 border-gray-300"
          : "bg-orange-50 border-orange-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            className={`w-6 h-6 ${
              isFrozen
                ? "text-gray-400"
                : "text-orange-600 animate-pulse"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3
              className={`font-semibold ${
                isFrozen ? "text-gray-700" : "text-orange-900"
              }`}
            >
              {isFrozen
                ? "Menunggu Bid Pertama"
                : "Lelang Akan Berakhir Otomatis"}
            </h3>
            <p
              className={`text-sm ${
                isFrozen ? "text-gray-600" : "text-orange-800"
              }`}
            >
              {isFrozen
                ? "Countdown akan dimulai setelah ada bid pertama"
                : `Tidak ada bid baru dalam ${secondsLeft} detik`}
            </p>
          </div>
        </div>
        <div
          className={`text-3xl font-bold ${
            isFrozen ? "text-gray-400" : "text-orange-600"
          }`}
        >
          {secondsLeft}s
        </div>
      </div>
      
      {isFrozen && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Lelang akan otomatis berakhir jika tidak ada bid baru dalam 15 detik
          </span>
        </div>
      )}
    </div>
  );
}

export default AutoCloseCountdown;