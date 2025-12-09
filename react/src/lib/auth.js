// Get access token from localStorage
export const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

// Get refresh token from localStorage
export const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};

// Get user data from localStorage
export const getUser = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

// Save tokens and user data to localStorage
export const saveAuthData = (accessToken, refreshToken, user) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
};

// Clear all auth data from localStorage
export const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

// Check if user is authenticated (has valid token)
export const isAuthenticated = () => {
  return !!getAccessToken();
};

// Refresh access token using refresh token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      console.error("No refresh token available");
      return null;
    }

    const res = await fetch("http://localhost:80/node/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      const newAccessToken = data.data.accessToken;

      // Update access token in localStorage
      localStorage.setItem("accessToken", newAccessToken);

      console.log("Token refreshed successfully");
      return newAccessToken;
    } else {
      console.error("Token refresh failed");
      clearAuthData();
      return null;
    }
  } catch (error) {
    console.error("Token refresh error:", error);
    clearAuthData();
    return null;
  }
};

// Logout user (clear tokens and redirect)
export const logout = async (redirectUrl = "/react/admin-login") => {
  try {
    await fetch("http://localhost:80/node/api/auth/logout", {
      method: "POST",
    });
  } catch (error) {
    console.error("Logout API error:", error);
  } finally {
    clearAuthData();
    window.location.href = redirectUrl;
  }
};

// Make authenticated API request with automatic token refresh
export const authenticatedFetch = async (url, options = {}) => {
  let token = getAccessToken();

  if (!token) {
    throw new Error("No access token available");
  }

  // Add Authorization header
  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  let response = await fetch(url, authOptions);

  // If token expired, try to refresh
  if (response.status === 401) {
    console.log("Token expired, attempting refresh...");

    const newToken = await refreshAccessToken();

    if (newToken) {
      // Retry request with new token
      authOptions.headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(url, authOptions);
    } else {
      // Refresh failed, redirect to login
      clearAuthData();
      window.location.href = "/react/admin-login";
      throw new Error("Session expired, please login again");
    }
  }

  return response;
};
