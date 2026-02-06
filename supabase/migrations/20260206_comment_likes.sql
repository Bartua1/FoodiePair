-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, comment_id)
);

-- Enable RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can like comments" ON comment_likes
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can unlike comments" ON comment_likes
    FOR DELETE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view likes" ON comment_likes
    FOR SELECT USING (true); -- Publicly visible to count likes

-- Trigger Function: handle_comment_like_notification
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
    -- Get comment details
    SELECT user_id, content, restaurant_id INTO comment_author_id, comment_content, restaurant_ref 
    FROM comments 
    WHERE id = NEW.comment_id;

    -- Don't notify if liking own comment
    IF comment_author_id = NEW.user_id THEN
        RETURN NEW;
    END IF;

    -- Insert notification for the author
    INSERT INTO notifications (user_id, type, message, restaurant_id)
    VALUES (
        comment_author_id,
        'comment_liked',
        'Someone liked your comment: "' || left(comment_content, 20) || '..."',
        restaurant_ref
    );

    RETURN NEW;
END;
$$;

-- Trigger: on_comment_like
DROP TRIGGER IF EXISTS on_comment_like ON comment_likes;
CREATE TRIGGER on_comment_like
    AFTER INSERT ON comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION handle_comment_like_notification();
