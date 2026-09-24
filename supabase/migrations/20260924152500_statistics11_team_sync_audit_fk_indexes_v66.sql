-- Statistics 11 · Team Sync Audit FK indexes V66
create index if not exists python_hub_team_sync_audit_participant_idx
  on private.python_hub_team_sync_audit(participant_registration_id);

create index if not exists python_hub_team_sync_audit_owner_idx
  on private.python_hub_team_sync_audit(owner_registration_id);
