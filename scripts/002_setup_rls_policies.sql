-- Enable Row Level Security on the songs table
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own songs
CREATE POLICY "Users can view own songs" ON public.songs
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own songs
CREATE POLICY "Users can insert own songs" ON public.songs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own songs
CREATE POLICY "Users can update own songs" ON public.songs
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own songs
CREATE POLICY "Users can delete own songs" ON public.songs
    FOR DELETE USING (auth.uid() = user_id);
