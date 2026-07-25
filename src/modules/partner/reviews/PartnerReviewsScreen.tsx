// Screen: V-23 · Primitives: Review
// Route: /partner/reviews

import { useMemo, useState } from "react";
import { Star, Loader2, MessageCircleReply, Send } from "lucide-react";
import { toast } from "sonner";
import PartnerScreenLayout from "@/modules/partner/components/PartnerScreenLayout";
import { useAuthStore } from "@/store/auth.store";
import {
  useReplyReview,
  useVendorReviewAggregate,
  useVendorReviews,
} from "./hooks";

const PartnerReviewsScreen = () => {
  const partnerId = useAuthStore((s) => s.user?.id ?? "partner-demo");
  const { data: reviews = [], isLoading, isError } = useVendorReviews(partnerId);
  const { data: agg } = useVendorReviewAggregate(partnerId);
  const reply = useReplyReview();
  const [ratingFilter, setRatingFilter] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    if (ratingFilter === 0) return reviews;
    return reviews.filter((r) => Math.round(r.rating) === ratingFilter);
  }, [reviews, ratingFilter]);

  const sendReply = async (id: string) => {
    const text = (replyDraft[id] ?? "").trim();
    if (!text) {
      toast.error("Reply cannot be empty");
      return;
    }
    await reply.mutateAsync({ partnerId, reviewId: id, reply: text });
    toast.success("Reply posted");
    setReplyDraft((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <PartnerScreenLayout title="Reviews" icon={Star}>
      {/* Aggregate */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-heading-md font-bold text-foreground">
              {agg?.avg?.toFixed(1) ?? "—"}
            </span>
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-sm text-muted-foreground">
              Based on {agg?.total ?? 0} consumer review{agg?.total === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {agg && agg.total > 0 && (
          <div className="mt-4 space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((n) => {
              const count = agg.distribution[n] ?? 0;
              const pct = agg.total > 0 ? (count / agg.total) * 100 : 0;
              return (
                <button
                  key={n}
                  onClick={() =>
                    setRatingFilter((prev) => (prev === n ? 0 : n))
                  }
                  className="w-full flex items-center gap-2 group"
                >
                  <span className="text-caption font-bold text-muted-foreground w-3">
                    {n}
                  </span>
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full ${
                        ratingFilter === n ? "bg-primary" : "bg-yellow-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-caption text-muted-foreground w-6 text-right">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-center text-body-sm text-destructive py-8">
          Couldn't load reviews
        </p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-14 gap-2 text-center">
          <Star className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-body-sm text-muted-foreground">
            No reviews {ratingFilter ? `at ${ratingFilter}★` : "yet"}
          </p>
        </div>
      ) : (
        filtered.map((r) => (
          <div
            key={r.id}
            className="p-4 rounded-2xl border border-border bg-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-body-sm font-bold text-foreground truncate">
                  {r.consumerName}
                </p>
                <p className="text-caption text-muted-foreground truncate">
                  {r.listingName} · {r.bookingRef}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < r.rating
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="mt-2 text-body-sm text-foreground">{r.text}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {new Date(r.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>

            {r.vendorReply ? (
              <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-caption font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                  <MessageCircleReply className="w-3 h-3" /> Your reply
                </p>
                <p className="text-body-sm text-foreground mt-1">
                  {r.vendorReply}
                </p>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <input
                  value={replyDraft[r.id] ?? ""}
                  onChange={(e) =>
                    setReplyDraft((prev) => ({ ...prev, [r.id]: e.target.value }))
                  }
                  placeholder="Write a public reply..."
                  className="flex-1 h-11 px-3 rounded-xl border border-border bg-background text-body-sm"
                />
                <button
                  onClick={() => sendReply(r.id)}
                  disabled={reply.isPending}
                  className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
                  aria-label="Send reply"
                >
                  {reply.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </PartnerScreenLayout>
  );
};

export default PartnerReviewsScreen;
