// Screen: DEV-02 · Primitives: Identity, Provider
// API Keys — create / rotate / scope keys. Uses the reusable ApiKeyManager
// component that F-11 (Fleet OS) also mounts, proving the shared surface.

import { toast } from "sonner";
import {
  DevLoading,
  DevPageBody,
  DevSection,
  DeveloperLayout,
} from "@/modules/developer/components/DeveloperLayout";
import ApiKeyManager from "@/modules/developer/components/ApiKeyManager";
import {
  useCreateDevApiKey,
  useDevApiKeys,
  useRevokeDevApiKey,
  useRotateDevApiKey,
} from "@/modules/developer/hooks";
import { SCOPE_LABEL, type ApiKeyEnv, type ApiKeyScope } from "@/modules/developer/types";

const SCOPE_OPTIONS = Object.keys(SCOPE_LABEL) as ApiKeyScope[];

const DeveloperKeysScreen = () => {
  const keys = useDevApiKeys();
  const create = useCreateDevApiKey();
  const rotate = useRotateDevApiKey();
  const revoke = useRevokeDevApiKey();

  return (
    <DeveloperLayout
      title="API keys"
      screenId="DEV-02"
      primitives={["Identity", "Provider"]}
    >
      {keys.isLoading ? (
        <DevLoading />
      ) : keys.isError ? (
        <DevPageBody>
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-[13px] text-red-800">
            Couldn't load keys.
            <button
              onClick={() => keys.refetch()}
              className="ml-3 h-7 px-3 rounded-md bg-white border border-red-300 text-red-700 text-[11px] font-semibold"
            >
              Retry
            </button>
          </div>
        </DevPageBody>
      ) : (
        <DevPageBody>
          <DevSection
            title="Your keys"
            subtitle="Live keys touch real payments. Test keys are safe to check in."
          >
            <div className="p-4">
              <ApiKeyManager
                variant="developer"
                keys={(keys.data ?? []).map((k) => ({ ...k, scopes: k.scopes as string[] }))}
                scopeOptions={SCOPE_OPTIONS}
                onCreate={async (input) => {
                  const res = await create.mutateAsync({
                    label: input.label,
                    env: input.env as ApiKeyEnv,
                    scopes: input.scopes as ApiKeyScope[],
                  });
                  toast.success(`Key "${input.label}" created`);
                  return { plaintext: res.plaintext };
                }}
                onRotate={async (id) => {
                  await rotate.mutateAsync(id);
                }}
                onRevoke={async (id) => {
                  await revoke.mutateAsync(id);
                }}
              />
            </div>
          </DevSection>

          <DevSection title="Key hygiene tips">
            <ul className="p-4 space-y-2 text-[13px] text-slate-700 list-disc pl-8">
              <li>
                Rotate live keys every 90 days. Rotation invalidates the old
                secret <em>immediately</em> — deploy the new one first.
              </li>
              <li>
                Never commit secrets. Use{" "}
                <code className="text-[11px] bg-slate-100 rounded px-1 py-0.5">
                  SMARTPARK_API_KEY
                </code>{" "}
                env var + a secret manager.
              </li>
              <li>
                Scope minimally.{" "}
                <code className="text-[11px] bg-slate-100 rounded px-1 py-0.5">
                  reservations.read
                </code>{" "}
                won't let a leaked key launch a session.
              </li>
              <li>
                Use{" "}
                <code className="text-[11px] bg-slate-100 rounded px-1 py-0.5">
                  Idempotency-Key
                </code>{" "}
                on every POST — retries won't double-charge.
              </li>
            </ul>
          </DevSection>
        </DevPageBody>
      )}
    </DeveloperLayout>
  );
};

export default DeveloperKeysScreen;
