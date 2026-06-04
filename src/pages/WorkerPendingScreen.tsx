import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hourglass, CheckCircle2, XCircle } from "lucide-react";
import { getWorkerAuth, getWorkerById, setWorkerAuth } from "@/lib/mechanic";
import { MobileButton } from "@/components/ui/mobile-button";

const WorkerPendingScreen = () => {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const auth = getWorkerAuth();
  const worker = auth ? getWorkerById(auth.workerId) : null;

  useEffect(() => {
    if (!auth || !worker) return navigate("/", { replace: true });
    if (worker.status === "approved") return navigate("/worker/dashboard", { replace: true });
  }, [auth, worker, navigate, tick]);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(i);
  }, []);

  if (!worker) return null;

  if (worker.status === "rejected") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 max-w-md mx-auto text-center">
        <div className="space-y-4">
          <XCircle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-body font-bold">Application rejected</p>
          <p className="text-body-sm text-muted-foreground">{worker.shopName} could not approve you. Contact the shop owner for details.</p>
          <MobileButton fullWidth onClick={() => { setWorkerAuth(null); navigate("/", { replace: true }); }}>Close</MobileButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6 max-w-md mx-auto text-center">
      <div className="space-y-4">
        <Hourglass className="w-12 h-12 text-warning mx-auto animate-pulse" />
        <p className="text-body font-bold">Awaiting approval</p>
        <p className="text-body-sm text-muted-foreground">
          {worker.shopName} will review your registration. You'll be redirected to your dashboard once approved.
        </p>
        <p className="text-caption text-muted-foreground flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-success" /> Documents submitted
        </p>
      </div>
    </div>
  );
};

export default WorkerPendingScreen;