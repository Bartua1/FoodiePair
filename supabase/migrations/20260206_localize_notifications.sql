-- Add data column to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB;

-- Update Trigger Function: handle_new_restaurant_notification
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
    container_pair_id := NEW.pair_id;
    creator_id := NEW.created_by;
    restaurant_name := NEW.name;

    IF creator_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT 
        CASE 
            WHEN user1_id = creator_id THEN user2_id 
            WHEN user2_id = creator_id THEN user1_id 
        END INTO partner_id
    FROM pairs
    WHERE id = container_pair_id;

    IF partner_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, message, restaurant_id, data)
        VALUES (
            partner_id,
            'restaurant_match',
            'New restaurant added: ' || restaurant_name || '. Check it out!',
            NEW.id,
            jsonb_build_object('restaurant_name', restaurant_name)
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Update Trigger Function: handle_new_comment_notification
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
    
    SELECT * INTO restaurant_rec FROM restaurants WHERE id = NEW.restaurant_id;
    
    IF restaurant_rec IS NULL THEN 
        RETURN NEW; 
    END IF;

    SELECT * INTO pair_rec FROM pairs WHERE id = restaurant_rec.pair_id;

    IF pair_rec IS NULL THEN
        RETURN NEW;
    END IF;

    IF pair_rec.user1_id = commenter_id THEN
        partner_id := pair_rec.user2_id;
    ELSE
        partner_id := pair_rec.user1_id;
    END IF;

    IF partner_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, message, restaurant_id, data)
        VALUES (
            partner_id,
            'new_comment',
            'New comment on ' || restaurant_rec.name,
            NEW.restaurant_id,
            jsonb_build_object('restaurant_name', restaurant_rec.name)
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Update Trigger Function: handle_comment_like_notification
CREATE OR REPLACE FUNCTION handle_comment_like_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    comment_author_id TEXT;
    comment_content TEXT;
    restaurant_ref UUID;
BEGIN
    SELECT user_id, content, restaurant_id INTO comment_author_id, comment_content, restaurant_ref 
    FROM comments 
    WHERE id = NEW.comment_id;

    IF comment_author_id = NEW.user_id THEN
        RETURN NEW;
    END IF;

    INSERT INTO notifications (user_id, type, message, restaurant_id, data)
    VALUES (
        comment_author_id,
        'comment_liked',
        'Someone liked your comment: "' || left(comment_content, 20) || '..."',
        restaurant_ref,
        jsonb_build_object('comment_preview', left(comment_content, 20) || '...')
    );

    RETURN NEW;
END;
$$;
