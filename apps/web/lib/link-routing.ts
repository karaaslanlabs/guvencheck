export type LinkFacts = {
  hasUserInfo: boolean;
  hasPunycode: boolean;
  isIpHost: boolean;
  nonStandardPort: boolean;
  subdomainLabels: number;
  queryParamCount: number;
  pathLength: number;
};

export type LinkFirstPass = {
  score: number;
  confidence: 'low' | 'medium' | 'high';
};

export function linkEscalationReasons(first: LinkFirstPass, facts: LinkFacts) {
  const reasons: string[] = [];
  if (first.confidence === 'low') reasons.push('low_confidence');
  if (first.score >= 25 && first.score <= 75) reasons.push('gray_zone_score');

  const strongUrlAnomaly = facts.hasUserInfo || facts.hasPunycode || facts.isIpHost || facts.nonStandardPort;
  if (strongUrlAnomaly && first.score < 76) reasons.push('deterministic_url_anomaly');

  const unusualComplexity = facts.subdomainLabels >= 4 || facts.queryParamCount >= 10 || facts.pathLength >= 140;
  if (unusualComplexity && first.score >= 15 && first.score < 76) reasons.push('unusual_url_complexity');

  return Array.from(new Set(reasons));
}
