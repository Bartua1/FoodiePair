-- Drop the existing authenticated-only policy
DROP POLICY IF EXISTS "Authenticated Users can upload" ON storage.objects;

-- Create a new policy allowing public uploads (inserts) to the 'restaurant-photos' bucket
CREATE POLICY "Public Uploads" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'restaurant-photos'
    );
