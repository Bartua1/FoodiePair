-- Update the restaurant-photos bucket to have a long-lived cache by default
-- This ensures that browsers and CDNs cache the images for a long time.
-- Note: '31536000' is 1 year in seconds.

UPDATE storage.buckets
SET cache_control = 'max-age=31536000, public, immutable'
WHERE id = 'restaurant-photos';
