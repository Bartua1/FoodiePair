import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '@clerk/clerk-react';

export function useCommentLikes(commentId: string) {
    const { userId } = useAuth();
    const [likesCount, setLikesCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchLikes = async () => {
        if (!userId) return;

        // Get total likes
        const { count, error } = await supabase
            .from('comment_likes')
            .select('*', { count: 'exact', head: true })
            .eq('comment_id', commentId);

        if (!error && count !== null) {
            setLikesCount(count);
        }

        // Check if user has liked
        const { data: userLike } = await supabase
            .from('comment_likes')
            .select('*')
            .eq('comment_id', commentId)
            .eq('user_id', userId)
            .single();

        setHasLiked(!!userLike);
        setLoading(false);
    };

    const toggleLike = async () => {
        if (!userId) return;

        // Optimistic update
        const previousLiked = hasLiked;
        const previousCount = likesCount;

        setHasLiked(!previousLiked);
        setLikesCount(prev => previousLiked ? prev - 1 : prev + 1);

        if (previousLiked) {
            // Unlike
            const { error } = await supabase
                .from('comment_likes')
                .delete()
                .eq('comment_id', commentId)
                .eq('user_id', userId);

            if (error) {
                // Revert
                setHasLiked(previousLiked);
                setLikesCount(previousCount);
            }
        } else {
            // Like
            const { error } = await supabase
                .from('comment_likes')
                .insert({
                    comment_id: commentId,
                    user_id: userId
                });

            if (error) {
                // Revert
                setHasLiked(previousLiked);
                setLikesCount(previousCount);
            }
        }
    };

    useEffect(() => {
        fetchLikes();

        // Subscribe to changes for this comment
        const channel = supabase
            .channel(`likes:${commentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comment_likes',
                    filter: `comment_id=eq.${commentId}`
                },
                () => {
                    fetchLikes();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [commentId, userId]);

    return { likesCount, hasLiked, toggleLike, loading };
}
