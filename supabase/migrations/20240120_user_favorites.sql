-- Add avatar_url to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create restaurant_favorites table
CREATE TABLE IF NOT EXISTS restaurant_favorites (
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, restaurant_id)
);

-- Enable RLS
ALTER TABLE restaurant_favorites ENABLE ROW LEVEL SECURITY;

-- Policies for restaurant_favorites
CREATE POLICY "Users can manage their own favorites" ON restaurant_favorites
    FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view favorites from their pair" ON restaurant_favorites
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM profiles WHERE pair_id IN (
                SELECT pair_id FROM profiles WHERE id = auth.uid()::text
            )
        )
    );

-- Data Migration: Migrate existing favorites (is_favorite = true) to both users in the pair
DO $$
DECLARE
    r RECORD;
    u1 TEXT;
    u2 TEXT;
BEGIN
    FOR r IN SELECT id, pair_id FROM restaurants WHERE is_favorite = true LOOP
        -- Get users for the pair
        SELECT user1_id, user2_id INTO u1, u2 FROM pairs WHERE id = r.pair_id;
        
        -- Insert for user 1
        IF u1 IS NOT NULL THEN
            INSERT INTO restaurant_favorites (user_id, restaurant_id) 
            VALUES (u1, r.id) 
            ON CONFLICT DO NOTHING;
        END IF;

        -- Insert for user 2
        IF u2 IS NOT NULL THEN
            INSERT INTO restaurant_favorites (user_id, restaurant_id) 
            VALUES (u2, r.id) 
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;
