// Worker-scoped exports (invites, worker records, worker auth, dispatch).
//
// Facade over the current monolithic src/lib/mechanic.ts. New worker-side
// code should import from "@/modules/worker/lib/workers".

export type {
  MechanicWorker,
  WorkerStatus,
  WorkerInvite,
  WorkerAuth,
} from "@/lib/mechanic";

export {
  // CRUD
  getAllWorkers,
  getWorkersForShop,
  getWorkerById,
  addWorker,
  updateWorker,
  // Invites
  getInvites,
  createWorkerInvite,
  getInvite,
  // Auth
  getWorkerAuth,
  setWorkerAuth,
  // Dispatch
  getEligibleWorkers,
  workerAcceptBooking,
  getAvailableMobileRequests,
  getWorkerAssignedBookings,
  DISPATCH_RADIUS_KM,
} from "@/lib/mechanic";
