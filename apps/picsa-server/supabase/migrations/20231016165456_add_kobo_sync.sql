-- kobo_sync table keeps track of all pending sync operations
CREATE TABLE IF NOT EXISTS "public"."kobo_sync" (
    "_id" "text",
    "_created" timestamp with time zone DEFAULT "now"() NOT NULL,
    "_modified" timestamp with time zone DEFAULT "now"() NOT NULL,
    "operation" "text" NOT NULL,
    "kobo_form_id" "text",
    "kobo_uuid" "text",
    "kobo_sync_time" timestamp with time zone,
    "kobo_sync_status" integer,
    "enketo_entry" "jsonb",
    "kobo_sync_required" boolean GENERATED ALWAYS AS ((kobo_sync_time IS NULL) OR (kobo_sync_time < _modified)) STORED,
    constraint kobo_sync_pkey primary key (_id)
);

-- Write to kobo_sync table when records changed
-- Assumes synced table includes _id reference column
create function add_kobo_sync_entry() returns trigger as $$ 
begin
    -- Handle upsert
    if (TG_OP = 'CREATE' OR TG_OP = 'UPDATE') then
        insert into
            kobo_sync(_id, operation, enketo_entry)
        values
            -- Hack - enketoEntry must be quoted as default to lowercase. 
            -- Extract json xml child property, cast to text and then cast to xml data type
            -- TODO - would be cleaner if just storing xml in app instead of enketoEntry json
            -- although would need to be more careful with handling escape characters (can store as xml data type)
            (NEW._id, TG_OP, NEW."enketoEntry")
        ON CONFLICT (_id) DO UPDATE 
            SET 
                operation = excluded.operation,
                enketo_entry = excluded.enketo_entry,
                _modified = excluded._modified;
    -- Handle delete
    elsif (TG_OP = 'DELETE') then
        insert into
            kobo_sync(_id, operation)
        values
            (OLD._id, TG_OP)
        ON CONFLICT (_id) DO UPDATE 
            SET 
                operation = excluded.operation,
                enketo_entry = excluded.enketo_entry,
                _modified = excluded._modified;
    END IF;
    RETURN NULL;
end;
$$ language plpgsql;

-- Trigger kobo-sync backend function when kobo_sync table updated
create trigger trigger_kobo_sync_function
    after insert or update on kobo_sync 
    for each row 
    -- TODO - handle production endpoint 
    execute function "supabase_functions"."http_request"(
    'http://localhost:54321/functions/v1/kobo-sync',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '1000'
    );





-- Alt - could concat id with table `concat(TG_TABLE_NAME,'||',NEW._id`

-- Alt - could keep one entry per instance ID although could lead to data loss if next batch process
-- starts before previous finishes