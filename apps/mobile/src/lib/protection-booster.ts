export type Booster = { title: string; action: string };

const BOOSTERS: Record<string, Booster> = {
  secrecy_isolation: {
    title: 'Gizlilik baskısını erken fark et',
    action: '“Kimseye söyleme” deniyorsa işlemi durdur ve güvendiğin birine göster.',
  },
  payment_channel_redirection: {
    title: 'Ödeme kanalını bağımsız doğrula',
    action: 'Alternatif ödeme kanalına geçmeden önce resmî kaynaktan doğrula.',
  },
  authority_impersonation: {
    title: 'Otorite görüntüsünü kanıt sayma',
    action: 'Kurum adı veya logosu yerine kurumun kendi resmî kanalını kullan.',
  },
  urgency_time_pressure: {
    title: 'Acil karar baskısına diren',
    action: 'Karşı tarafın verdiği süreyle değil, kendi doğrulama sürenle hareket et.',
  },
  scarcity_too_good_to_be_true: {
    title: 'Fırsat baskısında yavaşla',
    action: '“Son şans” veya aşırı iyi tekliflerde ödeme öncesi bağımsız doğrulama yap.',
  },
  emotional_leverage: {
    title: 'Duygu yükseldiğinde işlemi yavaşlat',
    action: 'Korku veya suçluluk baskısında hassas işlem öncesi ikinci bir kişiye danış.',
  },
  trust_building_social_engineering: {
    title: 'Yakınlık hissini kimlik kanıtı sayma',
    action: 'Güven veren ton veya uzun konuşma, kimliği tek başına doğrulamaz.',
  },
};

export function getProtectionBooster(tactics: string[] | undefined): Booster | null {
  if (!Array.isArray(tactics)) return null;
  for (const tactic of tactics) {
    if (BOOSTERS[tactic]) return BOOSTERS[tactic];
  }
  return null;
}
