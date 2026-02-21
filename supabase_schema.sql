
-- SQL to create tables in Supabase SQL Editor

-- 1. Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Match History Table
CREATE TABLE IF NOT EXISTS public.match_history (
    id TEXT PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    golf_course TEXT,
    groups JSONB NOT NULL, -- Stores the groups with scores as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enabling Row Level Security (RLS) - Optional but recommended
-- For a simple private tool, you can disable RLS or allow all access for anon key
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.match_history FOR ALL USING (true) WITH CHECK (true);
