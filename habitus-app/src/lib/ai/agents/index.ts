import { agentPrompts } from "../prompts/index.js";
import { agentSchemas, type AgentName } from "../schemas/index.js";

export type AgentDefinition = {
  name: AgentName;
  modelEnv: "AI_DEFAULT_MODEL" | "AI_MATCH_MODEL" | "AI_SAFETY_MODEL" | "AI_VISION_MODEL";
  system: string;
  schema: Record<string, unknown>;
};

export const agents: Record<AgentName, AgentDefinition> = {
  tenantProfileAgent: { name: "tenantProfileAgent", modelEnv: "AI_DEFAULT_MODEL", system: agentPrompts.tenantProfileAgent, schema: agentSchemas.tenantProfileAgent },
  propertyIntelligenceAgent: { name: "propertyIntelligenceAgent", modelEnv: "AI_DEFAULT_MODEL", system: agentPrompts.propertyIntelligenceAgent, schema: agentSchemas.propertyIntelligenceAgent },
  moonMatchAgent: { name: "moonMatchAgent", modelEnv: "AI_MATCH_MODEL", system: agentPrompts.moonMatchAgent, schema: agentSchemas.moonMatchAgent },
  listingQualityAgent: { name: "listingQualityAgent", modelEnv: "AI_DEFAULT_MODEL", system: agentPrompts.listingQualityAgent, schema: agentSchemas.listingQualityAgent },
  basicTrustAgent: { name: "basicTrustAgent", modelEnv: "AI_VISION_MODEL", system: agentPrompts.basicTrustAgent, schema: agentSchemas.basicTrustAgent },
  safetyAgent: { name: "safetyAgent", modelEnv: "AI_SAFETY_MODEL", system: agentPrompts.safetyAgent, schema: agentSchemas.safetyAgent },
  operatorInsightsAgent: { name: "operatorInsightsAgent", modelEnv: "AI_DEFAULT_MODEL", system: agentPrompts.operatorInsightsAgent, schema: agentSchemas.operatorInsightsAgent },
};
