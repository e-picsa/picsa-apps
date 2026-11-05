-- Ensure pg_net extension exists for call_edge_function(), used by notification
-- triggers (e.g. deployment access requests). The extension was previously only
-- created by a legacy migration that is no longer applied on fresh rebuilds,
-- so any function calling net.http_post would fail with "schema net does not exist".
create extension if not exists pg_net with schema extensions;
