-- GüvenCheck M3.2 protection eligibility evidence delta.
-- Production execution remains a separate Founder migration gate.

alter table public.beta_events drop constraint if exists beta_events_event_type_check;
alter table public.beta_events add constraint beta_events_event_type_check check (
  event_type in (
    'page_view','analysis_started','analysis_completed','analysis_error','share_clicked','privacy_view','analysis_feedback',
    'protection_candidate_eligible','protection_save_intent','protection_saved','protection_removed','protection_status_view','protection_event_useful','repeat_protection',
    'deep_verification_eligible','deep_verification_interest','trusted_helper_share','core_decision_value','payer_role','payment_interest',
    'analysis_reuse_hit','analysis_reuse_miss','curated_intelligence_hit'
  )
);
