import { useState } from "react";
import Icons from "./icons";

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalUsers = 0,
  usersPerPage = 6,
  onPageChange,
  onUsersPerPageChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const itemsPerPageOptions = [4, 6, 8, 12];
  const getPageNumbers = () => {
    const pages = [];

    // Show all pages if total is 5 or less
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startUser = (currentPage - 1) * usersPerPage + 1;
  const endUser = Math.min(currentPage * usersPerPage, totalUsers);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 items-center mt-6 text-sm text-gray-600">
      {/* Kolom Kiri: Informasi */}
      <div className="justify-self-start">
        <p>
          Menampilkan <span className="font-bold">{endUser}</span> dari{" "}
          <span className="font-bold">{totalUsers}</span> users
        </p>
      </div>

      {/* Kolom Tengah: Tombol Pagination */}
      <div className="justify-self-center flex items-center space-x-2">
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${index}`} className="px-1 text-gray-400">
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 flex items-center justify-center rounded shadow font-medium transition ${
                currentPage === page
                  ? "bg-[#00AA5B] text-white hover:bg-[#03924e]"
                  : "bg-white border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Kolom Kanan: Dropdown Items per page */}
      <div className="justify-self-end relative">
        <div
          className="ml-4 flex items-center space-x-2 bg-white border border-gray-300 px-3 py-1.5 rounded cursor-pointer hover:bg-gray-50 transition"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="font-medium">{usersPerPage}</span>
          <Icons.ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* Dropdown content */}
            <div className="absolute right-0 bottom-full mb-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 overflow-hidden">
              {itemsPerPageOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onUsersPerPageChange(option);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition ${
                    usersPerPage === option
                      ? "bg-[#00AA5B] text-white hover:bg-[#03924e]"
                      : ""
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Pagination;
