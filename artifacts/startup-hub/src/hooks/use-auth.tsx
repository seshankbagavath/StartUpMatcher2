import React, { createContext, useContext, useState, useEffect } from "react";
import { useGetMe, getGetMeQueryKey, setAuthTokenGetter, User } from "@workspace/api-client-react";

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("startup_hub_token"));

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("startup_hub_token"));
  }, []);

  const { data: user, isLoading: isUserLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: getGetMeQueryKey(),
    }
  });

  useEffect(() => {
    if (isError) {
      setToken(null);
      localStorage.removeItem("startup_hub_token");
    }
  }, [isError]);

  const login = (newToken: string) => {
    localStorage.setItem("startup_hub_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("startup_hub_token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user: user || null, token, isLoading: isUserLoading && !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
