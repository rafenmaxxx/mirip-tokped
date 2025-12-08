import { useEffect, useState } from "react";
import { subscribeToast } from "../lib/toast";

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsub = subscribeToast(({ title, message }) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, title, message, show: false }]);

      // Trigger show animation
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, show: true } : t))
        );
      }, 10);

      // Hide toast
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, show: false } : t))
        );
      }, 2700);

      // Remove toast
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    });

    return unsub;
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[10000] space-y-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 min-w-[300px] max-w-[500px] px-6 py-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ${
            t.show ? "animate-slideIn" : "opacity-0 translate-x-[400px]"
          }`}
          style={{
            background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
            borderLeftColor: "#1e7e34",
            color: "white",
          }}
        >
          <div className="flex items-center justify-center w-6 h-6 text-xl font-bold">
            ✓
          </div>
          <div className="flex-1">
            <div className="font-medium text-[15px]">{t.title}</div>
            {t.message && (
              <div className="text-sm opacity-90 mt-0.5">{t.message}</div>
            )}
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease;
        }
      `}</style>
    </div>
  );
}
