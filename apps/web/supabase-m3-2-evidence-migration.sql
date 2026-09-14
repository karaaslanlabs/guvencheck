-- GüvenCheck M3.2 production evidence activation migration.
-- Idempotent preparation only; run in production only after Founder migration gate.

alter table public.beta_events add column if not exists event_value text;

alter table public.beta_events drop constraint if exists beta_events_event_type_check;
alter table public.beta_events add constraint beta_events_event_type_check check (
  event_type in (
    'page_view','analysis_started','analysis_completed','analysis_error','share_clicked','privacy_view','analysis_feedback',
    'protection_save_intent','protection_saved','protection_removed','protection_status_view','protection_event_useful','repeat_protection',
    'deep_verification_eligible','deep_verification_interest','trusted_helper_share','core_decision_value','payer_role','payment_interest',
    'analysis_reuse_hit','analysis_reuse_miss','curated_intelligence_hit'
  )
);

create table if not exists public.analysis_reuse (
  fingerprint text not null,
  contract_version text not null,
  source_request_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  risk_level text not null check (risk_level in ('low','medium','high')),
  result_json jsonb not null,
  source_estimated_cost_usd numeric(14,6),
  primary key (fingerprint, contract_version)
);

alter table public.analysis_reuse add column if not exists source_estimated_cost_usd numeric(14,6);
alter table public.analysis_reuse enable row level security;
revoke all on table public.analysis_reuse from anon, authenticated;
grant all on table public.analysis_reuse to service_role;

create index if not exists analysis_reuse_expires_at_idx on public.analysis_reuse (expires_at);
comment on table public.analysis_reuse is 'GüvenCheck M3.2 link reuse cache. HMAC fingerprint only; no raw URL, message, image or user identity.';
