import Icons from "./icons";

const Pagination = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center mt-6 text-sm text-gray-600">
      
      {/* Kolom Kiri: Informasi */}
      <div className="justify-self-start">
        <p>
          Menampilkan <span className="font-bold">6</span> dari{" "}
          <span className="font-bold">20</span> users
        </p>
      </div>

      {/* Kolom Tengah: Tombol Pagination */}
      <div className="justify-self-center flex items-center space-x-2">
        <button className="w-8 h-8 flex items-center justify-center rounded bg-[#00AA5B] text-white shadow font-medium hover:bg-[#03924e]">
          1
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-300 hover:bg-gray-50 transition">
          2
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-300 hover:bg-gray-50 transition">
          3
        </button>
        <span className="px-1 text-gray-400">...</span>
        <button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-300 hover:bg-gray-50 transition">
          6
        </button>
      </div>

      {/* Kolom Kanan: Dropdown */}
      <div className="justify-self-end">
        <div className="ml-4 flex items-center space-x-2 bg-white border border-gray-300 px-2 py-1 rounded cursor-pointer">
          <span>6</span>
          <Icons.ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};

export default Pagination;
