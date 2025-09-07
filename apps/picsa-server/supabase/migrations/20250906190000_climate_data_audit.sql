CREATE TRIGGER prevent_noop_update_trigger
BEFORE UPDATE ON public.climate_station_data
FOR EACH ROW
EXECUTE FUNCTION audit.prevent_noop_update();

CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.climate_station_data
FOR EACH ROW
EXECUTE FUNCTION audit.audit_with_diff('station_id');