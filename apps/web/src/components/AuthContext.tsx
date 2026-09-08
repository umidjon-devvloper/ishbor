import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchMe, logoutUser, refreshAccessToken } from "../lib/api.js";
import type { CurrentUser } from "../lib/types.js";

type AuthStatus = "loading" | "authed" | "guest";

interface AuthState {
  user: CurrentUser | null;
  status: AuthStatus;
  accessToken: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "ish-top:accessToken";

// Mehmon (kirmagan foydalanuvchi) uchun konsolda bir marta tushunarli xabar.
let guestNoticeShown = false;
function logGuestNotice() {
  if (guestNoticeShown || typeof window === "undefined") return;
  guestNoticeShown = true;
  console.info(
    "%cISH BOR! 👋%c\nSiz tizimga kirmagansiz — mehmon rejimidasiz.\nRo'yxatdan o'tish yoki kirish uchun yuqoridagi tugmalardan foydalaning.",
    "font-size:22px;font-weight:800;color:#1E88E5;line-height:1.6;",
    "font-size:13px;color:#475569;line-height:1.6;",
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Mount'da seansni tiklaymiz: saqlangan token -> bo'lmasa/eskirgan bo'lsa
  // httpOnly refresh cookie orqali yangilaymiz (faqat brauzerda).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const u = await fetchMe(stored);
        if (!cancelled && u) {
          setToken(stored);
          setUser(u);
          setStatus("authed");
          return;
        }
      }
      // Token yo'q yoki muddati tugagan — refresh cookie orqali tiklaymiz
      const fresh = await refreshAccessToken();
      if (fresh) {
        const u = await fetchMe(fresh);
        if (!cancelled && u) {
          window.localStorage.setItem(STORAGE_KEY, fresh);
          setToken(fresh);
          setUser(u);
          setStatus("authed");
          return;
        }
      }
      if (cancelled) return;
      window.localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setStatus("guest");
      logGuestNotice();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Access token ~15 daqiqada tugaydi — 12 daqiqada bir yangilab turamiz
  // (401 xatolari va kutilmagan chiqib ketishning oldini oladi).
  useEffect(() => {
    if (status !== "authed") return;
    const id = window.setInterval(async () => {
      const fresh = await refreshAccessToken();
      if (fresh) {
        window.localStorage.setItem(STORAGE_KEY, fresh);
        setToken(fresh);
      }
    }, 12 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [status]);

  const login = useCallback(async (token: string) => {
    window.localStorage.setItem(STORAGE_KEY, token);
    setToken(token);
    const u = await fetchMe(token);
    setUser(u);
    setStatus(u ? "authed" : "guest");
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      /* server bilan bog'lanmasa ham lokal seansni tozalaymiz */
    }
    window.localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setStatus("guest");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth faqat AuthProvider ichida ishlatilishi kerak");
  return ctx;
}
