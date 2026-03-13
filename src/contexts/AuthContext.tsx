import React, { createContext, useContext, useState } from "react";

interface AuthState {
  client_id: string;
  phone: string;
  name: string;
}

interface AuthContextType {
  auth: AuthState;
  setAuth: React.Dispatch<React.SetStateAction<AuthState>>;
  isLoggedIn: boolean;
  login: (phone: string) => void;
  register: (phone: string, name: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({ client_id: "", phone: "", name: "" });

  const isLoggedIn = !!auth.client_id;

  const login = (phone: string) => {
    setAuth({ client_id: "CL-00001", phone, name: "User" });
  };

  const register = (phone: string, name: string) => {
    setAuth({ client_id: "CL-00001", phone, name });
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, isLoggedIn, login, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
