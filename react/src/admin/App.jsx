"use client";
import { useState, useEffect } from "react";
import Icons from "./components/icons";

import Header from "./components/header";
import GlobalFlags from "./components/global_flags";
import UserCard from "./components/user_card";
import Pagination from "./components/pagination";
import UserFlags from "./components/user_flags";

const Dashboard = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const isModalOpen = Boolean(selectedUser);

  const handleOpenModal = (user) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");

        const params = new URLSearchParams({
          page: currentPage,
          limit: usersPerPage,
          search: debouncedSearchQuery,
        });

        const response = await fetch(
          `http://localhost:80/node/api/user?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 401) {
          console.log("Token expired, logging out...");
          localStorage.clear();
          window.location.href = "/react/admin-login";
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        console.log("Users data:", data);

        // Transform data
        const transformedUsers = data.data.map((user) => ({
          id: `USER-${user.user_id}`,
          userId: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          date: new Date(user.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          balance: `Rp ${(user.balance || 0).toLocaleString("id-ID")}`,
          address: user.address,
        }));

        setUsers(transformedUsers);
        setTotalPages(data.pagination.totalPages);
        setTotalUsers(data.pagination.total);
        setError(null);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err.message);
        setUsers([]);
        setTotalPages(1);
        setTotalUsers(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, usersPerPage, debouncedSearchQuery]);

  // Debounce search query (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUsersPerPageChange = (newPerPage) => {
    setUsersPerPage(newPerPage);
    setCurrentPage(1);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-[#F0F3F7] font-sans">
      <Header searchQuery={searchQuery} onSearchChange={handleSearchChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT PANEL */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
            <GlobalFlags />

            <div className="mt-6 bg-[#D6001C] rounded-lg p-4 shadow-lg text-white relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="absolute -left-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-xl"></div>

              <div className="flex items-start space-x-3 relative z-10">
                <Icons.AlertTriangle
                  className="flex-shrink-0 mt-1 w-6 h-6"
                  fill="white"
                  stroke="#D6001C"
                />
                <div>
                  <h3 className="font-bold text-lg uppercase tracking-wider">
                    Warning!
                  </h3>
                  <p className="text-xs text-white/90 mt-1 leading-relaxed">
                    Mengubah global flags akan memengaruhi pengalaman pengguna
                    dengan signifikan.
                  </p>
                  <p className="font-bold text-sm mt-2 border-b-2 border-white/40 inline-block pb-0.5">
                    Proceed with caution
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-200 rounded-xl mb-2 p-6 shadow-sm flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AA5B] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data user...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center text-red-600">
                    <Icons.AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-semibold">Error: {error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-4 px-4 py-2 bg-[#00AA5B] text-white rounded-lg hover:bg-[#008F4D] transition"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Icons.Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 font-medium">
                      {debouncedSearchQuery
                        ? `Tidak ada user dengan "${debouncedSearchQuery}"`
                        : "Tidak ada user ditemukan"}
                    </p>
                    {debouncedSearchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="mt-4 px-4 py-2 bg-[#00AA5B] text-white rounded-lg hover:bg-[#008F4D] transition"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.map((user) => (
                    <UserCard
                      key={user.userId}
                      user={user}
                      onManage={handleOpenModal}
                    />
                  ))}
                </div>
              )}
            </div>

            {!loading && !error && totalUsers > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalUsers={totalUsers}
                usersPerPage={usersPerPage}
                onPageChange={handlePageChange}
                onUsersPerPageChange={handleUsersPerPageChange}
              />
            )}
          </div>
        </div>
      </main>

      <UserFlags
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={selectedUser}
      />
    </div>
  );
};

export default Dashboard;
