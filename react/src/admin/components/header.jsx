import { useState, useEffect } from "react";
import Icons from "./icons";

const Header = ({ searchQuery, onSearchChange, roleFilter, onRoleChange }) => {
  const [adminName, setAdminName] = useState("Admin");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setAdminName(user.name || "Admin");
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      console.log("Logging out...");

      try {
        await fetch("http://localhost:80/node/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.error("Logout API error:", error);
      }

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      console.log("Logout successful, redirecting...");

      // redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      {/* Logo */}
      <div className="text-2xl font-bold text-[#00AA5B] tracking-tight">
        MIRIP-TOKPED
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl mx-8 flex items-center gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icons.Search className="text-gray-400 w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama atau email pengguna..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#00AA5B] focus:border-[#00AA5B] sm:text-sm transition duration-150 ease-in-out"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#00AA5B] focus:border-[#00AA5B] transition duration-150 ease-in-out"
        >
          <option value="">Semua Role</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 cursor-pointer transition">
          <Icons.User className="text-gray-600 w-4 h-4" />
          <span className="text-sm font-semibold text-gray-700">
            {adminName}
          </span>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center space-x-1 bg-[#00AA5B] hover:bg-[#03924e] text-white px-4 py-1.5 rounded-lg text-sm font-medium transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <>
              <span>Logging out...</span>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            </>
          ) : (
            <>
              <span>Logout</span>
              <Icons.LogOut className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </nav>
  );
};

export default Header;
