import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/i18n";
import { getHealth } from "./api";

type HealthStatus = "loading" | "ok" | "error";

export function StatusView() {
  const t = useI18n();
  const [status, setStatus] = useState<HealthStatus>("loading");

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal)
      .then((data) => setStatus(data.status === "ok" ? "ok" : "error"))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setStatus("error");
        }
      });
    return () => controller.abort();
  }, []);

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
