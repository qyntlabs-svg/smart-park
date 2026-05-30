import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Camera, User, Loader2 } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useProfile, useUpdateProfile } from "@/api/user";
import api from "@/lib/axios";

const EditProfileScreen = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Populate form once profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setEmail(profile.email ?? "");
      setCity(profile.city ?? "");
      setAvatarPreview(profile.avatar_url ?? null);
    }
  }, [profile]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Please select an image under 5MB.");
      return;
    }
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to backend
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      await api.post("/user/profile/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Photo updated");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        city: city.trim() || undefined,
      });
      toast.success("Profile updated");
      navigate(-1);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message || "Failed to save profile",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center -ml-2"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-body font-bold text-foreground text-center">
          Edit Profile
        </h1>
        <div className="w-[44px]" />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Avatar */}
        <div className="flex flex-col items-center py-8">
          <div className="relative">
            <div className="w-[100px] h-[100px] rounded-full bg-primary/10 border-[3px] border-primary shadow-lg flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-primary" />
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-md border-2 border-background"
            >
              <Camera className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 space-y-5"
        >
          <div className="space-y-2">
            <Label className="text-body-sm font-semibold text-foreground">
              Full Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-body-sm font-semibold text-foreground">
              Phone Number
            </Label>
            <Input
              value={profile?.phone ?? ""}
              disabled
              className="h-12 rounded-xl bg-muted text-muted-foreground"
            />
            <p className="text-caption text-muted-foreground">
              Phone number cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-body-sm font-semibold text-foreground">
              Email Address
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-body-sm font-semibold text-foreground">
              City
            </Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Your city"
              className="h-12 rounded-xl"
            />
          </div>
        </motion.div>
      </div>

      <div className="px-6 py-4 pb-safe bg-card border-t border-border">
        <MobileButton
          fullWidth
          loading={updateProfile.isPending}
          onClick={handleSave}
        >
          Save Changes
        </MobileButton>
      </div>
    </div>
  );
};

export default EditProfileScreen;
