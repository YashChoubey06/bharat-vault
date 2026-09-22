"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginDemo,
  logoutDemo,
  getDemoUser,
} from "@/services/mock/auth";

import {
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
} from "@/services/api/auth";

const AuthContext = createContext(null);

const DEMO_MODE =
  process.env.NEXT_PUBLIC_APP_MODE === "demo";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      if (DEMO_MODE) {
        const demoUser = await getDemoUser();
        setUser(demoUser);
      } else {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    setLoading(true);

    try {
      const result = DEMO_MODE
        ? await loginDemo(email, password)
        : await apiLogin(email, password);

      setUser(result.user);

      return result;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      if (DEMO_MODE) {
        await logoutDemo();
      } else {
        await apiLogout();
      }
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}