import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { request } from "../api/client.js";

const AuthContext = createContext(null);
const storageKey = "sqb-token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(storageKey));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let active = true;

    async function hydrate() {
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }

      try {
        const payload = await request("/auth/me", { token });
        if (active) {
          setUser(payload.user);
        }
      } catch {
        localStorage.removeItem(storageKey);
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    hydrate();
    return () => {
      active = false;
    };
  }, [token]);

  async function login(email, password) {
    const payload = await request("/auth/login", {
      method: "POST",
      body: { email, password }
    });
    localStorage.setItem(storageKey, payload.token);
    setToken(payload.token);
    setUser(payload.user);
    return payload.user;
  }

  async function register(values) {
    const payload = await request("/auth/register", {
      method: "POST",
      body: values
    });
    localStorage.setItem(storageKey, payload.token);
    setToken(payload.token);
    setUser(payload.user);
    return payload.user;
  }

  function logout() {
    localStorage.removeItem(storageKey);
    sessionStorage.clear();
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthed: Boolean(token && user),
      isSuperAdmin: user?.role === "SuperAdmin",
      isSubAdmin: user?.role === "SubAdmin",
      isUser: user?.role === "User",
      login,
      register,
      logout,
      api: (path, options = {}) => request(path, { ...options, token })
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
