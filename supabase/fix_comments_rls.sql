-- Drop the existing policy
DROP POLICY IF EXISTS "Users can manage comments in their pair" ON comments;

-- Disable RLS on the table
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
