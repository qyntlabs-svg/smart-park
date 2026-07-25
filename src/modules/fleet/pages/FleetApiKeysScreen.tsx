// Screen: F-11 · Primitives: Identity
// Fleet API Keys — programmatic access for fleet integrations.
// Reuses the ApiKeyManager component from the Developer Portal module so
// the UX is identical across F-11 and DEV-02.

import {
  FleetLayout,
  FleetPageBody,
  FleetSection,
} from "@/modules/fleet/components/FleetLayout";
import ApiKeyManager, {
  type ApiKeyRecord,
} from "@/modules/developer/components/ApiKeyManager";
import {
  useCreateFleetApiKey,
  useFleetApiKeys,
  useRevokeFleetApiKey,
  useRotateFleetApiKey,
} from "@/modules/fleet/hooks";
import type { FleetApiScope } from "@/modules/fleet/types";

const FLEET_SCOPES: FleetApiScope[] = [
  "vehicles.read",
  "vehicles.write",
  "drivers.read",
  "reservations.read",
  "reservations.write",
  "reports.read",
];

const FleetApiKeysScreen = () => {
  const keys = useFleetApiKeys();
  const create = useCreateFleetApiKey();
  const rotate = useRotateFleetApiKey();
  const revoke = useRevokeFleetApiKey();

  const records: ApiKeyRecord[] = (keys.data ?? []).map((k) => ({
    id: k.id,
    label: k.label,
    env: "live",
    keyMasked: k.keyMasked,
    scopes: k.scopes,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt,
    rotatedAt: k.rotatedAt,
    revoked: k.revoked,
  }));

  return (
    <FleetLayout title="API keys" screenId="F-11" primitives={["Identity"]}>
      <FleetPageBody>
        <FleetSection
          title="Fleet API keys"
          subtitle="Reused across Fleet OS and Developer Portal"
        >
          <div className="p-4 md:p-5">
            <ApiKeyManager
              variant="fleet"
              keys={records}
              scopeOptions={FLEET_SCOPES as string[]}
              loading={keys.isLoading}
              onCreate={async (input) => {
                const res = await create.mutateAsync({
                  label: input.label,
                  scopes: input.scopes as FleetApiScope[],
                });
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
        </FleetSection>
      </FleetPageBody>
    </FleetLayout>
  );
};

export default FleetApiKeysScreen;
