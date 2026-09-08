import React, { useEffect, useRef, useState } from "react";
import { useT, useLocale, useHref } from "../../lib/i18n/index.js";
import { useAuth } from "../../components/AuthContext.js";
import { Skeleton } from "../../components/Skeleton.js";
import { StarRating, StarInput } from "../../components/StarRating.js";
import { useChatSocket } from "../../lib/useChatSocket.js";
import {
  fetchConversations,
  fetchMessages,
  fetchConversationRating,
  submitConversationRating,
  fetchUserSummary,
} from "../../lib/api.js";
import type { Conversation, ChatMessage, ConversationRating, UserSummary } from "../../lib/types.js";

export default function Page() {
  const t = useT();
  const { locale } = useLocale();
  const l = useHref();
  const { status, accessToken, user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<ConversationRating | null>(null);
  const [ratePanelOpen, setRatePanelOpen] = useState(false);
  const [partner, setPartner] = useState<UserSummary | null>(null);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "guest" || !accessToken) {
      window.location.assign(l("/login"));
      return;
    }
    fetchConversations(accessToken).then((c) => {
      setConversations(c);
      setLoading(false);
      const cid = new URLSearchParams(window.location.search).get("c");
      if (cid) setActiveId(cid);
    });
  }, [status, accessToken]);

  useEffect(() => {
    if (!activeId || !accessToken) return;
    fetchMessages(accessToken, activeId).then(setMessages);
    setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, unread: 0 } : c)));
    // Baho holati (berish mumkinmi, o'rtacha) + profil modalini tozalash
    setRating(null);
    setRatePanelOpen(false);
    setPartner(null);
    setPartnerOpen(false);
    fetchConversationRating(accessToken, activeId).then(setRating);
  }, [activeId, accessToken]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const { send, markRead, connected } = useChatSocket(accessToken, {
    onMessage: (m) => {
      const mine = m.senderId === user?.id;
      const isActive = m.conversationId === activeIdRef.current;
      if (isActive) {
        setMessages((prev) => [...prev, m]);
        if (!mine) markRead(m.conversationId); // darrov o'qilgan deb belgilaymiz
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === m.conversationId
            ? {
                ...c,
                lastMessage: m.body,
                lastMessageAt: m.createdAt,
                unread: isActive || mine ? c.unread : c.unread + 1,
              }
            : c
        )
      );
    },
    onRead: (conversationId) => {
      // Qarshi tomon o'qidi — mening xabarlarim ikki belgiga o'tadi
      if (conversationId === activeIdRef.current) {
        setMessages((prev) => prev.map((m) => (m.senderId === user?.id ? { ...m, isRead: true } : m)));
      }
    },
  });

  function selectConversation(id: string) {
    setActiveId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || !activeId) return;
    send(activeId, body);
    setInput("");
  }

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-5 h-[60vh] w-full rounded-2xl" />
      </div>
    );
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-5 font-display text-2xl font-700 text-ink sm:text-3xl">{t.chat.title}</h1>

      {conversations.length === 0 ? (
        <div className="animate-fade-up rounded-2xl border border-line bg-surface p-12 text-center">
          <p className="font-display text-lg font-600 text-ink">{t.chat.empty}</p>
          <p className="mt-1 text-sm text-dusk">{t.chat.emptyHint}</p>
        </div>
      ) : (
        <div className="grid h-[68vh] grid-cols-1 overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-[320px_1fr]">
          {/* Suhbatlar ro'yxati */}
          <div className={`flex-col border-line md:flex md:border-r ${activeId ? "hidden" : "flex"}`}>
            <div className="border-b border-line px-4 py-3 font-display text-sm font-600 text-ink">
              {t.chat.conversations}
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition-colors hover:bg-surface-2 ${
                    c.id === activeId ? "bg-surface-2" : ""
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 font-display text-sm font-700 text-ink">
                    {c.title.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-600 text-ink">{c.title}</span>
                      {c.unread > 0 && (
                        <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-signal px-1 text-[10px] font-700 leading-none text-white">
                          {c.unread > 99 ? "99+" : c.unread}
                        </span>
                      )}
                    </span>
                    {c.subtitle && <span className="block truncate text-xs text-dusk">{c.subtitle}</span>}
                    {c.lastMessage && (
                      <span
                        className={`mt-0.5 line-clamp-1 text-xs ${
                          c.unread > 0 ? "font-600 text-ink" : "text-dusk"
                        }`}
                      >
                        {c.lastMessage}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className={`flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
            {active ? (
              <>
                <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                  <button
                    onClick={() => setActiveId(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-dusk hover:bg-surface-2 md:hidden"
                    aria-label="Back"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {/* Suhbatdosh ismi/avatari — bosilganda profil modali ochiladi */}
                  <button
                    type="button"
                    onClick={async () => {
                      setPartnerOpen(true);
                      if (!partner && accessToken && active.otherUserId) {
                        setPartner(await fetchUserSummary(accessToken, active.otherUserId));
                      }
                    }}
                    title={t.chat.partnerInfo}
                    className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition-colors hover:bg-surface-2/60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal font-display text-sm font-700 text-white">
                      {active.title.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-600 text-ink transition-colors group-hover:text-signal">
                        {active.title}
                      </span>
                      <span className="flex items-center gap-2">
                        {active.subtitle && <span className="truncate text-xs text-dusk">{active.subtitle}</span>}
                        {rating && rating.otherCount > 0 && rating.otherAvg !== null && (
                          <span className="flex shrink-0 items-center gap-1 text-xs text-dusk">
                            <StarRating value={rating.otherAvg} className="text-xs" />
                            {t.chat.ratingOf(rating.otherAvg.toFixed(1), rating.otherCount)}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                  {/* Baho: berilgan bo'lsa — statik ko'rsatkich (o'zgartirib bo'lmaydi),
                      berilmagan bo'lsa — tugma */}
                  {rating &&
                    (rating.myScore ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-lg bg-gold/10 px-2.5 py-1.5 text-xs font-700 text-gold-deep">
                        <span aria-hidden className="text-gold">★</span>
                        {rating.myScore}/5
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRatePanelOpen((v) => !v)}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-signal hover:text-signal"
                      >
                        <span aria-hidden className="text-gold">★</span>
                        {t.chat.rate}
                      </button>
                    ))}
                  <span
                    className={`flex items-center gap-1.5 text-[11px] ${connected ? "text-growth" : "text-dusk"}`}
                    title={connected ? "online" : "offline"}
                  >
                    <span className={`h-2 w-2 rounded-full ${connected ? "bg-growth" : "bg-line"}`} />
                  </span>
                </div>

                {ratePanelOpen && rating && !rating.myScore && accessToken && activeId && (
                  <RatingPanel
                    key={activeId}
                    rating={rating}
                    onSubmit={async (score, comment) => {
                      await submitConversationRating(accessToken, activeId, score, comment);
                      // Panel yopiladi, header'da statik "★ n/5" ko'rinadi;
                      // suhbatdoshning o'rtachasi ham darhol yangilanadi.
                      setRating((r) =>
                        r
                          ? {
                              ...r,
                              myScore: score,
                              myComment: comment ?? null,
                              otherAvg:
                                Math.round(
                                  (((r.otherAvg ?? 0) * r.otherCount + score) / (r.otherCount + 1)) * 10
                                ) / 10,
                              otherCount: r.otherCount + 1,
                            }
                          : r
                      );
                      setRatePanelOpen(false);
                    }}
                  />
                )}

                {/* Suhbatdosh profili modali */}
                {partnerOpen && (
                  <PartnerModal partner={partner} onClose={() => setPartnerOpen(false)} />
                )}

                <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-surface-2/40 p-4">
                  {messages.length === 0 ? (
                    <p className="mt-8 text-center text-sm text-dusk">{t.chat.noMessages}</p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.senderId === user?.id;
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] animate-fade-up rounded-2xl px-3.5 py-2 text-sm ${
                              mine
                                ? "rounded-br-md bg-signal text-white"
                                : "rounded-bl-md bg-surface text-ink shadow-xs"
                            }`}
                          >
                            <span className="whitespace-pre-wrap break-words">{m.body}</span>
                            <span
                              className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${
                                mine ? "text-white/70" : "text-dusk"
                              }`}
                            >
                              {fmtTime(m.createdAt)}
                              {mine && <ReadTicks read={m.isRead} />}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-line p-3">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t.chat.placeholder}
                    className="h-11 flex-1 rounded-xl border border-line bg-surface-2 px-4 text-sm text-ink placeholder:text-dusk focus:border-signal focus:bg-surface focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-signal text-white transition-all hover:bg-signal-dark active:scale-95 disabled:opacity-50"
                    aria-label={t.chat.send}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M4 12l16-8-6 16-2.5-6.5L4 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-dusk">
                {t.chat.selectConversation}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Suhbatdoshga 1–5 yulduz baho berish paneli (chat header ostida ochiladi). */
function RatingPanel({
  rating,
  onSubmit,
}: {
  rating: ConversationRating;
  onSubmit: (score: number, comment?: string) => Promise<void>;
}) {
  const t = useT();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ikkala tomon ham yozmagan bo'lsa — sabab tushuntiriladi, forma ko'rinmaydi
  if (!rating.eligible) {
    return (
      <div className="animate-slide-down border-b border-line bg-surface-2/60 px-4 py-3 text-xs text-dusk">
        🔒 {t.chat.rateLocked}
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!score) return;
    setState("saving");
    setErrorMsg(null);
    try {
      await onSubmit(score, comment.trim() || undefined);
      // Muvaffaqiyatda panel ota-komponentda yopiladi
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Xatolik");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="animate-slide-down border-b border-line bg-surface-2/60 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-ink">{t.chat.rateTitle}:</span>
        <StarInput value={score} onChange={(v) => { setScore(v); setState("idle"); }} className="text-xl" />
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.chat.rateCommentPlaceholder}
          maxLength={1000}
          className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-xs text-ink placeholder:text-dusk focus:border-signal focus:outline-none"
        />
        <button
          type="submit"
          disabled={!score || state === "saving"}
          className="h-9 shrink-0 rounded-lg bg-signal px-4 text-xs font-semibold text-white transition-colors hover:bg-signal-dark disabled:opacity-50"
        >
          {state === "saving" ? t.chat.rateSaving : t.chat.rateSubmit}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-dusk">{t.chat.rateOnce}</p>
      {state === "error" && errorMsg && <p className="mt-2 text-xs text-signal">{errorMsg}</p>}
    </form>
  );
}

/** Suhbatdoshning qisqa profili — overlay modal (ikkala rol uchun). */
function PartnerModal({ partner, onClose }: { partner: UserSummary | null; onClose: () => void }) {
  const t = useT();
  const l = useHref();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.chat.partnerInfo}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm animate-card-in rounded-2xl border border-line bg-surface p-6 shadow-pop"
      >
        {!partner ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-2 font-display text-xl font-700 text-ink">
                {partner.company?.logoUrl ? (
                  <img src={partner.company.logoUrl} alt="" width={56} height={56} decoding="async" className="h-full w-full object-cover" />
                ) : (
                  partner.name.charAt(0).toUpperCase()
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-700 leading-tight text-ink">{partner.name}</p>
                {partner.headline && <p className="mt-0.5 text-sm text-dusk">{partner.headline}</p>}
                {partner.company?.industry && (
                  <p className="mt-0.5 text-sm text-dusk">{partner.company.industry}</p>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              {partner.ratingAvg !== null && partner.ratingCount > 0 && (
                <div className="flex items-center gap-2 text-dusk">
                  <StarRating value={partner.ratingAvg} className="text-sm" />
                  <span>{t.chat.ratingOf(partner.ratingAvg.toFixed(1), partner.ratingCount)}</span>
                </div>
              )}
              {partner.regionName && (
                <p className="text-dusk">📍 {partner.regionName}</p>
              )}
              {partner.role === "job_seeker" && partner.isOpenToWork && (
                <p className="inline-flex rounded-md bg-growth/10 px-2 py-0.5 text-xs font-600 text-growth">
                  {t.chat.openToWorkYes}
                </p>
              )}
              {partner.resumeTitle && <p className="text-ink">💼 {partner.resumeTitle}</p>}
              {partner.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {partner.skills.slice(0, 10).map((s) => (
                    <span key={s} className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-medium text-dusk">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {partner.company?.description && (
                <p className="pt-1 text-sm leading-relaxed text-ink/80">
                  {partner.company.description.slice(0, 260)}
                  {partner.company.description.length > 260 ? "…" : ""}
                </p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              {partner.company ? (
                <a
                  href={l(`/employer/${partner.company.slug}`)}
                  className="text-sm font-medium text-signal hover:underline"
                >
                  {t.employerProfile.view} →
                </a>
              ) : (
                <span />
              )}
              <button
                onClick={onClose}
                className="rounded-xl bg-surface-2 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-line"
              >
                {t.empApplications.back}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Telegram uslubidagi belgilar: bitta = yuborildi, ikkita = o'qildi. */
function ReadTicks({ read }: { read: boolean }) {
  if (read) {
    return (
      <svg width="16" height="12" viewBox="0 0 20 12" fill="none" aria-hidden>
        <path d="M2 6.5L5.5 10L12 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.5 10L15 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="11" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 6.5L5 9.5L10.5 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
