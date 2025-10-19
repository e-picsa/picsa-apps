-- Generic discussions table for all PICSA tools

CREATE TABLE public.discussions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tool text NOT NULL,
  context jsonb NOT NULL,
  comment text NOT NULL,
  created_by uuid NOT NULL,
  created_by_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  resolved boolean DEFAULT false NOT NULL
);

-- Basic indexes
CREATE INDEX idx_discussions_tool ON public.discussions(tool);
CREATE INDEX idx_discussions_context ON public.discussions USING GIN(context);