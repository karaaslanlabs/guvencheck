export type AnalysisType = 'text' | 'link' | 'image';
export type RiskLevel = 'low' | 'medium' | 'high';

export type AnalysisResult = {
  score: number;
  level: RiskLevel;
  summary: string;
  signals: string[];
  actions: string[];
  avoid: string[];
  confidence: 'low' | 'medium' | 'high';
  mode: 'ai' | 'demo';
  verifiedFindings?: string[];
  sources?: { title: string; url: string }[];
  meta?: { route?: string; latencyMs?: number; escalated?: boolean; firstScore?: number };
};
