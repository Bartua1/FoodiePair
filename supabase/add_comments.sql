-- Add created_by column to restaurants
ALTER TABLE restaurants ADD COLUMN created_by TEXT REFERENCES profiles(id);

-- Create comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy for comments: Users can manage comments in their pair
CREATE POLICY "Users can manage comments in their pair" ON comments
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE pair_id IN (
                SELECT pair_id FROM profiles WHERE id = auth.uid()::text
            )
        )
    );
