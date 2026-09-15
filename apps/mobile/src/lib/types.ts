export type AnalysisType = 'text' | 'link' | 'image';
export type RiskLevel = 'low' | 'medium' | 'high';
export type ProtectionKind = 'none' | 'trial' | 'subscription' | 'commitment' | 'purchase' | 'deadline';
export type ProtectionReminderState = 'scheduled' | 'permission_denied' | 'not_scheduled' | 'unavailable';

export type ProtectionCandidate = {
  eligible: boolean;
  kind: ProtectionKind;
  title: string;
  provider: string;
  deadline: string;
  nextAction: string;
  summary: string;
};

export type ProtectionObject = ProtectionCandidate & {
  id: string;
  savedAt: string;
  sourceRequestId?: string;
  reminderState?: ProtectionReminderState;
  notificationId?: string;
  reminderAt?: string;
};

export type AnalysisResult = {
  requestId?: string;
  score: number;
  level: RiskLevel;
  summary: string;
  signals: string[];
  manipulationTactics?: string[];
  manipulationSummary?: string;
  protectionCandidate?: ProtectionCandidate;
  officialSafePath?: { kind: string; title: string; action: string } | null;
  actions: string[];
  avoid: string[];
  confidence: 'low' | 'medium' | 'high';
  mode: 'ai' | 'demo';
  verifiedFindings?: string[];
  sources?: { title: string; url: string }[];
  decisionSupport?: {
    uncertainty: 'low' | 'medium' | 'high';
    uncertaintySummary: string;
    implication: string;
    nextAction: string;
  };
  meta?: { route?: string; latencyMs?: number; escalated?: boolean; firstScore?: number };
};
