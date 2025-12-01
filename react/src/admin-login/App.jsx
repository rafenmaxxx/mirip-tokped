import React, { useState } from "react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login Data:", formData);
    // Logika login di sini
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      {/* Card Container */}
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00AA5B] focus:border-transparent transition-all placeholder-gray-400 text-sm"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00AA5B] focus:border-transparent transition-all placeholder-gray-400 text-sm pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold select-none"
              >
                {showPassword ? "hide" : "show"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#00AA5B] hover:bg-[#03924e] text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] mt-4"
          >
            Masuk
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Bukan Admin?{" "}
          <a href="#" className="text-[#00AA5B] font-bold hover:underline">
            Kembali ke Default Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
