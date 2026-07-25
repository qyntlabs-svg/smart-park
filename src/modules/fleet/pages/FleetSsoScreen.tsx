// Screen: F-12 · Primitives: Identity
// Fleet SSO Setup — SAML / OIDC configuration form (mock).

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Upload } from "lucide-react";
import {
  FleetLayout,
  FleetLoading,
  FleetPageBody,
  FleetSection,
} from "@/modules/fleet/components/FleetLayout";
import { useFleetSso, useUpdateFleetSso } from "@/modules/fleet/hooks";
import type { FleetSsoConfig } from "@/modules/fleet/types";
import { cn } from "@/lib/utils";

const FleetSsoScreen = () => {
  const sso = useFleetSso();
  const update = useUpdateFleetSso();

  const [local, setLocal] = useState<FleetSsoConfig | null>(null);
  useEffect(() => {
    if (sso.data && !local) setLocal(sso.data);
  }, [sso.data, local]);

  if (sso.isLoading || !local)
    return (
      <FleetLayout title="SSO setup" screenId="F-12" primitives={["Identity"]}>
        <FleetLoading />
      </FleetLayout>
    );

  const set = <K extends keyof FleetSsoConfig>(k: K, v: FleetSsoConfig[K]) =>
    setLocal((prev) => (prev ? { ...prev, [k]: v } : prev));

  const save = async () => {
    if (!local) return;
    await update.mutateAsync(local);
    toast.success("SSO config saved");
  };

  const verify = async () => {
    if (!local) return;
    await update.mutateAsync({ ...local, status: "verified" });
    toast.success("Metadata verified with IdP");
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <FleetLayout
      title="Single sign-on"
      screenId="F-12"
      primitives={["Identity"]}
      actions={
        <div className="flex gap-2">
          <button
            onClick={verify}
            className="h-8 px-3 rounded-md border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Verify with IdP
          </button>
          <button
            onClick={save}
            className="h-8 px-3 rounded-md bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700"
          >
            Save config
          </button>
        </div>
      }
    >
      <FleetPageBody>
        <FleetSection
          title="Identity provider"
          subtitle="Fleet OS supports SAML 2.0 and OIDC. Pick one."
          right={
            <span
              className={cn(
                "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                local.status === "verified"
                  ? "bg-emerald-50 text-emerald-700"
                  : local.status === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700",
              )}
            >
              {local.status}
            </span>
          }
        >
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              <Field label="Protocol">
                <div className="flex gap-1.5">
                  {(["saml", "oidc"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => set("protocol", p)}
                      className={cn(
                        "h-9 px-3 rounded-md text-[12px] font-semibold border",
                        local.protocol === p
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700 border-slate-200",
                      )}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Issuer URL">
                <input
                  className="input"
                  value={local.issuer}
                  onChange={(e) => set("issuer", e.target.value)}
                />
              </Field>
              {local.protocol === "saml" && (
                <Field label="Entity ID">
                  <input
                    className="input"
                    value={local.entityId ?? ""}
                    onChange={(e) => set("entityId", e.target.value)}
                  />
                </Field>
              )}
              <Field label="SSO URL">
                <input
                  className="input"
                  value={local.ssoUrl}
                  onChange={(e) => set("ssoUrl", e.target.value)}
                />
              </Field>
              <Field label="Audience">
                <input
                  className="input"
                  value={local.audience}
                  onChange={(e) => set("audience", e.target.value)}
                />
              </Field>
              <Field label="X.509 certificate fingerprint (SHA-1)">
                <div className="flex gap-2">
                  <input
                    className="input font-mono"
                    value={local.certificateFingerprint}
                    onChange={(e) => set("certificateFingerprint", e.target.value)}
                  />
                  <button
                    className="inline-flex items-center gap-1 h-9 px-3 rounded-md border border-slate-200 text-[12px] font-semibold text-slate-700"
                    onClick={() => toast.success("Certificate uploaded (mock)")}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload
                  </button>
                </div>
              </Field>
            </div>

            <div className="space-y-3">
              <Field label="ACS URL (send this to your IdP)">
                <div className="flex gap-2">
                  <input
                    className="input font-mono"
                    readOnly
                    value="https://api.smartpark.io/sso/fleet/callback"
                  />
                  <button
                    onClick={() =>
                      copy("https://api.smartpark.io/sso/fleet/callback")
                    }
                    className="inline-flex items-center gap-1 h-9 px-3 rounded-md border border-slate-200 text-[12px] font-semibold text-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </Field>
              <Field label="SP Entity ID">
                <div className="flex gap-2">
                  <input
                    className="input font-mono"
                    readOnly
                    value="urn:smartpark:fleet"
                  />
                  <button
                    onClick={() => copy("urn:smartpark:fleet")}
                    className="inline-flex items-center gap-1 h-9 px-3 rounded-md border border-slate-200 text-[12px] font-semibold text-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </Field>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[12px] font-semibold text-slate-800">
                  Attribute mapping
                </p>
                <ul className="mt-2 text-[11px] text-slate-600 space-y-1">
                  <li>
                    <span className="font-mono bg-white rounded px-1.5 py-0.5">
                      NameID
                    </span>{" "}
                    → driver email
                  </li>
                  <li>
                    <span className="font-mono bg-white rounded px-1.5 py-0.5">
                      groups
                    </span>{" "}
                    → Fleet OS role (admin / dispatcher / driver)
                  </li>
                  <li>
                    <span className="font-mono bg-white rounded px-1.5 py-0.5">
                      costCenter
                    </span>{" "}
                    → cost center code
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5" />
                <p className="text-[12px] text-emerald-800">
                  Last verified{" "}
                  {new Date(local.updatedAt).toLocaleString()}. Push a fresh
                  metadata XML from your IdP if this drifts.
                </p>
              </div>
            </div>
          </div>
        </FleetSection>
      </FleetPageBody>
    </FleetLayout>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
      {label}
    </span>
    <div className="mt-1 [&_.input]:w-full [&_.input]:h-9 [&_.input]:rounded-md [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3 [&_.input]:text-[13px]">
      {children}
    </div>
  </label>
);

export default FleetSsoScreen;
