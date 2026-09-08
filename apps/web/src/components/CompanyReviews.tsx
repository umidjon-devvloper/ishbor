import React, { useState } from "react";
import { useT, useLocale, useHref } from "../lib/i18n/index.js";
import { useAuth } from "./AuthContext.js";
import { StarRating, StarInput } from "./StarRating.js";
import { PhoneGateNotice, isPhoneGateError } from "./PhoneGateNotice.js";
import { submitReview, deleteReview } from "../lib/api.js";
import type { CompanyReviewItem } from "../lib/types.js";

export function CompanyReviews({
  slug,
  initialReviews,
}: {
  slug: string;
  initialReviews: CompanyReviewItem[];
}) {
  const t = useT();
  const { locale } = useLocale();
  const l = useHref();
  const { status, accessToken, user } = useAuth();
  const [reviews, setReviews] = useState<CompanyReviewItem[]>(initialReviews);

  const isSeeker = status === "authed" && user?.role === "job_seeker";
  const isAdmin = user?.role === "admin";
  const myReview = reviews.find((r) => r.userId === user?.id);

  const [rating, setRating] = useState<number>(myReview?.rating ?? 0);
  const [comment, setComment] = useState<string>(myReview?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gated, setGated] = useState(false);
  const [saved, setSaved] = useState(false);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    if (rating < 1) {
      setError(t.reviews.ratingRequired);
      return;
    }
    setBusy(true);
    setError(null);
    setGated(false);
    try {
      const result = await submitReview(accessToken, slug, {
        rating,
        comment: comment.trim() || undefined,
      });
      const item: CompanyReviewItem = { ...result, userId: user?.id };
      setReviews((prev) => [item, ...prev.filter((r) => r.id !== result.id && r.userId !== user?.id)]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      if (isPhoneGateError(err)) setGated(true);
      else setError(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    if (!window.confirm(t.reviews.deleteConfirm)) return;
    await deleteReview(accessToken, id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    if (id === myReview?.id) {
      setRating(0);
      setComment("");
    }
  }

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-700 text-ink">{t.reviews.title}</h2>
        {reviews.length > 0 && (
          <span className="flex items-center gap-2 text-sm text-dusk">
            <StarRating value={avg} />
            <span className="font-600 text-ink">{avg.toFixed(1)}</span>
            <span>· {t.reviews.count(reviews.length)}</span>
          </span>
        )}
      </div>

      {isSeeker ? (
        <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-line bg-surface p-5">
          <div className="text-sm font-600 text-ink">
            {myReview ? t.reviews.editReview : t.reviews.writeReview}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm text-dusk">{t.reviews.yourRating}:</span>
            <StarInput
              value={rating}
              onChange={(v) => {
                setRating(v);
                setError(null);
              }}
            />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={t.reviews.commentPlaceholder}
            className="mt-3 w-full resize-none rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-dusk focus:border-signal focus:bg-surface focus:outline-none"
          />
          {gated && <PhoneGateNotice className="mt-2" />}
          {error && <p className="mt-2 text-sm text-signal">{error}</p>}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-signal px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-signal-dark hover:shadow-sm active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? t.reviews.submitting : t.reviews.submit}
            </button>
            {saved && <span className="text-sm font-medium text-growth">{t.reviews.saved}</span>}
          </div>
        </form>
      ) : status === "guest" ? (
        <p className="mt-4 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-dusk">
          <a href={l("/login")} className="font-medium text-signal hover:underline">
            {t.reviews.loginToReview}
          </a>
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {reviews.length === 0 ? (
          <p className="text-sm text-dusk">{t.reviews.noReviews}</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="animate-fade-up rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 font-display text-sm font-700 text-ink">
                    {r.authorName.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <div className="text-sm font-600 text-ink">{r.authorName}</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <StarRating value={r.rating} className="text-xs" />
                      <span className="text-xs text-dusk">{fmtDate(r.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {(isAdmin || r.userId === user?.id) && (
                  <button
                    onClick={() => handleDelete(r.id)}
                    title={t.reviews.delete}
                    aria-label={t.reviews.delete}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-dusk transition-colors hover:bg-surface-2 hover:text-signal"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
              {r.comment && <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{r.comment}</p>}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
