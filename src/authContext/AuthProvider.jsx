import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("trust_point_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ FIX 1: correct baseURL
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'
  const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
  });

  // load saved token if present
  const savedToken = (() => {
    try { return localStorage.getItem('trust_point_token') } catch { return null }
  })()
  if (savedToken) api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`

  const fetchUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      // persist fetched user
      try { localStorage.setItem("trust_point_user", JSON.stringify(res.data)); } catch {}
    } catch {
      // if fetch fails (not authenticated) clear user
      try { localStorage.removeItem('trust_point_user') } catch {}
      setUser(null)
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOGIN
  const login = async (invester_id, password) => {
    try {
      const res = await api.post("/auth/login", { invester_id, password });
      // Handle Django JWT response with access + cookie
      if (res.data?.access) {
        api.defaults.headers.common["Authorization"] = `Bearer ${res.data.access}`;
        try { localStorage.setItem('trust_point_token', res.data.access) } catch {}
        await fetchUser();
        return res.data;
      }

      // Handle simpler Node backend response that returns user directly
      if (res.data?.user) {
        setUser(res.data.user);
        try { localStorage.setItem('trust_point_user', JSON.stringify(res.data.user)); } catch {}
        return res.data;
      }

      // Fallback: if response contains user-like payload
      if (res.data && typeof res.data === "object") {
        setUser(res.data);
        try { localStorage.setItem('trust_point_user', JSON.stringify(res.data)); } catch {}
        return res.data;
      }
    } catch (err) {
      throw err.response?.data || { message: "Login failed" };
    }
  };

  // ✅ REGISTER (FIXED)
  const register = async (email, fullName, password) => {
    try {
      const res = await api.post("/auth/signup", {
        name: fullName,
        email,
        password,
      });

      // If backend returns access token, set header and fetch user
      if (res.data?.access) {
        api.defaults.headers.common["Authorization"] = `Bearer ${res.data.access}`;
        try { localStorage.setItem('trust_point_token', res.data.access) } catch {}
        await fetchUser();
      }

      return res.data;
    } catch (err) {
      console.error("register error", err);
      throw err.response?.data || { message: "Registration failed" };
    }
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem('trust_point_user'); localStorage.removeItem('trust_point_token') } catch {}
    navigate("/login");
  };

  // expose a refreshUser function for components that need to re-fetch user
  const refreshUser = fetchUser;

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
        setUser, // Expose setUser for direct updates
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
