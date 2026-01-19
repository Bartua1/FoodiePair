-- Tables for FoodiePair

-- 1. Pairs table
CREATE TABLE pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id TEXT NOT NULL,
    user2_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profiles table (linked to Clerk)
CREATE TABLE profiles (
    id TEXT PRIMARY KEY, -- matches Clerk user_id
    pair_id UUID REFERENCES pairs(id),
    display_name TEXT,
    language TEXT DEFAULT 'es',
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Restaurants table
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair_id UUID REFERENCES pairs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    cuisine_type TEXT,
    price_range INT CHECK (price_range BETWEEN 1 AND 3),
    lat FLOAT8,
    lng FLOAT8,
    is_favorite BOOLEAN DEFAULT false,
    visit_date DATE,
    general_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ratings table
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    food_score FLOAT NOT NULL,
    service_score FLOAT NOT NULL,
    vibe_score FLOAT NOT NULL,
    price_quality_score FLOAT NOT NULL,
    favorite_dish TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Photos table
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can read/write their own profile
CREATE POLICY "Users can manage their own profile" ON profiles
    FOR ALL USING (id = auth.uid()::text);

-- Users can read their pair info
CREATE POLICY "Users can read their pair" ON pairs
    FOR SELECT USING (user1_id = auth.uid()::text OR user2_id = auth.uid()::text);

-- Users can manage restaurants for their pair
CREATE POLICY "Users can manage restaurants in their pair" ON restaurants
    FOR ALL USING (
        pair_id IN (
            SELECT pair_id FROM profiles WHERE id = auth.uid()::text
        )
    );

-- Similar for ratings and photos
CREATE POLICY "Users can manage ratings in their pair" ON ratings
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE pair_id IN (
                SELECT pair_id FROM profiles WHERE id = auth.uid()::text
            )
        )
    );

CREATE POLICY "Users can manage photos in their pair" ON photos
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE pair_id IN (
                SELECT pair_id FROM profiles WHERE id = auth.uid()::text
            )
        )
    );
