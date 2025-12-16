import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true, // Send cookies
  });

  const fetchUser = async () => {
    try {
      const res = await api.get("/me/");
      setUser(res.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // expose a refresh helper to allow other components to re-fetch current user
  const refreshUser = fetchUser;

  const refreshToken = async () => {
    try {
      const res = await api.post("/refresh/", {}, { withCredentials: true });
      const access = res.data.access;
      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
      return access;
    } catch (err) {
      console.error("Token refresh failed", err);
      setUser(null);
      throw err;
    }
  };

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (originalRequest.url.includes("/refresh/")) {
        setUser(null);
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          await refreshToken();
          return api(originalRequest);
        } catch (refreshError) {
          setUser(null);
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  const login = async (email, password) => {
    try {
      const res = await api.post("/login/", { email, password });
      const access = res.data.access;
      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
      await fetchUser();
    } catch (err) {
      throw err.response?.data || { message: "Login failed" };
    }
  };

  const register = async (email, full_name, password) => {
    try {
      const res = await api.post("/register/", { email, full_name, password });
      console.log('register response', res);
      const access = res.data?.access;
      if (access) api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
      await fetchUser();
      return res.data;
    } catch (err) {
      console.error('register error', err.response || err);
      throw err.response?.data || { message: "Registration failed" };
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout/", {}, { withCredentials: true });
      setUser(null);
      delete api.defaults.headers.common["Authorization"];
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const submitContact = async (contactData) => {
    try {
      const res = await api.post("/contact/", contactData);
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: "Failed to submit contact" };
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        login,
        register,
        logout,
        submitContact,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
