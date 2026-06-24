import { AgentError } from "./api";
import type { I18n } from "@habitus/core";

export type AIErrorState = {
  message: string;
  retryable: boolean;
  retryAfter: number | null;
};

export function aiErrorState(error: unknown, fallback: string, copy?: I18n["ai"]): AIErrorState {
  if (error instanceof AgentError) {
    return {
      message: copy ? translatedAgentError(error, copy, fallback) : error.message,
      retryable: error.retryable,
      retryAfter: error.retryAfter,
    };
  }

  return {
    message: error instanceof Error ? error.message : fallback,
    retryable: false,
    retryAfter: null,
  };
}

function translatedAgentError(error: AgentError, copy: I18n["ai"], fallback: string): string {
  if (error.code === "no_session") return copy.signInRequired;
  if (error.code === "network") return copy.networkError;
  if (error.code === "invalid_response") return copy.invalidResponse;
  if (error.code === "daily_quota") return copy.dailyQuotaReached;
  if (error.code === "ai_gateway_rate_limited") return copy.gatewayBusy;
  return error.message || fallback;
}
