// Screen: C-54 · Primitives: Notification, Identity
//
// Per-channel × per-topic matrix (push / email / sms × charging / parking /
// promotions / etc). Trust + retention surface.
//
// Route: /notifications/preferences

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Mail,
  MessageSquare,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  useNotifPreferences,
  useResetNotifPreferences,
  useSetNotifPreference,
} from "@/modules/consumer/preferences/hooks";
import {
  NOTIF_CHANNEL_LABEL,
  NOTIF_TOPIC_LABEL,
  type NotifChannel,
  type NotifTopic,
} from "@/modules/consumer/preferences/types";

const CHANNELS: NotifChannel[] = ["push", "email", "sms"];
const TOPICS: NotifTopic[] = ["charging", "parking", "sos", "billing", "family", "promotions"];

const CHANNEL_ICON: Record<NotifChannel, React.ComponentType<{ className?: string }>> = {
  push: Bell,
  email: Mail,
  sms: MessageSquare,
};

const NotificationPreferencesScreen = () => {
  const navigate = useNavigate();
  const { data: matrix, isLoading, isError, refetch } = useNotifPreferences();
  const set = useSetNotifPreference();
  const reset = useResetNotifPreferences();

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-16">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Notifications
        </h1>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError || !matrix ? (
        <div className="mx-4 mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-body-sm font-semibold text-destructive">
            Couldn't load preferences
          </p>
          <MobileButton
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => refetch()}
          >
            Retry
          </MobileButton>
        </div>
      ) : (
        <>
          {/* Column header (channels) */}
          <div className="mx-4 mt-4 rounded-2xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-[1fr_44px_44px_44px] items-center px-3 py-2 border-b border-border bg-secondary">
              <span className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
                Topic
              </span>
              {CHANNELS.map((c) => {
                const Icon = CHANNEL_ICON[c];
                return (
                  <div
                    key={c}
                    className="flex flex-col items-center justify-center"
                  >
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      {NOTIF_CHANNEL_LABEL[c]}
                    </span>
                  </div>
                );
              })}
            </div>

            {TOPICS.map((t, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[1fr_44px_44px_44px] items-center px-3 py-3 border-b border-border last:border-0"
              >
                <span className="text-body-sm font-semibold text-foreground truncate pr-2">
                  {NOTIF_TOPIC_LABEL[t]}
                </span>
                {CHANNELS.map((c) => (
                  <div
                    key={c}
                    className="flex items-center justify-center"
                  >
                    <Switch
                      checked={matrix[t][c]}
                      onCheckedChange={(v) =>
                        set.mutate({ topic: t, channel: c, enabled: v })
                      }
                    />
                  </div>
                ))}
              </motion.div>
            ))}
          </div>

          {/* Reset */}
          <div className="mx-4 mt-6">
            <MobileButton
              variant="outline"
              fullWidth
              className="gap-1.5"
              onClick={async () => {
                await reset.mutateAsync();
                toast.success("Reset to defaults");
              }}
              loading={reset.isPending}
            >
              <RotateCcw className="w-4 h-4" />
              Reset to defaults
            </MobileButton>
          </div>

          {/* Explainer */}
          <div className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4">
            <p className="text-body-sm font-bold text-foreground">
              A note on urgent alerts
            </p>
            <p className="text-caption text-muted-foreground mt-1 leading-relaxed">
              SOS and safety-critical alerts (session tampered, charger offline
              during your session) are always delivered via push, regardless of
              this setting.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationPreferencesScreen;
