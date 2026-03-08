import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronDown, ChevronUp, Phone, Mail, MessageCircle, ExternalLink } from "lucide-react";

const FAQS = [
  { q: "How do I book a parking slot?", a: "Go to the Home screen, select a parking facility from the map or list view, choose an available slot, select your duration, and proceed to payment. You'll receive a QR code for entry." },
  { q: "How do I cancel a booking?", a: "Go to Booking History, tap on the active booking you want to cancel, and select 'Cancel Booking'. Cancellations made 30 minutes before the start time are eligible for a full refund." },
  { q: "What payment methods are accepted?", a: "We accept UPI (Google Pay, PhonePe, Paytm), debit/credit cards, and net banking through our secure Razorpay payment gateway." },
  { q: "How do I add or remove a vehicle?", a: "Navigate to My Vehicles from the side menu or Profile. Tap '+ Add Vehicle' to register a new one, or swipe left on an existing vehicle to remove it." },
  { q: "What if I overstay my parking duration?", a: "Overstay charges are calculated at 1.5x the hourly rate, billed in 15-minute increments. You'll receive a notification 15 minutes before your booking expires." },
  { q: "How do I become a vendor/parking partner?", a: "Select 'Vendor' during role selection, complete the registration form, submit KYC documents (Aadhaar, PAN, property proof), and wait for admin approval (usually 24–48 hours)." },
  { q: "Is my payment information secure?", a: "Yes. All payments are processed through Razorpay, a PCI-DSS Level 1 compliant payment gateway. We never store your card or UPI details on our servers." },
];

const HelpSupportScreen = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center -ml-2">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-body font-bold text-foreground text-center">Help & Support</h1>
        <div className="w-[44px]" />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-8">
        {/* Contact Options */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-body-sm font-bold text-foreground mb-3">Contact Us</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Phone, label: "Call Us", detail: "+91 44 2345 6789", href: "tel:+914423456789" },
              { icon: Mail, label: "Email", detail: "support@autodoc.in", href: "mailto:support@autodoc.in" },
              { icon: MessageCircle, label: "WhatsApp", detail: "+91 98765 43210", href: "https://wa.me/919876543210" },
            ].map(({ icon: Icon, label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-caption font-semibold text-foreground">{label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="px-4 mt-6">
          <h3 className="text-body-sm font-bold text-foreground mb-3">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <motion.div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-body-sm font-semibold text-foreground pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="px-4 pb-4"
                  >
                    <p className="text-caption text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Business Hours */}
        <div className="mx-4 mt-6 p-4 bg-card border border-border rounded-2xl">
          <h4 className="text-body-sm font-bold text-foreground">Business Hours</h4>
          <p className="mt-1 text-caption text-muted-foreground">Monday – Saturday: 9:00 AM – 8:00 PM</p>
          <p className="text-caption text-muted-foreground">Sunday: 10:00 AM – 5:00 PM</p>
          <p className="mt-2 text-caption text-muted-foreground">Average response time: <span className="font-semibold text-foreground">Under 2 hours</span></p>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportScreen;
