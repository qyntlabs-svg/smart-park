import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Send, MessageSquare, Pencil } from "lucide-react";
import { getMechanicShop, setMechanicShop, type MechanicReview } from "@/lib/mechanic";
import { toast } from "sonner";

const MechanicReviewsScreen = () => {
  const navigate = useNavigate();
  const [shop, setShop] = useState(getMechanicShop());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!shop) navigate("/mechanic/dashboard", { replace: true });
  }, [shop, navigate]);

  if (!shop) return null;

  const reviews = shop.reviews || [];
  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const saveReply = (id: string) => {
    const text = (drafts[id] || "").trim();
    if (!text) {
      toast.error("Reply cannot be empty");
      return;
    }
    const updatedReviews: MechanicReview[] = reviews.map((r) =>
      r.id === id
        ? { ...r, reply: text, replyDate: "Just now" }
        : r
    );
    const updated = { ...shop, reviews: updatedReviews };
    setMechanicShop(updated);
    setShop(updated);
    setDrafts((d) => ({ ...d, [id]: "" }));
    setEditing((e) => ({ ...e, [id]: false }));
    toast.success("Reply posted");
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background pb-safe">
      <header className="px-5 pt-safe pb-4 bg-card border-b border-border flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="touch-target">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <p className="text-body font-bold text-foreground">Reviews</p>
          <p className="text-caption text-muted-foreground">
            {reviews.length} customer{reviews.length === 1 ? "" : "s"} rated your shop
          </p>
        </div>
      </header>

      <div className="px-5 py-5 space-y-4">
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{avg.toFixed(1)}</p>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-3.5 h-3.5 ${
                    n <= Math.round(avg) ? "text-warning fill-warning" : "text-muted"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-body-sm font-semibold text-foreground">Overall rating</p>
            <p className="text-caption text-muted-foreground">
              Based on {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="p-8 rounded-2xl bg-card border border-border text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-body-sm font-semibold text-foreground">No reviews yet</p>
            <p className="text-caption text-muted-foreground">
              Customer reviews will appear here.
            </p>
          </div>
        ) : (
          reviews.map((r) => {
            const isEditing = editing[r.id] || !r.reply;
            return (
              <div key={r.id} className="p-4 rounded-2xl bg-card border border-border space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-body-sm font-bold text-foreground">{r.user}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-3 h-3 ${
                            n <= r.rating ? "text-warning fill-warning" : "text-muted"
                          }`}
                        />
                      ))}
                      <span className="text-caption text-muted-foreground ml-1">{r.date}</span>
                    </div>
                  </div>
                </div>
                <p className="text-body-sm text-foreground">{r.comment}</p>

                {r.reply && !isEditing && (
                  <div className="p-3 rounded-xl bg-secondary border-l-2 border-primary">
                    <div className="flex items-center justify-between">
                      <p className="text-caption font-semibold text-primary">
                        Your reply · {r.replyDate}
                      </p>
                      <button
                        onClick={() => {
                          setEditing((e) => ({ ...e, [r.id]: true }));
                          setDrafts((d) => ({ ...d, [r.id]: r.reply || "" }));
                        }}
                        className="text-caption text-muted-foreground flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    </div>
                    <p className="text-body-sm text-foreground mt-1">{r.reply}</p>
                  </div>
                )}

                {isEditing && (
                  <div className="space-y-2">
                    <textarea
                      value={drafts[r.id] ?? r.reply ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [r.id]: e.target.value }))
                      }
                      placeholder="Write a reply to this customer..."
                      rows={3}
                      className="w-full p-3 rounded-xl bg-secondary border border-border text-body-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => saveReply(r.id)}
                      className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-body-sm flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {r.reply ? "Update reply" : "Post reply"}
                    </motion.button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MechanicReviewsScreen;