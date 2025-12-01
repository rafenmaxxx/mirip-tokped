import Icons from "./icons";

const Header = () => {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      {/* Logo */}
      <div className="text-2xl font-bold text-[#00AA5B] tracking-tight">
        NIMONSPEDIA
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl mx-8 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icons.Search className="text-gray-400 w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Cari pengguna..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#00AA5B] focus:border-[#00AA5B] sm:text-sm transition duration-150 ease-in-out"
        />
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 cursor-pointer transition">
          <Icons.User className="text-gray-600 w-4 h-4" />
          <span className="text-sm font-semibold text-gray-700">
            Nama Admin
          </span>
        </div>
        <button className="flex items-center space-x-1 bg-[#00AA5B] hover:bg-[#03924e] text-white px-4 py-1.5 rounded-lg text-sm font-medium transition shadow-md">
          <span>Logout</span>
          <Icons.LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};

export default Header;
