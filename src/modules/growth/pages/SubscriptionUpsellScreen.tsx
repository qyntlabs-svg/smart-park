// Screen: G-05 · Primitives: Pricing, Payment
// Route: /growth/subscribe  (mobile-first fallback destination for the modal)
//
// Full-screen version of the SubscriptionUpsellModal — used when the CTA
// links from an email / push notification and the user lands on a route.

import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SubscriptionUpsellModal from "../components/SubscriptionUpsellModal";

const SubscriptionUpsellScreen = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="h-[56px] flex items-center px-4 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="ml-2 text-body font-bold">EV Membership</span>
      </header>
      <div className="flex-1 flex items-center justify-center p-6 text-center text-[13px] text-muted-foreground">
        Loading membership picker…
      </div>
      {/* Modal renders on top of this fallback text and self-closes. */}
      <SubscriptionUpsellModal
        forceOpen
        onDismiss={() => navigate(-1)}
        onUpgrade={(plan) => {
          navigate(`/ev/subscription?plan=${plan}`, { replace: true });
        }}
      />
    </div>
  );
};

export default SubscriptionUpsellScreen;
