import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import api from "@/lib/axios";
import type { User } from "@/lib/types";
import { toast } from "@/components/ui/toast";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string, timezone?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  demoLogin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isDemoUser(user: User | null): boolean {
  return Boolean(user?.isDemo);
}

function clearDemoSession() {
  sessionStorage.removeItem("demo_token");
}

function clearPermanentSession() {
  localStorage.removeItem("token");
}

async function sendDemoCleanupBeacon(token: string): Promise<void> {
  try {
    const BASE_URL =
      import.meta.env.MODE === "development"
        ? "http://localhost:8000/api"
        : import.meta.env.VITE_API_URL || "/api";

    navigator.sendBeacon(
      `${BASE_URL}/auth/demo-cleanup?token=${encodeURIComponent(token)}`
    );
  } catch {
    // Best-effort: browser is closing, nothing we can do
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [pendingAuthCode, setPendingAuthCode] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get("auth_code");
      const urlError = urlParams.get("error");

      if (authCode) {
        urlParams.delete("auth_code");
        const newSearch = urlParams.toString() ? `?${urlParams.toString()}` : "";
        window.history.replaceState({}, document.title, window.location.pathname + newSearch);
        return authCode;
      }

      if (urlError) {
        urlParams.delete("error");
        const newSearch = urlParams.toString() ? `?${urlParams.toString()}` : "";
        window.history.replaceState({}, document.title, window.location.pathname + newSearch);
        toast.add({ title: t("auth.googleLoginFailed"), type: "error" });
      }
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const demoToken = sessionStorage.getItem("demo_token");
      if (demoToken) return demoToken;
    }
    return localStorage.getItem("token");
  });

  const [loading, setLoading] = useState<boolean>(true);
  const cleanupListenerRef = useRef<(() => void) | null>(null);
  const lastExchangedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingAuthCode) return;
    if (lastExchangedCodeRef.current === pendingAuthCode) return;
    lastExchangedCodeRef.current = pendingAuthCode;

    const exchangeCode = async () => {
      try {
        const res = await api.post("/auth/google/exchange", { code: pendingAuthCode });
        const { token: jwt } = res.data;
        clearDemoSession();
        localStorage.setItem("token", jwt);
        setToken(jwt);
        toast.add({ title: t("auth.googleLoginSuccess"), type: "success" });
      } catch {
        toast.add({ title: t("auth.googleLoginFailed"), type: "error" });
      } finally {
        setPendingAuthCode(null);
      }
    };

    exchangeCode();
  }, [pendingAuthCode, t]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
    } catch (err) {
      console.error("fetchCurrentUser error:", err);
      clearPermanentSession();
      clearDemoSession();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchCurrentUser]);

  // Register pagehide listener for demo session browser-exit cleanup
  useEffect(() => {
    if (!user || !isDemoUser(user) || !token) {
      return;
    }

    let called = false;

    const handlePageHide = () => {
      if (called) return;
      called = true;
      sendDemoCleanupBeacon(token);
    };

    window.addEventListener("pagehide", handlePageHide);
    cleanupListenerRef.current = () => {
      window.removeEventListener("pagehide", handlePageHide);
    };

    return () => {
      if (cleanupListenerRef.current) {
        cleanupListenerRef.current();
        cleanupListenerRef.current = null;
      }
    };
  }, [user, token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post("/auth/login", { email, password });
      clearDemoSession();
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      toast.add({ title: res.data.message || t("auth.loginSuccess"), type: "success" });
      return true;
    } catch (err: any) {
      toast.add({ title: err.response?.data?.message || t("errors.login"), type: "error" });
      return false;
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    timezone = "Asia/Ho_Chi_Minh"
  ): Promise<boolean> => {
    try {
      const res = await api.post("/auth/register", {
        fullName,
        email,
        password,
        timezone,
      });
      clearDemoSession();
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      toast.add({ title: res.data.message || t("auth.registerSuccess"), type: "success" });
      return true;
    } catch (err: any) {
      toast.add({ title: err.response?.data?.message || t("errors.register"), type: "error" });
      return false;
    }
  };

  const demoLogin = async (): Promise<boolean> => {
    try {
      const res = await api.post("/auth/demo-login");
      sessionStorage.setItem("demo_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      toast.add({ title: t("auth.demoLoginSuccess"), type: "success" });
      return true;
    } catch (err: any) {
      toast.add({ title: err.response?.data?.message || t("errors.demoLogin"), type: "error" });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    const isDemo = isDemoUser(user);
    const currentToken = token;

    if (isDemo && currentToken) {
      try {
        await api.post(`/auth/demo-cleanup?token=${encodeURIComponent(currentToken)}`);
      } catch {
        // Cleanup failed — still clear local state
      }
    }

    clearPermanentSession();
    clearDemoSession();
    setToken(null);
    setUser(null);
    toast.add({ title: t("auth.loggedOut"), type: "info" });
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      const res = await api.put("/auth/me", data);
      setUser(res.data.user);
      toast.add({ title: t("success.updateProfile"), type: "success" });
      return true;
    } catch (err: any) {
      toast.add({ title: err.response?.data?.message || t("errors.updateProfile"), type: "error" });
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
