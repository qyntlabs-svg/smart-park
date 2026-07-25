// Public surface of the Vehicle Identity Platform module.
//
// Subagent A (C-52 `/my-car`) consumes the type + `getVehicleIdentity`
// exports below. Do not remove those symbols without coordinating.

export * from "./types";
export {
  getVehicleIdentity,
  getVehicleIdentityForConsumer,
  listVehicleIdentities,
  updatePermissions,
  searchVehicles,
} from "./store";
export * from "./hooks";

export { default as VipVehicleSearchScreen } from "./pages/VipVehicleSearchScreen";
export { default as VipVehicleProfileScreen } from "./pages/VipVehicleProfileScreen";
export { default as VipHistoryScreen } from "./pages/VipHistoryScreen";
export { default as VipOwnershipScreen } from "./pages/VipOwnershipScreen";
export { default as VipDocsScreen } from "./pages/VipDocsScreen";
export { default as VipInsuranceIntegrationsScreen } from "./pages/VipInsuranceIntegrationsScreen";
export { default as VipOemFeedsScreen } from "./pages/VipOemFeedsScreen";
export { default as VipPermissionsScreen } from "./pages/VipPermissionsScreen";
