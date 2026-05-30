import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Wrench } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { setMechanicAuth } from "@/lib/mechanic";
import { toast } from "sonner";

const MechanicRegisterScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialPhone = (location.state as any)?.phone ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(initialPhone);

  const valid = name.trim().length >= 2 && /^\d{10}$/.test(phone) && /\S+@\S+\.\S+/.test(email);

  const handleSubmit = () => {
    if (!valid) return toast.error("Please fill all fields correctly");
    setMechanicAuth({
      id: `mech_${Date.now()}`,
      name: name.trim(),
      phone,
      email: email.trim(),
      status: "registered",
      hasSetup: false,
    });
    toast.success("Account created. Complete KYC to continue.");
    navigate("/mechanic/kyc", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe">
        <button onClick={() => navigate("/mechanic/login")} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      </header>
      <div className="flex-1 px-6 pt-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Wrench className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-heading-lg text-foreground">Mechanic Registration</h1>
        <p className="mt-2 text-body-sm text-muted-foreground">Tell us about yourself</p>

        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 rounded-full">
          <div className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-caption font-semibold text-warning">Account locked until KYC approval</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
          <div>
            <label className="text-body-sm font-semibold text-foreground">Your Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="mt-2 h-14 rounded-xl" />
          </div>
          <div>
            <label className="text-body-sm font-semibold text-foreground">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-2 h-14 rounded-xl" />
          </div>
          <div>
            <label className="text-body-sm font-semibold text-foreground">Mobile Number</label>
            <Input type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="98765 43210" className="mt-2 h-14 rounded-xl" />
          </div>
        </motion.div>
      </div>
      <div className="px-6 pb-8 pb-safe">
        <MobileButton fullWidth onClick={handleSubmit} disabled={!valid}>
          Continue to KYC
        </MobileButton>
      </div>
    </div>
  );
};

export default MechanicRegisterScreen;