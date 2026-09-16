export type TrustGraphRightsMode =
  | "curated_verified_fact"
  | "licensed_ingest"
  | "on_demand_verified"
  | "link_out_only";

export type TrustGraphEntityKind =
  | "bank"
  | "payment_institution"
  | "investment_institution"
  | "commerce"
  | "public";

export type TrustGraphEntity = {
  id: string;
  name: string;
  aliases?: readonly string[];
  kind: TrustGraphEntityKind;
  status: "active" | "inactive" | "unknown";
  officialDomains: readonly string[];
  source: {
    authority: string;
    url: string;
    rightsMode: TrustGraphRightsMode;
    observedAt: string;
    expiresAt?: string;
  };
};

// Production seed stays empty until each source fact has a reviewed rights/provenance path.
export const TRUST_GRAPH_SEED: TrustGraphEntity[] = [];

function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]?.replace(/\.$/, "") || "";
}

function normalizeText(value: string) {
  return value.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
}

function parseHostname(value: string) {
  try {
    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
    return new URL(candidate).hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return "";
  }
}

function sourceIsCurrent(entity: TrustGraphEntity, now: Date) {
  const observed = new Date(entity.source.observedAt);
  if (Number.isNaN(observed.getTime()) || observed > now) return false;
  if (!entity.source.expiresAt) return true;
  const expires = new Date(entity.source.expiresAt);
  return !Number.isNaN(expires.getTime()) && expires > now && expires > observed;
}

function decisionEligible(entity: TrustGraphEntity) {
  return entity.source.rightsMode !== "link_out_only" && entity.status !== "inactive";
}

export function usableTrustEntities(
  records: readonly TrustGraphEntity[] = TRUST_GRAPH_SEED,
  now = new Date(),
) {
  return records.filter((entity) => {
    if (!entity.id.trim() || !entity.name.trim() || !entity.source.authority.trim() || !entity.source.url.trim()) return false;
    if (!sourceIsCurrent(entity, now) || !decisionEligible(entity)) return false;
    return entity.officialDomains.some((domain) => Boolean(normalizeDomain(domain)));
  });
}

export function isOfficialDomainForEntity(urlOrDomain: string, entity: TrustGraphEntity) {
  const host = parseHostname(urlOrDomain);
  if (!host) return false;
  return entity.officialDomains.some((raw) => {
    const domain = normalizeDomain(raw);
    return Boolean(domain) && (host === domain || host.endsWith(`.${domain}`));
  });
}

export function lookupOfficialDomain(
  urlOrDomain: string,
  records: readonly TrustGraphEntity[] = TRUST_GRAPH_SEED,
  now = new Date(),
) {
  return usableTrustEntities(records, now).find((entity) => isOfficialDomainForEntity(urlOrDomain, entity)) ?? null;
}

export function findClaimedEntities(
  text: string,
  records: readonly TrustGraphEntity[] = TRUST_GRAPH_SEED,
  now = new Date(),
) {
  const haystack = normalizeText(text);
  if (!haystack) return [];
  return usableTrustEntities(records, now).filter((entity) => {
    const names = [entity.name, ...(entity.aliases || [])].map(normalizeText).filter(Boolean);
    return names.some((name) => haystack.includes(name));
  });
}
