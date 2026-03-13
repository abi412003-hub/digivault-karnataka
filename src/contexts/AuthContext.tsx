import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { fetchList } from "@/lib/api";

interface AuthState {
  client_id: string;
  phone: string;
  name: string;
  registrationType: string;
  supabaseUserId: string;
}

interface AuthContextType {
  auth: AuthState;
  setAuth: React.Dispatch<React.SetStateAction<AuthState>>;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (phone: string) => void;
  register: (phone: string, name: string) => void;
  setRegistrationType: (type: string) => void;
  logout: () => Promise<void>;
  lookupClient: (phone: string) => Promise<any | null>;
}

const emptyAuth: AuthState = { client_id: "", phone: "", name: "", registrationType: "", supabaseUserId: "" };

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const stored = localStorage.getItem("edigivault_client");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          client_id: parsed.name || "",
          phone: parsed.phone_no || "",
          name: parsed.client_name || "",
          registrationType: parsed.registration_type || "",
          supabaseUserId: parsed.supabaseUserId || "",
        };
      }
    } catch {}
    return emptyAuth;
  });
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = !!auth.client_id;

  const lookupClient = useCallback(async (phone: string): Promise<any | null> => {
    try {
      const clients = await fetchList(
        "DigiVault Client",
        ["name", "client_name", "phone_no", "client_status", "registration_type", "client_type"],
        [["phone_no", "like", "%" + phone]]
      );
      if (clients && clients.length > 0) return clients[0];
      return null;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("edigivault_client");
    setAuth(emptyAuth);
  }, []);

  const login = (phone: string) => {
    setAuth((prev) => ({ ...prev, phone }));
  };

  const register = (phone: string, name: string) => {
    setAuth((prev) => ({ ...prev, client_id: "CL-00001", phone, name }));
  };

  const setRegistrationType = (type: string) => {
    setAuth((prev) => ({ ...prev, registrationType: type }));
  };

  // Persist to localStorage when client_id changes
  useEffect(() => {
    if (auth.client_id) {
      localStorage.setItem(
        "edigivault_client",
        JSON.stringify({
          name: auth.client_id,
          client_name: auth.name,
          phone_no: auth.phone,
          registration_type: auth.registrationType,
          supabaseUserId: auth.supabaseUserId,
        })
      );
    }
  }, [auth.client_id, auth.name, auth.phone, auth.registrationType, auth.supabaseUserId]);

  // Check Supabase session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const rawPhone = session.user.phone || "";
          const phone = rawPhone.replace(/^\+91/, "");
          const supabaseUserId = session.user.id;

          // If we already have client_id from localStorage, just update supabaseUserId
          if (auth.client_id) {
            setAuth((prev) => ({ ...prev, supabaseUserId }));
          } else {
            // Look up client in ERPNext
            const client = await lookupClient(phone);
            if (client) {
              setAuth({
                client_id: client.name,
                name: client.client_name,
                phone,
                registrationType: client.registration_type || "",
                supabaseUserId,
              });
            } else {
              // Session valid but no ERPNext client — incomplete registration
              setAuth((prev) => ({ ...prev, phone, supabaseUserId }));
            }
          }
        }
      } catch {}
      setIsLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        localStorage.removeItem("edigivault_client");
        setAuth(emptyAuth);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth, isLoggedIn, isLoading, login, register, setRegistrationType, logout, lookupClient }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
