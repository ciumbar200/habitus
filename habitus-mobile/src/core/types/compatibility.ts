export type CompatQuizAnswers = Record<string, string>;

export type MatchKind = "roommate" | "host_tenant";

export type CompatibilityDimension = {
  key: string;
  label: string;
  weight: number;
  score: number;
  detail: string;
};

export type CompatibilityResult = {
  overall: number;
  dimensions: CompatibilityDimension[];
  summary: string;
};
