import { Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

const ProtectedRoutes = ({ redirectUrl = "/login", allowedRoles }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/node/api/user/me", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.data);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.log(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user || !allowedRoles.includes(user.role)) {
    window.location.href = redirectUrl;
    return null; // React tidak render apa-apa
  }

  return <Outlet />;
};

export default ProtectedRoutes;
