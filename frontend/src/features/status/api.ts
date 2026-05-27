import { get } from "@/api/client";
import { forgerQueryKeys } from "@/api/query";

export type HealthResponse = {
  status: string;
};

export const statusQueryKeys = {
  health: () => forgerQueryKeys.resource("status", "health"),
};

export const getHealth = (signal?: AbortSignal) =>
  get<HealthResponse>("/api/health", signal);
