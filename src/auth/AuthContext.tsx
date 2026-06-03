import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "../types";
import { api } from "../api/client";

type AuthStatus = "checking" | "in" | "out";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    // The API client tells us when the server rejects our token.
    api.setUnauthorizedHandler(() => {
      setUser(null);
      setStatus("out");
    });
    if (!api.hasToken()) {
      setStatus("out");
      return;
    }
    // Validate the stored token by fetching the current user.
    api
      .me()
      .then((u) => {
        setUser(u);
        setStatus("in");
      })
      .catch(() => setStatus("out"));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const u = await api.login(username, password);
    setUser(u);
    setStatus("in");
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setStatus("out");
  }, []);

  return <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
