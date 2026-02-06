-- Update handle_new_comment_notification to include commenter details
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
    commenter_name TEXT;
    commenter_avatar TEXT;
BEGIN
    commenter_id := NEW.user_id;
    
    SELECT * INTO restaurant_rec FROM restaurants WHERE id = NEW.restaurant_id;
    
    IF restaurant_rec IS NULL THEN 
        RETURN NEW; 
    END IF;

    SELECT * INTO pair_rec FROM pairs WHERE id = restaurant_rec.pair_id;

    IF pair_rec IS NULL THEN
        RETURN NEW;
    END IF;

    -- Determine partner ID
    IF pair_rec.user1_id = commenter_id THEN
        partner_id := pair_rec.user2_id;
    ELSE
        partner_id := pair_rec.user1_id;
    END IF;

    -- Get commenter details
    SELECT display_name, avatar_url INTO commenter_name, commenter_avatar FROM profiles WHERE id = commenter_id;

    IF partner_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, message, restaurant_id, data)
        VALUES (
            partner_id,
            'new_comment',
            coalesce(commenter_name, 'Someone') || ' commented on ' || restaurant_rec.name,
            NEW.restaurant_id,
            jsonb_build_object(
                'restaurant_name', restaurant_rec.name,
                'commenter_name', coalesce(commenter_name, 'Someone'),
                'commenter_avatar', commenter_avatar
            )
        );
    END IF;

    RETURN NEW;
END;
$$;
