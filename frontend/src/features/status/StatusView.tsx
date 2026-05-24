import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
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

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Typography variant="h4" fontWeight={700}>
          {t.app.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t.app.subtitle}
        </Typography>

        {status === "loading" && <CircularProgress size={20} />}
        {status === "ok" && (
          <Chip label={t.status.ok} color="success" variant="outlined" />
        )}
        {status === "error" && (
          <Chip label={t.status.error} color="error" variant="outlined" />
        )}
      </Box>
    </Container>
  );
}
