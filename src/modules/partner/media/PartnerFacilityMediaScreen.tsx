// Screen: V-24 · Primitives: Provider
// Route: /partner/facility-media

import { useState } from "react";
import {
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Star,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import PartnerScreenLayout from "@/modules/partner/components/PartnerScreenLayout";
import { useAuthStore } from "@/store/auth.store";
import {
  useAddPhoto,
  useFacilityMedia,
  useRemovePhoto,
  useSetAmenities,
  useSetCoverPhoto,
} from "./hooks";
import { AMENITY_CATALOG } from "./types";

const STOCK_PHOTOS = [
  "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800",
  "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800",
  "https://images.unsplash.com/photo-1611192471414-8c02f2c4bf68?w=800",
  "https://images.unsplash.com/photo-1568008032037-72f2fd5db69a?w=800",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
];

const PartnerFacilityMediaScreen = () => {
  const partnerId = useAuthStore((s) => s.user?.id ?? "partner-demo");
  const { data: facilities = [], isLoading, isError } = useFacilityMedia(partnerId);
  const addPhoto = useAddPhoto();
  const removePhoto = useRemovePhoto();
  const setCover = useSetCoverPhoto();
  const setAmen = useSetAmenities();

  const [activeFacilityId, setActiveFacilityId] = useState<string | null>(null);
  const active =
    facilities.find((f) => f.facilityId === activeFacilityId) ?? facilities[0];

  const handleAdd = async () => {
    if (!active) return;
    const url = STOCK_PHOTOS[Math.floor(Math.random() * STOCK_PHOTOS.length)];
    await addPhoto.mutateAsync({
      partnerId,
      facilityId: active.facilityId,
      url,
    });
    toast.success("Photo added");
  };

  const handleRemove = async (photoId: string) => {
    if (!active) return;
    if (!window.confirm("Remove this photo?")) return;
    await removePhoto.mutateAsync({
      partnerId,
      facilityId: active.facilityId,
      photoId,
    });
  };

  const handleCover = async (photoId: string) => {
    if (!active) return;
    await setCover.mutateAsync({
      partnerId,
      facilityId: active.facilityId,
      photoId,
    });
    toast.success("Cover updated");
  };

  const toggleAmenity = async (slug: string) => {
    if (!active) return;
    const has = active.amenities.includes(slug);
    const next = has
      ? active.amenities.filter((a) => a !== slug)
      : [...active.amenities, slug];
    await setAmen.mutateAsync({
      partnerId,
      facilityId: active.facilityId,
      amenities: next,
    });
  };

  return (
    <PartnerScreenLayout title="Photos & Amenities" icon={ImageIcon}>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-center text-body-sm text-destructive py-8">
          Couldn't load facility media
        </p>
      ) : facilities.length === 0 ? (
        <div className="flex flex-col items-center py-14 gap-2 text-center">
          <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-body-sm text-muted-foreground">
            No facilities to manage
          </p>
        </div>
      ) : (
        <>
          {/* Facility tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {facilities.map((f) => (
              <button
                key={f.facilityId}
                onClick={() => setActiveFacilityId(f.facilityId)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-caption font-semibold border ${
                  (activeFacilityId ?? facilities[0].facilityId) === f.facilityId
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                {f.facilityName}
              </button>
            ))}
          </div>

          {active && (
            <>
              {/* Photo grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
                    Photos ({active.photos.length})
                  </p>
                  <button
                    onClick={handleAdd}
                    disabled={addPhoto.isPending}
                    className="text-caption font-semibold text-primary flex items-center gap-1 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add photo
                  </button>
                </div>
                {active.photos.length === 0 ? (
                  <button
                    onClick={handleAdd}
                    disabled={addPhoto.isPending}
                    className="w-full h-40 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground active:bg-secondary"
                  >
                    <Plus className="w-6 h-6" />
                    <p className="text-caption font-semibold">
                      Tap to add your first photo
                    </p>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {active.photos.map((p) => (
                      <div
                        key={p.id}
                        className="relative rounded-2xl overflow-hidden border border-border aspect-square bg-secondary"
                      >
                        <img
                          src={p.url}
                          alt={p.caption ?? "Facility photo"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {p.isCover && (
                          <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                            COVER
                          </span>
                        )}
                        <div className="absolute bottom-2 right-2 flex gap-1">
                          {!p.isCover && (
                            <button
                              onClick={() => handleCover(p.id)}
                              className="w-8 h-8 rounded-lg bg-black/50 text-white flex items-center justify-center"
                              aria-label="Set as cover"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemove(p.id)}
                            className="w-8 h-8 rounded-lg bg-black/50 text-white flex items-center justify-center"
                            aria-label="Delete photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amenities */}
              <div>
                <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Amenities
                </p>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_CATALOG.map((a) => {
                    const on = active.amenities.includes(a.slug);
                    return (
                      <button
                        key={a.slug}
                        onClick={() => toggleAmenity(a.slug)}
                        className={`px-3 py-2 rounded-xl border text-body-sm font-semibold flex items-center gap-1.5 ${
                          on
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-card border-border text-foreground"
                        }`}
                      >
                        <span>{a.emoji}</span>
                        {a.label}
                        {on && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <MobileButton
                fullWidth
                onClick={() => toast.success("Listing saved")}
              >
                Publish changes
              </MobileButton>
            </>
          )}
        </>
      )}
    </PartnerScreenLayout>
  );
};

export default PartnerFacilityMediaScreen;
