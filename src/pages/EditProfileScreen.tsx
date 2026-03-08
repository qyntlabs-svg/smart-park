import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Camera, User } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const EditProfileScreen = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("User");
  const [phone] = useState("+91 98765 43210");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Chennai");
  const [avatar, setAvatar] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please select an image under 5MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
    navigate(-1);
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center -ml-2">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-body font-bold text-foreground text-center">Edit Profile</h1>
        <div className="w-[44px]" />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Avatar */}
        <div className="flex flex-col items-center py-8">
          <div className="relative">
            <div className="w-[100px] h-[100px] rounded-full bg-primary/10 border-[3px] border-primary shadow-lg flex items-center justify-center overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-primary" />
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-md border-2 border-background"
            >
              <Camera className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 space-y-5"
        >
          <div className="space-y-2">
            <Label className="text-body-sm font-semibold text-foreground">Full Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="h-12 rounded-xl border-border bg-card"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-body-sm font-semibold text-foreground">Phone Number</Label>
            <Input
              value={phone}
              disabled
              className="h-12 rounded-xl border-border bg-muted text-muted-foreground"
            />
            <p className="text-caption text-muted-foreground">Phone number cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label className="text-body-sm font-semibold text-foreground">Email Address</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="h-12 rounded-xl border-border bg-card"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-body-sm font-semibold text-foreground">City</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Your city"
              className="h-12 rounded-xl border-border bg-card"
            />
          </div>
        </motion.div>
      </div>

      <div className="px-6 py-4 pb-safe bg-card border-t border-border">
        <MobileButton fullWidth onClick={handleSave}>
          Save Changes
        </MobileButton>
      </div>
    </div>
  );
};

export default EditProfileScreen;
