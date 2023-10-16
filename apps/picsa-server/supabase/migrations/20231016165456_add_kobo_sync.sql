-- kobo_sync table keeps track of all pending sync operations
CREATE TABLE IF NOT EXISTS "public"."kobo_sync" (
    "_id" "text",
    "operation" "text" NOT NULL,
    "kobo_uuid" "text",
    "_sync_timestamp" timestamp with time zone,
    "_created" timestamp with time zone DEFAULT "now"() NOT NULL,
    "_modified" timestamp with time zone DEFAULT "now"() NOT NULL,
    constraint kobo_sync_pkey primary key (_id)
);

-- Write to kobo_sync table when records changed
-- Assumes synced table includes _id reference column
create function add_kobo_sync_entry() returns trigger as $$ 
begin
    -- Handle upsert
    if (TG_OP = 'CREATE' OR TG_OP = 'UPDATE') then
        insert into
            kobo_sync(_id, operation)
        values
            (concat(TG_TABLE_NAME,'||',NEW._id), TG_OP)
        ON CONFLICT (_id) DO UPDATE 
            SET operation = excluded.operation;
    -- Handle delete
    elsif (TG_OP = 'DELETE') then
        insert into
            kobo_sync(_id, operation, kobo_uuid)
        values
            (concat(TG_TABLE_NAME,'||',OLD._id), TG_OP, old._kobo_uuid)
        ON CONFLICT (_id) DO UPDATE 
            SET operation = excluded.operation;
    END IF;
    RETURN NULL;
end;
$$ language plpgsql;

create trigger monitoring_tool_kobo_sync
    after insert or update or delete on monitoring_tool_submissions 
    for each row 
    execute function add_kobo_sync_entry();