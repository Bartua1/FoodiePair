-- Disable RLS on shared tables to allow development/testing without valid JWT logic
ALTER TABLE shared_restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_restaurant_users DISABLE ROW LEVEL SECURITY;
