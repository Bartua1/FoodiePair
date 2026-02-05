-- Create shared_restaurants table
CREATE TABLE IF NOT EXISTS shared_restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    created_by TEXT REFERENCES profiles(id),
    configuration JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shared_restaurant_users table
CREATE TABLE IF NOT EXISTS shared_restaurant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_restaurant_id UUID REFERENCES shared_restaurants(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shared_restaurant_id, user_id)
);

-- Enable RLS
ALTER TABLE shared_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_restaurant_users ENABLE ROW LEVEL SECURITY;

-- Helper function to break RLS recursion using raw JWT sub (for Clerk compatibility)
CREATE OR REPLACE FUNCTION check_shared_restaurant_creator(_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM shared_restaurants
    WHERE id = _id
    AND created_by = (auth.jwt() ->> 'sub')
  );
END;
$$;

-- Policies for shared_restaurants

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "Users can manage their shared restaurants" ON shared_restaurants;
DROP POLICY IF EXISTS "Users can view shared restaurants they have access to" ON shared_restaurants;
DROP POLICY IF EXISTS "Users can insert shared restaurants" ON shared_restaurants;
DROP POLICY IF EXISTS "Users can update shared restaurants" ON shared_restaurants;
DROP POLICY IF EXISTS "Users can delete shared restaurants" ON shared_restaurants;

-- INSERT policy
CREATE POLICY "Users can insert shared restaurants" ON shared_restaurants
    FOR INSERT WITH CHECK (created_by = (auth.jwt() ->> 'sub'));

-- UPDATE policy
CREATE POLICY "Users can update shared restaurants" ON shared_restaurants
    FOR UPDATE USING (created_by = (auth.jwt() ->> 'sub'));

-- DELETE policy
CREATE POLICY "Users can delete shared restaurants" ON shared_restaurants
    FOR DELETE USING (created_by = (auth.jwt() ->> 'sub'));

-- SELECT policy
CREATE POLICY "Users can view shared restaurants they have access to" ON shared_restaurants
    FOR SELECT USING (
        is_public = true
        OR created_by = (auth.jwt() ->> 'sub')
        OR EXISTS (
            SELECT 1 FROM shared_restaurant_users sru
            WHERE sru.shared_restaurant_id = id
            AND sru.user_id = (auth.jwt() ->> 'sub')
        )
    );

-- Policies for shared_restaurant_users

DROP POLICY IF EXISTS "Creators can manage users of their shares" ON shared_restaurant_users;
DROP POLICY IF EXISTS "Users can view their own assignment" ON shared_restaurant_users;

-- Creator of the share can manage users (Uses Security Definer function to avoid recursion)
CREATE POLICY "Creators can manage users of their shares" ON shared_restaurant_users
    FOR ALL USING (
        check_shared_restaurant_creator(shared_restaurant_id)
    );

CREATE POLICY "Users can view their own assignment" ON shared_restaurant_users
    FOR SELECT USING (user_id = (auth.jwt() ->> 'sub'));


-- UPDATE EXISTING TABLES POLICIES TO ALLOW READ ACCESS

-- 1. Restaurants
DROP POLICY IF EXISTS "Users can view restaurants via share" ON restaurants;
CREATE POLICY "Users can view restaurants via share" ON restaurants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shared_restaurants sr
            WHERE sr.restaurant_id = id
            AND (
                sr.is_public = true
                OR sr.created_by = (auth.jwt() ->> 'sub')
                OR EXISTS (
                    SELECT 1 FROM shared_restaurant_users sru
                    WHERE sru.shared_restaurant_id = sr.id
                    AND sru.user_id = (auth.jwt() ->> 'sub')
                )
            )
        )
    );

-- 2. Photos
DROP POLICY IF EXISTS "Users can view photos via share" ON photos;
CREATE POLICY "Users can view photos via share" ON photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM restaurants r
            WHERE r.id = restaurant_id
            AND EXISTS (
                SELECT 1 FROM shared_restaurants sr
                WHERE sr.restaurant_id = r.id
                AND (
                    sr.is_public = true
                    OR sr.created_by = (auth.jwt() ->> 'sub')
                    OR EXISTS (
                        SELECT 1 FROM shared_restaurant_users sru
                        WHERE sru.shared_restaurant_id = sr.id
                        AND sru.user_id = (auth.jwt() ->> 'sub')
                    )
                )
            )
        )
    );

-- 3. Ratings
DROP POLICY IF EXISTS "Users can view ratings via share" ON ratings;
CREATE POLICY "Users can view ratings via share" ON ratings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM restaurants r
            WHERE r.id = restaurant_id
            AND EXISTS (
                SELECT 1 FROM shared_restaurants sr
                WHERE sr.restaurant_id = r.id
                AND (
                    sr.is_public = true
                    OR sr.created_by = (auth.jwt() ->> 'sub')
                    OR EXISTS (
                        SELECT 1 FROM shared_restaurant_users sru
                        WHERE sru.shared_restaurant_id = sr.id
                        AND sru.user_id = (auth.jwt() ->> 'sub')
                    )
                )
            )
        )
    );

-- 4. Comments
DROP POLICY IF EXISTS "Users can view comments via share" ON comments;
CREATE POLICY "Users can view comments via share" ON comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM restaurants r
            WHERE r.id = restaurant_id
            AND EXISTS (
                SELECT 1 FROM shared_restaurants sr
                WHERE sr.restaurant_id = r.id
                AND (
                    sr.is_public = true
                    OR sr.created_by = (auth.jwt() ->> 'sub')
                    OR EXISTS (
                        SELECT 1 FROM shared_restaurant_users sru
                        WHERE sru.shared_restaurant_id = sr.id
                        AND sru.user_id = (auth.jwt() ->> 'sub')
                    )
                )
            )
        )
    );
