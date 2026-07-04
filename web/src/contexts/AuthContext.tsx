import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Auth context — talks to the nurovia-api backend.
 *
 * No passwords or tokens are stored in localStorage. The session lives in
 * an httpOnly cookie set by the backend. The frontend only knows the current
 * user's profile (fetched from /api/auth/me on mount).
 */

export type Plan = "free" | "pro" | "team" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  plan: Plan | string;
  role?: string;
  emailVerified?: boolean;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  ready: boolean;
  signin: (email: string, password: string) => Promise<AuthUser>;
  signup: (email: string, name: string, password: string) => Promise<AuthUser>;
  signout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

class AuthApiError extends Error {
  public code: string;
  public status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.name = "AuthApiError";
    this.code = code;
    this.status = status;
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // ignore
    }
    throw new AuthApiError(
      body.error?.code ?? "HTTP_ERROR",
      res.status,
      body.error?.message ?? res.statusText
    );
  }
  return (await res.json()) as T;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await call<{ user: AuthUser }>("/api/auth/me");
      setUser(data.user);
    } catch (err) {
      if (err instanceof AuthApiError && err.status === 401) {
        setUser(null);
      } else {
        console.warn("auth refresh failed:", err);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signin = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    setError(null);
    try {
      const data = await call<{ user: AuthUser }>("/api/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = err instanceof AuthApiError ? err.message : "Sign-in failed";
      setError(msg);
      throw err;
    }
  }, []);

  const signup = useCallback(async (email: string, name: string, password: string): Promise<AuthUser> => {
    setError(null);
    try {
      const data = await call<{ user: AuthUser }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, name, password }),
      });
      return data.user;
    } catch (err) {
      const msg = err instanceof AuthApiError ? err.message : "Sign-up failed";
      setError(msg);
      throw err;
    }
  }, []);

  const signout = useCallback(async () => {
    try {
      await call("/api/auth/signout", { method: "POST" });
    } catch (err) {
      console.warn("signout failed:", err);
    } finally {
      setUser(null);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await call("/api/auth/forgot", { method: "POST", body: JSON.stringify({ email }) });
    } catch (err) {
      const msg = err instanceof AuthApiError ? err.message : "Failed to send reset email";
      setError(msg);
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    setError(null);
    try {
      await call("/api/auth/reset", { method: "POST", body: JSON.stringify({ token, password }) });
    } catch (err) {
      const msg = err instanceof AuthApiError ? err.message : "Reset failed";
      setError(msg);
      throw err;
    }
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    setError(null);
    try {
      await call(`/api/auth/verify?token=${encodeURIComponent(token)}`);
    } catch (err) {
      const msg = err instanceof AuthApiError ? err.message : "Verification failed";
      setError(msg);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      ready: !loading,
      signin,
      signup,
      signout,
      forgotPassword,
      resetPassword,
      verifyEmail,
      refresh,
      clearError,
    }),
    [user, loading, error, signin, signup, signout, forgotPassword, resetPassword, verifyEmail, refresh, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}