import type { TrustGraphEntity } from "./trust-graph.ts";

const BDDK_BANK_LIST = "https://www.bddk.org.tr/Kurulus/Liste/77";
const OBSERVED_AT = "2026-09-16T16:30:00.000Z";
const EXPIRES_AT = "2026-10-16T16:30:00.000Z";

function bank(
  id: string,
  name: string,
  aliases: readonly string[],
  officialDomains: readonly string[],
): TrustGraphEntity {
  return {
    id,
    name,
    aliases,
    kind: "bank",
    status: "active",
    officialDomains,
    source: {
      authority: "BDDK",
      url: BDDK_BANK_LIST,
      rightsMode: "curated_verified_fact",
      observedAt: OBSERVED_AT,
      expiresAt: EXPIRES_AT,
    },
  };
}
export const BDDK_REVIEWED_BANK_SEED: readonly TrustGraphEntity[] = [
  bank("bddk-akbank", "AKBANK T.A.Ş.", ["akbank"], ["akbank.com"]),
  bank("bddk-denizbank", "DENİZBANK A.Ş.", ["denizbank"], ["denizbank.com"]),
  bank("bddk-enpara", "ENPARA BANK A.Ş.", ["enpara", "enpara bank"], ["enpara.com"]),
  bank("bddk-fibabanka", "FİBABANKA A.Ş.", ["fibabanka"], ["fibabanka.com.tr"]),
  bank("bddk-hsbc", "HSBC BANK A.Ş.", ["hsbc", "hsbc bank"], ["hsbc.com.tr"]),
  bank("bddk-ing", "ING BANK A.Ş.", ["ing bank"], ["ingbank.com.tr"]),
  bank("bddk-qnb", "QNB BANK A.Ş.", ["qnb", "qnb bank"], ["qnb.com.tr"]),
  bank("bddk-ziraat", "T.C. ZİRAAT BANKASI A.Ş.", ["ziraat bankası", "ziraat bank"], ["ziraat.com.tr"]),
  bank("bddk-teb", "TÜRK EKONOMİ BANKASI A.Ş.", ["teb", "türk ekonomi bankası"], ["teb.com.tr"]),
  bank("bddk-garanti", "TÜRKİYE GARANTİ BANKASI A.Ş.", ["garanti bbva", "garanti bankası"], ["garantibbva.com.tr"]),
  bank("bddk-halkbank", "TÜRKİYE HALK BANKASI A.Ş.", ["halkbank", "halk bankası"], ["halkbank.com.tr"]),
  bank("bddk-isbank", "TÜRKİYE İŞ BANKASI A.Ş.", ["iş bankası", "is bankasi", "işbank"], ["isbank.com.tr"]),
  bank("bddk-vakifbank", "TÜRKİYE VAKIFLAR BANKASI T.A.O.", ["vakıfbank", "vakifbank"], ["vakifbank.com.tr"]),
  bank("bddk-yapikredi", "YAPI VE KREDİ BANKASI A.Ş.", ["yapı kredi", "yapi kredi"], ["yapikredi.com.tr"]),
];
