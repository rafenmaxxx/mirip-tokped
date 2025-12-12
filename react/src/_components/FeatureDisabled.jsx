import { useNavigate, useSearchParams } from "react-router-dom";

export default function FeatureDisabled() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reason = searchParams.get("reason") || "Mohon maaf, fitur ini sedang dalam pemeliharaan sistem untuk meningkatkan layanan kami.";
  
  const featureParam = searchParams.get("feature");
  const featureNames = {
    checkout: "Checkout",
    chat: "Chat",
    auction: "Lelang",
  };
  const featureTitle = featureNames[featureParam] ? `Fitur ${featureNames[featureParam]}` : "Fitur";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-[480px] w-full p-8 md:p-10 text-center rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-100">
        
        <div className="mb-6 flex justify-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
                 <img 
                  src="/react/img/flags-disabled.png" 
                  alt="Feature Disabled" 
                  className="w-full h-full object-contain"
                />
            </div>
        </div>

        <h1 className="text-[22px] font-bold text-gray-800 mb-3 tracking-tight">
          {featureTitle} Tidak Tersedia
        </h1>

        {/* PERBAIKAN DI SINI */}
        {/* Ditambahkan class 'break-words' agar teks panjang terpotong ke bawah */}
        <p className="text-[15px] text-gray-500 mb-8 leading-relaxed px-4 break-words">
          {reason}
        </p>

        <button
          onClick={() => window.location.href = "/"}
          className="w-full bg-[#00AA5B] hover:bg-[#03924e] text-white font-bold text-sm py-3 px-6 rounded-lg transition-all duration-200 shadow-[0_2px_4px_rgba(0,170,91,0.2)] hover:shadow-[0_4px_8px_rgba(0,170,91,0.3)]"
        >
          Kembali ke beranda
        </button>

      </div>
    </div>
  );
}