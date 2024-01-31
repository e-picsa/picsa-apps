-- Sync records from monitoring_tool_submissions table to kobo
create trigger monitoring_tool_kobo_sync
after
insert
  or
update
  or delete on monitoring_tool_submissions for each row execute function add_kobo_sync_entry();