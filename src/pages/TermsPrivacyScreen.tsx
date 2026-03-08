import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const TABS = ["Terms of Service", "Privacy Policy", "Refund Policy"] as const;

const TermsPrivacyScreen = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<typeof TABS[number]>("Terms of Service");

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center -ml-2">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-body font-bold text-foreground text-center">Legal</h1>
        <div className="w-[44px]" />
      </header>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 rounded-lg text-caption font-semibold whitespace-nowrap transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4">
        {tab === "Terms of Service" && <TermsContent />}
        {tab === "Privacy Policy" && <PrivacyContent />}
        {tab === "Refund Policy" && <RefundContent />}
        <p className="mt-8 text-caption text-muted-foreground text-center pb-4">Last updated: March 2026</p>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <h3 className="text-body-sm font-bold text-foreground mb-2">{title}</h3>
    <div className="text-caption text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </div>
);

const TermsContent = () => (
  <div>
    <Section title="1. Acceptance of Terms">
      <p>By downloading, installing, or using the Auto Doc application ("App"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the App.</p>
    </Section>
    <Section title="2. Description of Service">
      <p>Auto Doc is a parking discovery and booking platform that connects vehicle owners ("Consumers") with parking space providers ("Vendors"). We act as an intermediary and do not own or operate any parking facilities.</p>
    </Section>
    <Section title="3. User Accounts">
      <p>You must provide accurate, complete, and current information during registration. You are responsible for maintaining the confidentiality of your account credentials. One person may not maintain more than one account.</p>
    </Section>
    <Section title="4. Booking & Payments">
      <p>All bookings are subject to availability. Payments are processed securely through Razorpay. Prices displayed include applicable taxes unless stated otherwise. Auto Doc charges a platform convenience fee on each transaction.</p>
    </Section>
    <Section title="5. User Conduct">
      <p>You agree not to: (a) misuse the platform; (b) provide false vehicle information; (c) engage in fraudulent bookings; (d) attempt to circumvent payment systems; (e) harass other users or vendors.</p>
    </Section>
    <Section title="6. Vendor Obligations">
      <p>Vendors must ensure parking spaces are safe, accessible, and as described. Vendors must complete KYC verification and maintain valid documentation. Auto Doc reserves the right to delist non-compliant vendors.</p>
    </Section>
    <Section title="7. Liability Limitations">
      <p>Auto Doc is not liable for any damage, theft, or loss to vehicles while parked. Vehicle owners park at their own risk. We are not responsible for disputes between consumers and vendors beyond facilitating resolution.</p>
    </Section>
    <Section title="8. Termination">
      <p>We may suspend or terminate your account for violations of these terms, fraudulent activity, or at our sole discretion with reasonable notice.</p>
    </Section>
    <Section title="9. Governing Law">
      <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Chennai, Tamil Nadu.</p>
    </Section>
  </div>
);

const PrivacyContent = () => (
  <div>
    <Section title="1. Information We Collect">
      <p>We collect: (a) Personal info — name, phone number, email; (b) Vehicle info — registration number, type, model; (c) Location data — for nearby parking discovery; (d) Payment info — processed securely via Razorpay (we don't store card/UPI details); (e) Usage data — app interactions, booking history.</p>
    </Section>
    <Section title="2. How We Use Your Data">
      <p>To provide and improve our services, process bookings and payments, send booking confirmations and reminders, provide customer support, comply with legal obligations, and send promotional offers (with your consent).</p>
    </Section>
    <Section title="3. Data Sharing">
      <p>We share limited data with: (a) Parking vendors — your vehicle number and booking details; (b) Payment processors — Razorpay for transaction processing; (c) Legal authorities — when required by law. We do NOT sell your personal data to third parties.</p>
    </Section>
    <Section title="4. Data Security">
      <p>We implement industry-standard encryption (AES-256, TLS 1.3) and security measures. Data is stored on secure cloud infrastructure. Regular security audits are conducted.</p>
    </Section>
    <Section title="5. Your Rights">
      <p>You may request access to, correction of, or deletion of your personal data by contacting support@autodoc.in. We will respond within 30 days as per applicable data protection laws.</p>
    </Section>
    <Section title="6. Cookies & Analytics">
      <p>We use analytics to understand app usage patterns and improve the experience. No third-party advertising trackers are used.</p>
    </Section>
  </div>
);

const RefundContent = () => (
  <div>
    <Section title="1. Cancellation Policy">
      <p>Bookings cancelled 30+ minutes before start time: Full refund. Bookings cancelled within 30 minutes of start time: 50% refund. No-shows: No refund.</p>
    </Section>
    <Section title="2. Refund Processing">
      <p>Refunds are processed within 5–7 business days to the original payment method. UPI refunds may reflect within 24–48 hours.</p>
    </Section>
    <Section title="3. Disputes">
      <p>If a parking facility was unavailable or misrepresented, contact support within 24 hours for a full refund investigation. Provide your booking ID and any photographic evidence.</p>
    </Section>
    <Section title="4. Platform Fee">
      <p>The platform convenience fee is non-refundable except in cases where the service was completely unavailable due to our fault.</p>
    </Section>
  </div>
);

export default TermsPrivacyScreen;
