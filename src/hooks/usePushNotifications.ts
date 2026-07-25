import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

// ── Native (Android/iOS via Capacitor Push Notifications) ────────────────────
const setupNativePush = async () => {
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // Attach listeners BEFORE calling register() so the registration event isn't missed
    await PushNotifications.addListener("registration", async (token) => {
      try {
        await api.post("/device/register", { fcm_token: token.value });
      } catch (err) {
        console.warn("FCM token registration failed:", err);
      }
    });

    await PushNotifications.addListener("registrationError", (err) => {
      console.warn("FCM registration error:", err);
    });

    // Show foreground notifications as toast
    await PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        const title = notification.title ?? "SmartPark";
        const body = notification.body ?? "";
        toast(title, { description: body });
      },
    );

    // Handle notification tap — navigate based on type
    await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        const data = action.notification.data as
          | Record<string, string>
          | undefined;
        if (!data?.type) return;
        handleNotificationNavigation(data.type, data);
      },
    );

    // Request permission then register
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== "granted") {
      console.warn("Push notification permission denied");
      return;
    }

    await PushNotifications.register();
  } catch (err) {
    console.warn("Native push setup failed:", err);
  }
};

// ── Web (Firebase Messaging via service worker) ───────────────────────────────
const setupWebPush = async () => {
  try {
    const { getMessagingInstance, getToken, onMessage } =
      await import("@/lib/firebase");
    const messaging = await getMessagingInstance();
    if (!messaging) return;

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("VITE_FIREBASE_VAPID_KEY not set — web push disabled");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    if (token) {
      await api.post("/device/register", { fcm_token: token });
    }

    // Foreground message handler
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "SmartPark";
      const body = payload.notification?.body ?? "";
      toast(title, { description: body });

      const data = payload.data as Record<string, string> | undefined;
      if (data?.type) handleNotificationNavigation(data.type, data);
    });
  } catch (err) {
    console.warn("Web push setup failed:", err);
  }
};

const handleNotificationNavigation = (
  type: string,
  data: Record<string, string>,
) => {
  // Use hash-based navigation (app uses HashRouter)
  const bookingId = data.booking_id;
  switch (type) {
    case "BOOKING_CONFIRMED":
    case "BOOKING_CANCELLED":
    case "VEHICLE_ENTRY":
    case "VEHICLE_EXIT":
    case "VEHICLE_EXIT_UNPAID":
    case "OVERSTAY":
      if (bookingId) {
        window.location.hash = `/bookings/${bookingId}`;
      }
      break;
    default:
      window.location.hash = "/notifications";
  }
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const usePushNotifications = () => {
  const user = useAuthStore((s) => s.user);
  const initialized = useRef(false);

  useEffect(() => {
    if (!user?.id || initialized.current) return;
    initialized.current = true;

    if (Capacitor.isNativePlatform()) {
      setupNativePush();
    } else {
      setupWebPush();
    }
  }, [user?.id]);
};
