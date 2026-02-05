-- Add visit_status column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS visit_status TEXT DEFAULT 'visited' CHECK (visit_status IN ('visited', 'wishlist'));
