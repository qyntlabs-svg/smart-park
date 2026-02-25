import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Phone } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";

const VendorLoginScreen = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");

  const handleLogin = () => {
    localStorage.setItem("vendorLoggedIn", "true");
    navigate("/vendor/dashboard", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe">
        <button onClick={() => navigate("/role-select")} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      </header>

      <div className="flex-1 px-6 pt-8">
        <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6">
          <img src={logo} alt="Auto Doc logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-heading-lg text-foreground">Vendor Login</h1>
        <p className="mt-2 text-body-sm text-muted-foreground">Sign in to manage your parking facility</p>

        <div className="mt-8 space-y-4">
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="tel"
              placeholder="Mobile number or Email"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-12 h-14 rounded-xl text-body"
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pb-safe space-y-3">
        <MobileButton fullWidth onClick={handleLogin} disabled={phone.length < 5}>
          Continue
        </MobileButton>
        <button
          onClick={() => navigate("/vendor/register")}
          className="w-full text-center text-body-sm text-primary font-semibold py-2"
        >
          New vendor? Register here →
        </button>
      </div>
    </div>
  );
};

export default VendorLoginScreen;
