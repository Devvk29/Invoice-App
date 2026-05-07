import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_URL = `http://${window.location.hostname}:5000/api`;

// Axios instance with auth token
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("invoice_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check token on mount
  useEffect(() => {
    const token = localStorage.getItem("invoice_token");
    const savedUser = localStorage.getItem("invoice_user");
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      api
        .get("/auth/me")
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem("invoice_user", JSON.stringify(res.data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signup = async (name, phone, email, employee_id, password, role) => {
    const res = await api.post("/auth/signup", {
      name,
      phone,
      email,
      employee_id,
      password,
      role,
    });
    localStorage.setItem("invoice_token", res.data.token);
    localStorage.setItem("invoice_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const login = async (employee_id, password) => {
    const res = await api.post("/auth/login", { employee_id, password });
    localStorage.setItem("invoice_token", res.data.token);
    localStorage.setItem("invoice_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("invoice_token");
    localStorage.removeItem("invoice_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export { api };
export default AuthContext;
