-- Update handle_comment_like_notification to store liker_id and comment_id
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
        jsonb_build_object(
            'comment_preview', left(comment_content, 20) || '...',
            'liker_id', NEW.user_id,
            'comment_id', NEW.comment_id
        )
    );

    RETURN NEW;
END;
$$;

-- Create function to remove notification on unlike
CREATE OR REPLACE FUNCTION handle_comment_unlike_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    comment_author_id TEXT;
BEGIN
    -- We need to find the author of the comment to know whose notification to delete
    SELECT user_id INTO comment_author_id
    FROM comments
    WHERE id = OLD.comment_id;
    
    -- Delete the specific notification
    DELETE FROM notifications
    WHERE user_id = comment_author_id
      AND type = 'comment_liked'
      AND data->>'liker_id' = OLD.user_id
      AND data->>'comment_id' = OLD.comment_id::text;

    RETURN OLD;
END;
$$;

-- Create trigger for unlike
DROP TRIGGER IF EXISTS on_comment_unlike ON comment_likes;
CREATE TRIGGER on_comment_unlike
    AFTER DELETE ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION handle_comment_unlike_notification();
