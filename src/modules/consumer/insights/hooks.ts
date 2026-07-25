// Hooks over the insights mock store.

import { useQuery } from "@tanstack/react-query";
import {
  getCityAverage,
  getEnergyMonths,
  getHealthScore,
  getSavingsMonths,
  getStreakState,
} from "./store";

export const useHealthScore = (vehicleId: string | undefined) =>
  useQuery({
    queryKey: ["health-score", vehicleId ?? ""],
    queryFn: () => getHealthScore(vehicleId ?? "default"),
    enabled: true,
  });

export const useEnergyMonths = () =>
  useQuery({ queryKey: ["energy-months"], queryFn: () => getEnergyMonths() });

export const useCityAverage = () =>
  useQuery({ queryKey: ["city-average"], queryFn: () => getCityAverage() });

export const useSavingsMonths = () =>
  useQuery({ queryKey: ["savings-months"], queryFn: () => getSavingsMonths() });

export const useStreakState = () =>
  useQuery({ queryKey: ["streak-state"], queryFn: () => getStreakState() });
