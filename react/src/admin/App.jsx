"use client";
import { useState } from "react";
import Icons from "./components/icons";

import Header from "./components/header";
import GlobalFlags from "./components/global_flags";
import UserCard from "./components/user_card";
import Pagination from "./components/pagination";
import UserFlags from "./components/user_flags";

const Dashboard = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const isModalOpen = Boolean(selectedUser);
  
  const handleOpenModal = (user) => {
    setSelectedUser(user);
  };
  
  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  // Mock Data
  const users = Array.from({ length: 6 }).map((_, i) => ({
    id: `USER-88${i}`,
    name: i % 2 === 0 ? "Budi Santoso" : "Siti Aminah",
    role: i === 0 ? "Super Admin" : "Reseller",
    date: "20 Okt 2023",
    balance: `Rp ${(1500000 + i * 50000).toLocaleString("id-ID")}`,
  }));

  return (
    <div className="min-h-screen bg-[#F0F3F7] font-sans">
      <Header />

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((user, idx) => (
                  <UserCard
                    key={idx}
                    user={user}
                    onManage={handleOpenModal}
                  />
                ))}
              </div>
            </div>

            <Pagination />
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
