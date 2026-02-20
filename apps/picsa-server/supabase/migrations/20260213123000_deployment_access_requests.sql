-- Create deployment_access_requests table
CREATE TABLE IF NOT EXISTS public.deployment_access_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deployment_id TEXT NOT NULL REFERENCES public.deployments(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, deployment_id)
);

-- Enable RLS
ALTER TABLE public.deployment_access_requests ENABLE ROW LEVEL SECURITY;

-- Policies

-- Insert: Users can request access for themselves
CREATE POLICY "Users can create their own access requests"
ON public.deployment_access_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Select: Users can view their own requests
CREATE POLICY "Users can view their own access requests"
ON public.deployment_access_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Select: Admins can view requests for their deployments
-- We need to check if the user is an admin for the deployment_id in the row
CREATE POLICY "Admins can view access requests for their deployments"
ON public.deployment_access_requests
FOR SELECT
TO authenticated
USING (
    public.user_has_role(deployment_id, 'deployments.admin') 
);

-- Update: Admins can update status for requests in their deployments
CREATE POLICY "Admins can update access requests for their deployments"
ON public.deployment_access_requests
FOR UPDATE
TO authenticated
USING (
    public.user_has_role(deployment_id, 'deployments.admin')
);

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.deployment_access_requests 
FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

-- Trigger for notification
-- Function to handle the notification invocation securely across environments
CREATE OR REPLACE FUNCTION public.handle_new_deployment_access_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM public.call_edge_function('dashboard/deployments/notify-requests', jsonb_build_object('record', NEW));
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_deployment_access_request_created
    AFTER INSERT ON public.deployment_access_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_deployment_access_request();

-- Grant permissions explicitly just in case (though defaults might cover it depending on setup)
GRANT SELECT, INSERT, UPDATE ON public.deployment_access_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.deployment_access_requests TO service_role;
