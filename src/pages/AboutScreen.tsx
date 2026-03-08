import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Car, Shield, MapPin, Heart, Users, Zap, ExternalLink } from "lucide-react";
import logo from "@/assets/logo.jpg";

const AboutScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center -ml-2">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-body font-bold text-foreground text-center">About</h1>
        <div className="w-[44px]" />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-8">
        {/* Logo & Version */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center pt-8 pb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/20">
            <img src={logo} alt="Auto Doc" className="w-full h-full object-cover" />
          </div>
          <h2 className="mt-4 text-heading-md text-foreground">Auto Doc</h2>
          <p className="text-body-sm text-muted-foreground">Version 1.0.0</p>
          <p className="mt-1 text-caption text-primary font-semibold">Your Smart Parking Companion</p>
        </motion.div>

        {/* Mission */}
        <div className="mx-4 p-5 bg-card border border-border rounded-2xl">
          <h3 className="text-body-sm font-bold text-foreground mb-2">Our Mission</h3>
          <p className="text-caption text-muted-foreground leading-relaxed">
            Auto Doc is on a mission to eliminate the daily struggle of finding parking in Indian cities. We connect vehicle owners with verified parking spaces in real-time, making urban commuting stress-free and efficient.
          </p>
        </div>

        {/* Features */}
        <div className="px-4 mt-5">
          <h3 className="text-body-sm font-bold text-foreground mb-3">What We Offer</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: MapPin, title: "Real-time Discovery", desc: "Find parking near you instantly" },
              { icon: Shield, title: "Verified Spaces", desc: "KYC-verified parking vendors" },
              { icon: Zap, title: "Quick Booking", desc: "Book in under 30 seconds" },
              { icon: Users, title: "Vendor Platform", desc: "Earn from your parking space" },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="p-4 bg-card border border-border rounded-xl"
              >
                <Icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-caption font-bold text-foreground">{title}</p>
                <p className="text-caption text-muted-foreground mt-0.5">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Company Info */}
        <div className="mx-4 mt-5 p-5 bg-card border border-border rounded-2xl space-y-3">
          <h3 className="text-body-sm font-bold text-foreground">Company Details</h3>
          <div className="space-y-2 text-caption text-muted-foreground">
            <p><span className="font-semibold text-foreground">Registered Name:</span> Auto Doc Technologies Pvt. Ltd.</p>
            <p><span className="font-semibold text-foreground">CIN:</span> U74999TN2025PTC123456</p>
            <p><span className="font-semibold text-foreground">GSTIN:</span> 33AAXCA1234B1Z5</p>
            <p><span className="font-semibold text-foreground">Registered Office:</span> 42, Anna Salai, Guindy, Chennai – 600032, Tamil Nadu, India</p>
            <p><span className="font-semibold text-foreground">Email:</span> contact@autodoc.in</p>
            <p><span className="font-semibold text-foreground">Phone:</span> +91 44 2345 6789</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center pt-8 pb-4">
          <p className="text-caption text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-destructive fill-destructive" /> in India
          </p>
          <p className="text-caption text-muted-foreground mt-1">© 2025–2026 Auto Doc Technologies Pvt. Ltd.</p>
        </div>
      </div>
    </div>
  );
};

export default AboutScreen;
