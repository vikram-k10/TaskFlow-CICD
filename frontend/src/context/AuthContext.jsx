import { createContext, useContext, useState, useEffect } from "react";
import { fetchMe, loginUser, registerUser } from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // The account always comes from the server (/auth/me), never from the copy cached in localStorage.
  // `ready` stays false until that check finishes, so no page renders with stale data.
  const [ready, setReady] = useState(!token);

  useEffect(() => {
    if (!token) {
      setReady(true);
      return;
    }
    let cancelled = false;
    fetchMe()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {}) // a 401 is already handled by the shared request helper
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (name, email, password) => {
    const data = await registerUser(name, email, password);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}