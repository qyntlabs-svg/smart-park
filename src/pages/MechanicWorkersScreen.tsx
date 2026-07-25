import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  UserPlus,
  Check,
  X,
  Pause,
  Play,
  Trash2,
  Share2,
  Copy,
  MessageCircle,
  FileText,
  Phone,
  LogIn,
  Wrench,
} from "lucide-react";
import {
  getMechanicAuth,
  getMechanicShop,
  getWorkersForShop,
  createWorkerInvite,
  updateWorker,
  pushNotification,
  addWorker,
  setWorkerAuth,
  type MechanicWorker,
} from "@/lib/mechanic";
import { toast } from "sonner";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const MechanicWorkersScreen = () => {
  const navigate = useNavigate();
  const auth = getMechanicAuth();
  const shop = getMechanicShop();
  const [tab, setTab] = useState<Tab>("pending");
  const [tick, setTick] = useState(0);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [docPreview, setDocPreview] = useState<{ title: string; url: string } | null>(null);

  useEffect(() => {
    if (!auth) return navigate("/mechanic/login", { replace: true });
    if (!shop) return navigate("/mechanic/setup", { replace: true });
  }, [auth, shop, navigate]);

  // Seed a couple of mock pending applicants the first time this shop has no workers.
  useEffect(() => {
    if (!shop) return;
    const existing = getWorkersForShop(shop.id);
    if (existing.length > 0) return;
    const mocks: MechanicWorker[] = [
      {
        id: `wk_seed_${shop.id}_1`,
        shopId: shop.id,
        shopName: shop.shopName,
        name: "Ravi Kumar",
        phone: "+91 98401 23456",
        aadhaarUrl: "https://images.unsplash.com/photo-1623674472827-bf6f1d22c8e3?w=600",
        panUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600",
        extraDocs: [],
        status: "pending",
        createdAt: new Date().toISOString(),
        lat: 12.93,
        lng: 80.13,
      },
      {
        id: `wk_seed_${shop.id}_2`,
        shopId: shop.id,
        shopName: shop.shopName,
        name: "Suresh Babu",
        phone: "+91 98402 11223",
        aadhaarUrl: "https://images.unsplash.com/photo-1623674472827-bf6f1d22c8e3?w=600",
        panUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600",
        extraDocs: [],
        status: "pending",
        createdAt: new Date().toISOString(),
        lat: 12.91,
        lng: 80.14,
      },
    ];
    mocks.forEach(addWorker);
    setTick((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]);

  const workers = useMemo(() => (shop ? getWorkersForShop(shop.id) : []), [shop, tick]);
  if (!shop) return null;

  const list = workers.filter((w) =>
    tab === "pending"
      ? w.status === "pending"
      : tab === "active"
        ? w.status === "approved"
        : w.status === "suspended" || w.status === "self_suspended" || w.status === "rejected",
  );

  const counts = {
    pending: workers.filter((w) => w.status === "pending").length,
    active: workers.filter((w) => w.status === "approved").length,
    suspended: workers.filter((w) =>
      ["suspended", "self_suspended", "rejected"].includes(w.status),
    ).length,
  };

  const generateInvite = () => {
    const inv = createWorkerInvite(shop.id, shop.shopName);
    const url = `${window.location.origin}${window.location.pathname}#/worker/register/${inv.token}`;
    setInviteUrl(url);
  };

  const registerSelfAsWorker = () => {
    if (!auth || !shop) return;
    const existingSelf = workers.find((w) => w.phone === auth.phone);
    if (existingSelf) {
      setWorkerAuth({ workerId: existingSelf.id });
      if (existingSelf.status === "approved") navigate("/worker/dashboard");
      else navigate("/worker/pending");
      return;
    }
    const w: MechanicWorker = {
      id: `wk_owner_${shop.id}`,
      shopId: shop.id,
      shopName: shop.shopName,
      name: auth.name,
      phone: auth.phone,
      extraDocs: [],
      status: "approved", // owner is auto-trusted in their own shop
      createdAt: new Date().toISOString(),
      lat: shop.lat,
      lng: shop.lng,
    };
    addWorker(w);
    setWorkerAuth({ workerId: w.id });
    toast.success("You're now also a worker — opening worker dashboard");
    navigate("/worker/dashboard");
  };

  const shareInvite = async (url: string) => {
    const text = `Join ${shop.shopName} on ParkDoc as a mechanic worker. Register here: ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Worker invite", text, url });
      } catch {/* user cancelled */}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  const whatsapp = (url: string) => {
    const text = `Join ${shop.shopName} on ParkDoc as a mechanic worker. Register here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const approve = (w: MechanicWorker) => {
    updateWorker(w.id, { status: "approved" });
    pushNotification({
      audience: "worker",
      audienceId: w.id,
      title: "You're approved",
      body: `${shop.shopName} approved you. You can start accepting jobs.`,
    });
    toast.success(`${w.name} approved`);
    setTick((t) => t + 1);
  };
  const reject = (w: MechanicWorker) => {
    updateWorker(w.id, { status: "rejected" });
    pushNotification({
      audience: "worker",
      audienceId: w.id,
      title: "Application rejected",
      body: `${shop.shopName} could not approve your registration.`,
    });
    toast.message(`${w.name} rejected`);
    setTick((t) => t + 1);
  };
  const suspend = (w: MechanicWorker) => {
    updateWorker(w.id, { status: "suspended" });
    pushNotification({
      audience: "worker",
      audienceId: w.id,
      title: "Suspended",
      body: `Owner suspended your account at ${shop.shopName}.`,
    });
    toast.message(`${w.name} suspended`);
    setTick((t) => t + 1);
  };
  const reinstate = (w: MechanicWorker) => {
    updateWorker(w.id, { status: "approved" });
    pushNotification({
      audience: "worker",
      audienceId: w.id,
      title: "Reinstated",
      body: `You're active again at ${shop.shopName}.`,
    });
    toast.success(`${w.name} reinstated`);
    setTick((t) => t + 1);
  };
  const remove = (w: MechanicWorker) => {
    if (!confirm(`Remove ${w.name} from the shop roster?`)) return;
    updateWorker(w.id, { status: "removed" });
    toast.message(`${w.name} removed`);
    setTick((t) => t + 1);
  };

  const viewAsWorker = (w: MechanicWorker) => {
    setWorkerAuth({ workerId: w.id });
    if (w.status === "approved") navigate("/worker/dashboard");
    else navigate("/worker/pending");
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate("/mechanic/dashboard")} className="touch-target">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">Workers</h1>
      </header>

      <div className="px-4 pt-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={generateInvite}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Invite Worker
        </motion.button>
        <button
          onClick={registerSelfAsWorker}
          className="w-full mt-2 h-11 rounded-xl bg-secondary text-foreground text-body-sm font-semibold flex items-center justify-center gap-2"
        >
          <Wrench className="w-4 h-4" /> Register myself as a worker
        </button>
        <p className="text-caption text-muted-foreground mt-1 text-center">
          Only workers can accept mobile mechanic jobs. Owners must register here to take dispatches.
        </p>
      </div>

      <div className="flex bg-secondary mx-4 mt-3 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-body-sm font-semibold ${
              tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span className="ml-1 text-caption text-primary">({counts[t.key]})</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {list.length === 0 && (
          <p className="text-center text-body-sm text-muted-foreground py-10">
            {tab === "pending" ? "No pending registrations." : tab === "active" ? "No active workers yet — invite someone above." : "No suspended workers."}
          </p>
        )}
        {list.map((w) => (
          <div key={w.id} className="p-4 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-foreground">
                {w.name?.[0]?.toUpperCase() || "W"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-bold text-foreground truncate">{w.name || "Unnamed"}</p>
                <p className="text-caption text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {w.phone}
                </p>
              </div>
              <span className="text-caption px-2 py-0.5 rounded-md bg-secondary text-muted-foreground capitalize">
                {w.status.replace("_", " ")}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {w.aadhaarUrl && (
                <button
                  onClick={() => setDocPreview({ title: "Aadhaar", url: w.aadhaarUrl! })}
                  className="text-caption font-semibold text-primary flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" /> Aadhaar
                </button>
              )}
              {w.panUrl && (
                <button
                  onClick={() => setDocPreview({ title: "PAN", url: w.panUrl! })}
                  className="text-caption font-semibold text-primary flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" /> PAN
                </button>
              )}
              {(w.extraDocs || []).map((d, i) => (
                <button
                  key={i}
                  onClick={() => setDocPreview({ title: `Document ${i + 1}`, url: d })}
                  className="text-caption font-semibold text-primary flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" /> Doc {i + 1}
                </button>
              ))}
            </div>

            {w.status === "pending" && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => reject(w)} className="h-10 rounded-xl bg-destructive/10 text-destructive font-semibold text-body-sm flex items-center justify-center gap-1">
                  <X className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => approve(w)} className="h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-body-sm flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" /> Approve
                </button>
              </div>
            )}

            {w.status === "approved" && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => suspend(w)} className="h-10 rounded-xl bg-warning/10 text-warning font-semibold text-body-sm flex items-center justify-center gap-1">
                  <Pause className="w-4 h-4" /> Suspend
                </button>
                <button onClick={() => remove(w)} className="h-10 rounded-xl bg-destructive/10 text-destructive font-semibold text-body-sm flex items-center justify-center gap-1">
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            )}

            {(w.status === "suspended" || w.status === "self_suspended") && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => reinstate(w)} className="h-10 rounded-xl bg-success/10 text-success font-semibold text-body-sm flex items-center justify-center gap-1">
                  <Play className="w-4 h-4" /> Reinstate
                </button>
                <button onClick={() => remove(w)} className="h-10 rounded-xl bg-destructive/10 text-destructive font-semibold text-body-sm flex items-center justify-center gap-1">
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            )}

            <button
              onClick={() => viewAsWorker(w)}
              className="w-full h-9 rounded-lg bg-secondary text-foreground text-caption font-semibold flex items-center justify-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5" /> View as {w.name?.split(" ")[0] || "worker"}
            </button>
          </div>
        ))}
      </div>

      {/* Invite modal */}
      {inviteUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setInviteUrl(null)}>
          <div className="w-full max-w-md bg-card rounded-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-body font-bold text-foreground">Invite a worker</p>
            <p className="text-caption text-muted-foreground">Share this unique link. It expires in 72 hours.</p>
            <div className="p-3 rounded-xl bg-secondary text-caption font-mono break-all text-foreground">
              {inviteUrl}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success("Copied"); }}
                className="h-11 rounded-xl bg-secondary text-foreground font-semibold text-caption flex items-center justify-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button
                onClick={() => whatsapp(inviteUrl)}
                className="h-11 rounded-xl bg-success/10 text-success font-semibold text-caption flex items-center justify-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button
                onClick={() => shareInvite(inviteUrl)}
                className="h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-caption flex items-center justify-center gap-1"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>
            <button onClick={() => setInviteUrl(null)} className="w-full h-10 text-body-sm text-muted-foreground">Close</button>
          </div>
        </div>
      )}

      {docPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setDocPreview(null)}>
          <div className="w-full max-w-md bg-card rounded-3xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-body font-bold text-foreground">{docPreview.title}</p>
            {docPreview.url.startsWith("data:image") || /\.(png|jpe?g|webp|gif)$/i.test(docPreview.url) ? (
              <img src={docPreview.url} alt={docPreview.title} className="w-full rounded-xl" />
            ) : (
              <a href={docPreview.url} target="_blank" rel="noreferrer" className="text-primary text-body-sm">
                Open file in new tab
              </a>
            )}
            <button onClick={() => setDocPreview(null)} className="w-full h-10 text-body-sm text-muted-foreground">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MechanicWorkersScreen;