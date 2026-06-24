export type JsonSchema = Record<string, unknown>;

const strings = { type: "array", items: { type: "string" } };
const score = { type: "number", minimum: 0, maximum: 100 };

function object(properties: Record<string, unknown>, required = Object.keys(properties)): JsonSchema {
  return { type: "object", additionalProperties: false, properties, required };
}

export const agentSchemas = {
  tenantProfileAgent: object({
    lifestyle_tags: strings, personality_summary: { type: "string" }, ideal_roommate_profile: { type: "string" },
    compatibility_notes: { type: "string" }, risk_flags: strings, recommended_property_type: { type: "string" }, confidence_score: score,
  }),
  propertyIntelligenceAgent: object({
    property_tags: strings, best_for: strings, not_recommended_for: strings, property_summary: { type: "string" },
    missing_information: strings, suggested_description: { type: "string" }, risk_flags: strings, confidence_score: score,
  }),
  moonMatchAgent: object({
    match_score: score, compatibility_level: { type: "string", enum: ["low", "medium", "high", "excellent"] },
    main_reasons: strings, possible_conflicts: strings, questions_to_ask: strings, recommendation: { type: "string" },
    explanation_for_user: { type: "string" }, explanation_for_owner: { type: "string" }, confidence_score: score,
  }),
  listingQualityAgent: object({
    quality_score: score, status: { type: "string", enum: ["ready", "needs_improvement", "manual_review"] },
    missing_fields: strings, improvement_suggestions: strings, disallowed_or_risky_language: strings,
    recommended_action: { type: "string" }, confidence_score: score,
  }),
  basicTrustAgent: object({
    document_quality: { type: "string", enum: ["poor", "acceptable", "good"] },
    selfie_quality: { type: "string", enum: ["poor", "acceptable", "good"] }, code_visible: { type: "boolean" },
    declared_name_match: { type: "string", enum: ["yes", "no", "unclear"] },
    face_match_confidence: { type: "string", enum: ["low", "medium", "high", "unclear"] }, risk_flags: strings,
    recommended_status: { type: "string", enum: ["manual_review", "retry_required", "advanced_required"] },
    explanation_internal: { type: "string" }, explanation_user: { type: "string" }, confidence_score: score,
  }),
  safetyAgent: object({
    risk_level: { type: "string", enum: ["low", "medium", "high"] }, risk_flags: strings, detected_issues: strings,
    recommended_action: { type: "string", enum: ["allow", "warn", "manual_review", "block_temporarily"] },
    explanation_internal: { type: "string" }, confidence_score: score,
  }),
  contactExchangeShieldAgent: object({
    decision: { type: "string", enum: ["allow", "block"] },
    matched_signals: strings,
    explanation_internal: { type: "string" },
    user_message: { type: "string" },
    confidence_score: score,
  }),
  operatorInsightsAgent: object({
    summary: { type: "string" }, occupancy_risk: { type: "string", enum: ["low", "medium", "high"] },
    lead_quality_summary: { type: "string" }, recommended_actions: strings, pricing_suggestions: strings,
    rooms_needing_attention: strings, confidence_score: score,
  }),
  adminPlatformInsightsAgent: object({
    summary: { type: "string" },
    health_score: score,
    critical_issues: strings,
    product_improvements: strings,
    growth_actions: strings,
    security_and_trust_notes: strings,
    priority_this_week: strings,
    confidence_score: score,
  }),
} as const;

export type AgentName = keyof typeof agentSchemas;
