import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, LogOut } from "lucide-react";
import { getMechanicAuth, setMechanicAuth } from "@/lib/mechanic";

const MechanicPendingScreen = () => {
  const navigate = useNavigate();
  const auth = getMechanicAuth();

  useEffect(() => {
    if (!auth) navigate("/mechanic/login", { replace: true });
  }, [auth, navigate]);

  // Mock: auto-approve after a short delay so the demo flows end-to-end.
  useEffect(() => {
    if (!auth) return;
    if (auth.status === "approved") {
      navigate("/mechanic/setup", { replace: true });
      return;
    }
    const t = setTimeout(() => {
      setMechanicAuth({ ...auth, status: "approved" });
      navigate("/mechanic/setup", { replace: true });
    }, 3000);
    return () => clearTimeout(t);
  }, [auth, navigate]);

  const logout = () => {
    setMechanicAuth(null);
    navigate("/role-select", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 rounded-full bg-warning/10 flex items-center justify-center mb-6"
      >
        <Clock className="w-12 h-12 text-warning" />
      </motion.div>
      <h1 className="text-heading-lg text-foreground">Awaiting Approval</h1>
      <p className="mt-3 text-body-sm text-muted-foreground max-w-xs">
        Your KYC documents have been submitted. Our team will review them within 24–48 hours.
      </p>
      <div className="mt-8 w-full p-4 bg-card border border-border rounded-2xl text-left">
        <p className="text-body-sm font-bold text-foreground">What's next?</p>
        <ul className="mt-2 space-y-2 text-caption text-muted-foreground">
          <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-success shrink-0" /> Document verification</li>
          <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-success shrink-0" /> Identity check</li>
          <li className="flex gap-2"><Clock className="w-4 h-4 text-warning shrink-0" /> Approval (pending)</li>
        </ul>
      </div>
      <p className="mt-6 text-caption text-muted-foreground">
        Auto-approving for the demo… you'll be redirected shortly.
      </p>
      <button onClick={logout} className="mt-4 flex items-center gap-2 text-body-sm text-muted-foreground">
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </div>
  );
};

export default MechanicPendingScreen;