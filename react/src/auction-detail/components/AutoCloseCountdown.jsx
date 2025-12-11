import { useEffect, useState, useRef } from "react";

function AutoCloseCountdown({ lastBidTime, onAutoClose }) {
  const [secondsLeft, setSecondsLeft] = useState(36000);
  const [isActive, setIsActive] = useState(false);
  const hasCalledAutoClose = useRef(false);

  useEffect(() => {
    if (!lastBidTime) {
      setIsActive(false);
      hasCalledAutoClose.current = false;
      return;
    }

    const checkCountdown = () => {
      const now = Date.now();
      const lastBidTimestamp = new Date(lastBidTime).getTime();
      const diff = now - lastBidTimestamp;
      const secondsPassed = Math.floor(diff / 1000);
      const remaining = 15 - secondsPassed;

      if (remaining <= 0) {
        setSecondsLeft(0);
        setIsActive(false);
        if (!hasCalledAutoClose.current) {
          hasCalledAutoClose.current = true;
          onAutoClose();
        }
      } else if (remaining <= 1500000) {
        setSecondsLeft(remaining);
        setIsActive(true);
      } else {
        setIsActive(false);
      }
    };

    checkCountdown();
    const interval = setInterval(checkCountdown, 1000);

    return () => clearInterval(interval);
  }, [lastBidTime, onAutoClose]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-orange-600 animate-pulse"
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
            <h3 className="font-semibold text-orange-900">
              Lelang Akan Berakhir Otomatis
            </h3>
            <p className="text-sm text-orange-800">
              Tidak ada bid baru dalam {secondsLeft} detik
            </p>
          </div>
        </div>
        <div className="text-3xl font-bold text-orange-600">{secondsLeft}s</div>
      </div>
    </div>
  );
}

export default AutoCloseCountdown;
