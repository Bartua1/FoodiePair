-- Update handle_comment_like_notification to personalize message
CREATE OR REPLACE FUNCTION handle_comment_like_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    comment_author_id TEXT;
    comment_content TEXT;
    restaurant_ref UUID;
    liker_name TEXT;
BEGIN
    -- Get comment details
    SELECT user_id, content, restaurant_id INTO comment_author_id, comment_content, restaurant_ref 
    FROM comments 
    WHERE id = NEW.comment_id;

    -- Don't notify if liking own comment
    IF comment_author_id = NEW.user_id THEN
        RETURN NEW;
    END IF;

    -- Get liker name (default to 'Someone' if not found)
    SELECT display_name INTO liker_name FROM profiles WHERE id = NEW.user_id;

    -- Insert notification with personalized data
    INSERT INTO notifications (user_id, type, message, restaurant_id, data)
    VALUES (
        comment_author_id,
        'comment_liked',
        coalesce(liker_name, 'Someone') || ' liked your comment: "' || left(comment_content, 20) || '..."',
        restaurant_ref,
        jsonb_build_object(
            'comment_preview', left(comment_content, 20) || '...',
            'liker_id', NEW.user_id,
            'comment_id', NEW.comment_id,
            'liker_name', coalesce(liker_name, 'Someone')
        )
    );

    RETURN NEW;
END;
$$;
