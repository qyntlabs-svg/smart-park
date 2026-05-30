import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Camera, Plus, X, Trash2 } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import {
  VEHICLE_CATEGORIES,
  VehicleCategory,
  MechanicService,
  getMechanicAuth,
  setMechanicAuth,
  setMechanicShop,
} from "@/lib/mechanic";
import { toast } from "sonner";

const MechanicSetupScreen = () => {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement | null>(null);

  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [services, setServices] = useState<MechanicService[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customCat, setCustomCat] = useState<VehicleCategory | "">("");

  const visibleCats = useMemo(
    () => VEHICLE_CATEGORIES.filter((c) => categories.includes(c.key)),
    [categories]
  );

  const toggleCat = (k: VehicleCategory) => {
    setCategories((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
    if (categories.includes(k)) setServices((p) => p.filter((s) => s.category !== k));
  };

  const toggleService = (cat: VehicleCategory, name: string) => {
    setServices((p) => {
      const existing = p.find((s) => s.category === cat && s.name === name);
      if (existing) return p.filter((s) => s !== existing);
      return [...p, { id: `${cat}-${name}-${Date.now()}`, category: cat, name, price: 0 }];
    });
  };

  const updatePrice = (id: string, price: number) => {
    setServices((p) => p.map((s) => (s.id === id ? { ...s, price } : s)));
  };

  const removeService = (id: string) => setServices((p) => p.filter((s) => s.id !== id));

  const addCustomService = () => {
    if (!customCat || !customName.trim() || !Number(customPrice)) {
      return toast.error("Fill category, service name and price");
    }
    setServices((p) => [
      ...p,
      {
        id: `custom-${Date.now()}`,
        category: customCat as VehicleCategory,
        name: customName.trim(),
        price: Number(customPrice),
        custom: true,
      },
    ]);
    setCustomName("");
    setCustomPrice("");
  };

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - photos.length;
    const arr = Array.from(files).slice(0, remaining);
    arr.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotos((p) => (p.length < 10 ? [...p, String(e.target?.result ?? "")] : p));
      };
      reader.readAsDataURL(f);
    });
  };

  const pinLocation = () => {
    // Mock — use a Chennai coordinate
    setLat(13.05 + Math.random() * 0.05);
    setLng(80.22 + Math.random() * 0.05);
    toast.success("Location pinned");
  };

  const handleSave = () => {
    const auth = getMechanicAuth();
    if (!auth) return navigate("/mechanic/login");
    if (!shopName.trim()) return toast.error("Enter shop name");
    if (!address.trim() || lat == null || lng == null) return toast.error("Pin your shop location");
    if (categories.length === 0) return toast.error("Select at least one vehicle category");
    if (services.length === 0) return toast.error("Add at least one service");
    if (services.some((s) => !s.price || s.price <= 0)) return toast.error("All services need a price");
    if (photos.length < 2) return toast.error("Upload at least 2 shop photos");

    setMechanicShop({
      id: auth.id,
      ownerName: auth.name,
      ownerPhone: auth.phone,
      shopName: shopName.trim(),
      address: address.trim(),
      lat: lat!,
      lng: lng!,
      categories,
      services,
      photos,
      rating: 0,
      reviewCount: 0,
      reviews: [],
      open: true,
    });
    setMechanicAuth({ ...auth, hasSetup: true });
    toast.success("Shop is live!");
    navigate("/mechanic/dashboard", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">Shop Setup</h1>
      </header>

      <div className="flex-1 px-5 py-5 space-y-6 overflow-y-auto scrollbar-hide">
        {/* Basic info */}
        <section>
          <h2 className="text-body font-bold text-foreground mb-3">Shop Details</h2>
          <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Shop name" className="h-12 rounded-xl" />
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="h-12 rounded-xl mt-3" />
          <button onClick={pinLocation} className="mt-3 w-full h-12 rounded-xl border border-dashed border-primary text-primary flex items-center justify-center gap-2 text-body-sm font-semibold">
            <MapPin className="w-4 h-4" />
            {lat != null ? `Pinned (${lat.toFixed(3)}, ${lng?.toFixed(3)})` : "Pin shop location"}
          </button>
        </section>

        {/* Categories */}
        <section>
          <h2 className="text-body font-bold text-foreground mb-3">Vehicle Categories</h2>
          <div className="grid grid-cols-2 gap-2">
            {VEHICLE_CATEGORIES.map((c) => {
              const active = categories.includes(c.key);
              return (
                <motion.button
                  key={c.key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleCat(c.key)}
                  className={`p-3 rounded-xl border text-left ${active ? "border-primary bg-primary/10" : "border-border bg-card"}`}
                >
                  <p className="text-xl">{c.emoji}</p>
                  <p className="text-body-sm font-semibold text-foreground mt-1">{c.label}</p>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Services per selected category */}
        {visibleCats.map((cat) => (
          <section key={cat.key}>
            <h2 className="text-body font-bold text-foreground mb-3">
              {cat.emoji} {cat.label} – Services
            </h2>
            <div className="space-y-2">
              {cat.services.map((name) => {
                const sel = services.find((s) => s.category === cat.key && s.name === name);
                return (
                  <div key={name} className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl">
                    <input
                      type="checkbox"
                      checked={!!sel}
                      onChange={() => toggleService(cat.key, name)}
                      className="w-5 h-5 accent-primary"
                    />
                    <span className="flex-1 text-body-sm text-foreground">{name}</span>
                    {sel && (
                      <div className="flex items-center gap-1">
                        <span className="text-caption text-muted-foreground">₹</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={sel.price || ""}
                          onChange={(e) => updatePrice(sel.id, Number(e.target.value))}
                          placeholder="Price"
                          className="w-20 h-9 rounded-lg border border-border px-2 text-body-sm text-right bg-background"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              {services.filter((s) => s.category === cat.key && s.custom).map((s) => (
                <div key={s.id} className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/30 rounded-xl">
                  <span className="flex-1 text-body-sm text-foreground">{s.name} <span className="text-caption text-primary">• custom</span></span>
                  <span className="text-body-sm font-semibold text-foreground">₹{s.price}</span>
                  <button onClick={() => removeService(s.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Custom service */}
        {categories.length > 0 && (
          <section>
            <h2 className="text-body font-bold text-foreground mb-3">Add Custom Service</h2>
            <div className="space-y-2">
              <select
                value={customCat}
                onChange={(e) => setCustomCat(e.target.value as VehicleCategory)}
                className="w-full h-12 rounded-xl border border-border px-3 text-body-sm bg-background"
              >
                <option value="">Select category…</option>
                {visibleCats.map((c) => (
                  <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                ))}
              </select>
              <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Service name" className="h-12 rounded-xl" />
              <Input type="number" inputMode="numeric" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="Price (₹)" className="h-12 rounded-xl" />
              <button onClick={addCustomService} className="w-full h-11 rounded-xl bg-secondary text-foreground text-body-sm font-semibold flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </section>
        )}

        {/* Photos */}
        <section>
          <h2 className="text-body font-bold text-foreground mb-3">
            Shop Photos ({photos.length} added · min 2)
          </h2>
          <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotos(e.target.files)} />
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
                <img src={p} alt={`Shop ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => setPhotos((arr) => arr.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {photos.length < 10 && (
              <button
                onClick={() => fileInput.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-1"
              >
                <Camera className="w-6 h-6" />
                <span className="text-caption">Add</span>
              </button>
            )}
          </div>
        </section>
      </div>

      <div className="px-6 pb-8 pb-safe pt-3 border-t border-border bg-card">
        <MobileButton fullWidth onClick={handleSave}>
          Save & Go Live
        </MobileButton>
      </div>
    </div>
  );
};

export default MechanicSetupScreen;