import { get } from "@/api/client";

export type HealthResponse = {
  status: string;
};

export const getHealth = (signal?: AbortSignal) =>
  get<HealthResponse>("/api/health", signal);
