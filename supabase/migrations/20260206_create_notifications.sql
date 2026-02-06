-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('pair_match', 'restaurant_match', 'restaurant_visit', 'restaurant_rating', 'new_comment', 'comment_liked')),
    message TEXT NOT NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL USING (user_id = auth.uid()::text);

-- Trigger Function: handle_new_restaurant_notification
-- When a user adds a restaurant, notify the OTHER user in the pair.
CREATE OR REPLACE FUNCTION handle_new_restaurant_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    container_pair_id UUID;
    creator_id TEXT;
    partner_id TEXT;
    restaurant_name TEXT;
BEGIN
    -- Get the restaurant details (using NEW record)
    container_pair_id := NEW.pair_id;
    creator_id := NEW.created_by; -- Assuming created_by exists from previous inspection
    restaurant_name := NEW.name;

    -- If created_by is null (legacy/error), try to infer or abort
    IF creator_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Find the partner ID from the pairs table
    SELECT 
        CASE 
            WHEN user1_id = creator_id THEN user2_id 
            WHEN user2_id = creator_id THEN user1_id 
        END INTO partner_id
    FROM pairs
    WHERE id = container_pair_id;

    -- Should be a valid partner to notify
    IF partner_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, message, restaurant_id)
        VALUES (
            partner_id,
            'restaurant_match', -- using 'restaurant_match' for new restaurant as per plan
            'New restaurant added: ' || restaurant_name || '. Check it out!',
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger: on_restaurant_created
DROP TRIGGER IF EXISTS on_restaurant_created ON restaurants;
CREATE TRIGGER on_restaurant_created
    AFTER INSERT ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_restaurant_notification();


-- Trigger Function: handle_new_comment_notification
-- When a user comments, notify the OTHER user in the pair.
CREATE OR REPLACE FUNCTION handle_new_comment_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    restaurant_rec RECORD;
    pair_rec RECORD;
    partner_id TEXT;
    commenter_id TEXT;
BEGIN
    commenter_id := NEW.user_id;
    
    -- Get restaurant info to find the pair_id
    SELECT * INTO restaurant_rec FROM restaurants WHERE id = NEW.restaurant_id;
    
    IF restaurant_rec IS NULL THEN 
        RETURN NEW; 
    END IF;

    -- Find the partner from the pairs table using the restaurant's pair_id
    SELECT * INTO pair_rec FROM pairs WHERE id = restaurant_rec.pair_id;

    IF pair_rec IS NULL THEN
        RETURN NEW;
    END IF;

    IF pair_rec.user1_id = commenter_id THEN
        partner_id := pair_rec.user2_id;
    ELSE
        partner_id := pair_rec.user1_id;
    END IF;

    -- Notify partner
    IF partner_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, message, restaurant_id)
        VALUES (
            partner_id,
            'new_comment',
            'New comment on ' || restaurant_rec.name,
            NEW.restaurant_id
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger: on_comment_created
DROP TRIGGER IF EXISTS on_comment_created ON comments;
CREATE TRIGGER on_comment_created
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_comment_notification();
