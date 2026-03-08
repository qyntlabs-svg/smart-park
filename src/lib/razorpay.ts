// Razorpay Frontend Service
// This service handles loading the Razorpay SDK and initiating payments.
// Once Cloud is enabled, order creation and verification will be done via edge functions.

export const RAZORPAY_KEY_ID = ""; // Will be set after Cloud is enabled — this is a publishable key

type RazorpayPaymentOptions = {
  amount: number; // in paise (₹40 = 4000)
  currency?: string;
  orderId?: string; // from backend order creation
  bookingId: string;
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onFailure: (error: unknown) => void;
};

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

/** Load Razorpay checkout script */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/** Open Razorpay Checkout */
export const initiateRazorpayPayment = async (options: RazorpayPaymentOptions) => {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    options.onFailure(new Error("Failed to load Razorpay SDK"));
    return;
  }

  const rzp = new (window as any).Razorpay({
    key: RAZORPAY_KEY_ID,
    amount: options.amount,
    currency: options.currency || "INR",
    name: "ParkIt",
    description: options.description,
    order_id: options.orderId, // Will come from backend once Cloud is enabled
    prefill: {
      name: options.customerName || "",
      email: options.customerEmail || "",
      contact: options.customerPhone || "",
    },
    notes: {
      booking_id: options.bookingId,
    },
    theme: {
      color: "#F97316", // primary orange
    },
    handler: (response: RazorpaySuccessResponse) => {
      options.onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        options.onFailure(new Error("Payment cancelled by user"));
      },
    },
  });

  rzp.on("payment.failed", (response: any) => {
    options.onFailure(response.error);
  });

  rzp.open();
};

/** 
 * Mock payment for development (simulates Razorpay flow)
 * Remove this once real Razorpay key is configured
 */
export const mockRazorpayPayment = (
  options: RazorpayPaymentOptions
): Promise<RazorpaySuccessResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_order_id: `order_mock_${Date.now()}`,
        razorpay_signature: `sig_mock_${Date.now()}`,
      });
    }, 2000);
  });
};

/**
 * Commission calculation utility
 * Platform takes a commission, rest goes to vendor
 */
export const calculateCommission = (amount: number, commissionPercent: number = 10) => {
  const commission = Math.round((amount * commissionPercent) / 100);
  const vendorShare = amount - commission;
  return { total: amount, commission, vendorShare, commissionPercent };
};
