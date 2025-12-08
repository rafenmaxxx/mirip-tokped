import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

const ProtectedAdminRoute = ({ redirectUrl = "/admin-login" }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {        
        const res = await fetch("/node/api/auth/me", {
          credentials: "include",
        });

        console.log("Response status:", res.status);

        if (res.ok) {
          const data = await res.json();
          console.log("Auth response:", data);
          console.log("User data:", data.data);
          console.log("User role:", data.data?.role);
          
          setAdmin(data.data);
        } else {
          const errorData = await res.json();
          console.log("Auth failed:", errorData);
          setAdmin(null);
        }
      } catch (err) {
        console.error("Admin auth check error:", err);
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AA5B] mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  console.log("Final admin state:", admin);
  console.log("Admin role check:", admin?.role === "ADMIN");

  // Belum login atau bukan admin
  if (!admin || admin.role !== "ADMIN") {
    console.log("Redirecting to:", redirectUrl);
    window.location.href = redirectUrl;
    return null;
  }

  console.log("Admin authenticated, rendering protected content");
  return <Outlet />;
};

export default ProtectedAdminRoute;