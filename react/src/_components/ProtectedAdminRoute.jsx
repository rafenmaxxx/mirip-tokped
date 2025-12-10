import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

const ProtectedAdminRoute = ({ redirectUrl = "/unauthorized" }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        console.log("Checking admin authentication with JWT...");

        const token = localStorage.getItem("accessToken");

        if (!token) {
          console.log("No token found in localStorage");
          setAdmin(null);
          setLoading(false);
          return;
        }

        console.log("Token found, verifying...");

        const res = await fetch("http://localhost:80/node/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
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

          // Token invalid/expired, remove from localStorage
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");

          setAdmin(null);
        }
      } catch (err) {
        console.error("Admin auth check error:", err);

        // Clear tokens on error
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();

    // check token validity every 1 minute
    const tokenCheckInterval = setInterval(async () => {
      const token = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!token || !refreshToken) {
        console.log("No tokens found, logging out...");
        clearInterval(tokenCheckInterval);
        localStorage.clear();
        window.location.href = redirectUrl;
        return;
      }

      // verify token
      try {
        const res = await fetch("http://localhost:80/node/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          console.log("Token expired, logging out...");
          clearInterval(tokenCheckInterval);
          localStorage.clear();
          window.location.href = redirectUrl;
        }
      } catch (err) {
        console.error("Token check error:", err);
        clearInterval(tokenCheckInterval);
        localStorage.clear();
        window.location.href = redirectUrl;
      }
    }, 60000);

    return () => clearInterval(tokenCheckInterval);
  }, [redirectUrl]);

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