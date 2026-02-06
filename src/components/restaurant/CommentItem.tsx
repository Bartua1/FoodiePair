import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCommentLikes } from '../../hooks/useCommentLikes';
import type { Comment, Profile } from '../../types';

interface CommentItemProps {
    comment: Comment;
    isMe: boolean;
    profile: Profile | undefined;
}

export function CommentItem({ comment, isMe, profile }: CommentItemProps) {
    const { t } = useTranslation();
    const { likesCount, hasLiked, toggleLike } = useCommentLikes(comment.id);
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);

    const handleDoubleTap = () => {
        if (isMe) return; // Prevent liking own comment

        toggleLike();
        if (!hasLiked) {
            setShowHeartAnimation(true);
            setTimeout(() => setShowHeartAnimation(false), 800);
        }
    };

    return (
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
            <div
                className={`p-3 rounded-2xl max-w-[80%] text-sm relative group select-none transition-transform ${isMe ? 'bg-pastel-blue text-slate-800 rounded-br-none' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none cursor-pointer active:scale-[0.98]'}`}
                onDoubleClick={handleDoubleTap}
            >
                {comment.content}

                {/* Heart Pop Animation */}
                {showHeartAnimation && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-out-0 duration-500">
                        <Heart size={48} className="text-white fill-white drop-shadow-md" />
                    </div>
                )}

                {/* Like Status Indicator */}
                {(likesCount > 0 || hasLiked) && (
                    <div className={`absolute -bottom-2 ${isMe ? '-left-2' : '-right-2'} bg-white border border-slate-50 shadow-sm rounded-full px-1.5 py-0.5 flex items-center gap-1 z-10 animate-in fade-in zoom-in duration-300`}>
                        <Heart size={10} className={`transition-colors ${hasLiked ? 'text-red-500 fill-red-500' : 'text-slate-300'}`} />
                        {likesCount > 0 && <span className="text-[9px] font-bold text-slate-500">{likesCount}</span>}
                    </div>
                )}
            </div>
            <span className="text-[10px] text-slate-400 mt-2 px-1">
                {profile?.display_name || t('restaurant.user')} • {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );
}
