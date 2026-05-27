import { useEffect } from "react";
import type { ReactElement } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { createRealtimeClient } from "@/api/realtime";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/i18n";
import { getHealth, statusQueryKeys } from "./api";

type HealthStatus = "loading" | "ok" | "error";

export function StatusView() {
  const t = useI18n();
  const queryClient = useQueryClient();
  const health = useQuery({
    queryKey: statusQueryKeys.health(),
    queryFn: ({ signal }) => getHealth(signal),
  });

  useEffect(() => {
    const realtime = createRealtimeClient();
    const unsubscribe = realtime.onEvent((event) => {
      if (event.channel === "status") {
        void queryClient.invalidateQueries({ queryKey: statusQueryKeys.health() });
      }
    });
    void realtime.connect().then(() => realtime.subscribe("status")).catch(() => undefined);
    return () => {
      unsubscribe();
      realtime.close();
    };
  }, [queryClient]);

  const status: HealthStatus = health.isPending
    ? "loading"
    : health.data?.status === "ok"
      ? "ok"
      : "error";

  const statusBadge = {
    loading: (
      <Badge variant="secondary" className="gap-2">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        {t.status.loading}
      </Badge>
    ),
    ok: (
      <Badge variant="success" className="gap-2">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        {t.status.ok}
      </Badge>
    ),
    error: (
      <Badge variant="destructive" className="gap-2">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        {t.status.error}
      </Badge>
    ),
  } satisfies Record<HealthStatus, ReactElement>;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-10 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{t.app.title}</CardTitle>
          <CardDescription>{t.app.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {statusBadge[status]}
        </CardContent>
      </Card>
    </main>
  );
}
