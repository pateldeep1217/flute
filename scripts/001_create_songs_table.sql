-- Create songs table for flute learning app
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for CRUD operations
CREATE POLICY "songs_select_own" ON public.songs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "songs_insert_own" ON public.songs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "songs_update_own" ON public.songs 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "songs_delete_own" ON public.songs 
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_songs_updated_at 
  BEFORE UPDATE ON public.songs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
