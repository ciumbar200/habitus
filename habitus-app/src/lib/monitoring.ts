import * as Sentry from "@sentry/react";
import { publicEnv } from "./runtimeConfig";

type AppErrorContext = {
  tags?: Record<string, string | number | boolean>;
  extra?: Record<string, unknown>;
  level?: "debug" | "info" | "warning" | "error" | "fatal";
};

let initialized = false;

export function initMonitoring(): void {
  if (initialized) return;
  initialized = true;

  const dsn = publicEnv("VITE_SENTRY_DSN");
  if (!dsn) return;

  const sampleRate = Number(publicEnv("VITE_SENTRY_TRACES_SAMPLE_RATE") ?? "0");
  Sentry.init({
    dsn,
    environment: publicEnv("VITE_SENTRY_ENVIRONMENT"),
    release: publicEnv("VITE_SENTRY_RELEASE"),
    tracesSampleRate: Number.isFinite(sampleRate) ? sampleRate : 0,
  });
}

export function captureAppError(error: unknown, context: AppErrorContext = {}): void {
  initMonitoring();
  Sentry.captureException(error, {
    tags: context.tags,
    extra: context.extra,
    level: context.level,
  });
}
