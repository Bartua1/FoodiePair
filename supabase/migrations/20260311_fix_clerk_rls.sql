-- Migration: Fix Clerk RLS Policies
-- Description: Replaces auth.uid() calls with a custom requesting_user_id() function to extract Clerk IDs from JWT

-- 1. Create the custom function to extract Clerk user ID from JWT
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$;

-- 2. Drop the existing policies
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read their pair" ON pairs;
DROP POLICY IF EXISTS "Users can manage restaurants in their pair" ON restaurants;
DROP POLICY IF EXISTS "Users can manage ratings in their pair" ON ratings;
DROP POLICY IF EXISTS "Users can manage photos in their pair" ON photos;
DROP POLICY IF EXISTS "Users can manage comments in their pair" ON comments;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON restaurant_favorites;
DROP POLICY IF EXISTS "Users can view favorites from their pair" ON restaurant_favorites;
DROP POLICY IF EXISTS "Users can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;

-- 3. Recreate the policies using requesting_user_id()

-- Users can read/write their own profile
CREATE POLICY "Users can manage their own profile" ON profiles
    FOR ALL USING (id = requesting_user_id());

-- Users can read their pair info
CREATE POLICY "Users can read their pair" ON pairs
    FOR SELECT USING (user1_id = requesting_user_id() OR user2_id = requesting_user_id());

-- Users can manage restaurants for their pair
CREATE POLICY "Users can manage restaurants in their pair" ON restaurants
    FOR ALL USING (
        pair_id IN (
            SELECT pair_id FROM profiles WHERE id = requesting_user_id()
        )
    );

-- Similar for ratings, photos, comments
CREATE POLICY "Users can manage ratings in their pair" ON ratings
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE pair_id IN (
                SELECT pair_id FROM profiles WHERE id = requesting_user_id()
            )
        )
    );

CREATE POLICY "Users can manage photos in their pair" ON photos
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE pair_id IN (
                SELECT pair_id FROM profiles WHERE id = requesting_user_id()
            )
        )
    );

CREATE POLICY "Users can manage comments in their pair" ON comments
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE pair_id IN (
                SELECT pair_id FROM profiles WHERE id = requesting_user_id()
            )
        )
    );

-- restaurant_favorites
CREATE POLICY "Users can manage their own favorites" ON restaurant_favorites
    FOR ALL USING (user_id = requesting_user_id());

CREATE POLICY "Users can view favorites from their pair" ON restaurant_favorites
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM profiles WHERE pair_id IN (
                SELECT pair_id FROM profiles WHERE id = requesting_user_id()
            )
        )
    );

-- comment_likes
CREATE POLICY "Users can like comments" ON comment_likes
    FOR INSERT WITH CHECK (user_id = requesting_user_id());

CREATE POLICY "Users can unlike comments" ON comment_likes
    FOR DELETE USING (user_id = requesting_user_id());

-- notifications
CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL USING (user_id = requesting_user_id());

-- 4. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
