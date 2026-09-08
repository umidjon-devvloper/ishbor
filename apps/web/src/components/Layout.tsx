// Shriftlar self-hosted: public/fonts + fonts.css (unicode-range bilan).
// MUHIM: @fontsource CSS'ni to'g'ridan-to'g'ri import qilmang — Vike u holda
// BARCHA subset faylini avtomatik <link rel="preload"> qiladi (~500KB!),
// bu mobil LCP'ni bir necha soniyaga kechiktiradi. public/ fayllarini preload qilmaydi.
// fonts.css global.css ichiga @import bilan kiradi — bitta CSS so'rovi bo'lsin.
import "../styles/global.css";
import React, { useEffect, useRef } from "react";
import Header from "./Header.js";
import Footer from "./Footer.js";
import { AuthProvider } from "./AuthContext.js";
import { LocaleProvider } from "../lib/i18n/index.js";
import { ThemeProvider } from "../lib/theme.js";

// Barcha kirish animatsiyalari CSS'da (animate-fade-up, useReveal) — hidratsiyani
// kutmasdan birinchi paint'dayoq ishlaydi (LCP tez), JS kutubxonasiz.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <ThemeProvider>
        <AuthProvider>
          <div className="flex min-h-screen flex-col bg-paper font-body text-ink antialiased">
            <ScrollProgress />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}

/** Sahifa boshida o'qish jarayonini ko'rsatuvchi ingichka gradient chiziq.
 *  Faqat transform o'zgaradi (GPU), scroll passiv + rAF bilan siyraklashtirilgan. */
function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      el.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} className="scroll-progress" aria-hidden />;
}
