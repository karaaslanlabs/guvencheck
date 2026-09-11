-- GüvenCheck decision-support feedback migration
-- Existing beta_events rows are preserved; only allowed feedback reasons expand.

alter table public.beta_events
  drop constraint if exists beta_events_feedback_reason_check;

alter table public.beta_events
  add constraint beta_events_feedback_reason_check
  check (
    feedback_reason is null or feedback_reason in (
      'dogru','fazla_supheci','riski_az_gosterdi','anlasilmadi',
      'karar_net_degildi','sonraki_adim_net_degildi','belirsizlik_anlasilmadi','diger'
    )
  );