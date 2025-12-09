import React, { useState } from "react";
import { showToast } from "../lib/toast";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:80/node/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Login berhasil", data);

        // Simpan JWT token dan user data di localStorage
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        console.log("Token saved to localStorage");

        // Redirect ke halaman admin
        showToast("Login Berhasil", "Selamat datang kembali, Minped!", "success");
        navigate("/admin", { replace: true });
      } else {
        const errData = await res.json();
        showToast("Login Gagal", errData.message || "Email atau kata sandi salah.", "error");
      }
    } catch (err) {
      showToast("Login Gagal", "Terjadi kesalahan jaringan. Coba lagi nanti.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[420px] border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[#00AA5B] font-bold text-3xl mb-2 tracking-tight">
            Login as Admin
          </h1>
          <p className="text-gray-500 text-sm">
            Selamat datang kembali,{" "}
            <span className="font-medium text-gray-700">Minped!</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Menampilkan Error jika ada */}
          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Masukkan email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00AA5B] transition-all text-sm"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Masukkan kata sandi"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00AA5B] transition-all text-sm pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold"
              >
                {showPassword ? "hide" : "show"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-md ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#00AA5B] hover:bg-[#03924e] hover:shadow-lg active:scale-[0.98]"
            }`}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Bukan Minped?{" "}
          <a href="/login" className="text-[#00AA5B] font-bold hover:underline">
            Kembali
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
