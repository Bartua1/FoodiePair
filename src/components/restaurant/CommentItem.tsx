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

    return (
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
            <div className={`p-3 rounded-2xl max-w-[80%] text-sm relative group ${isMe ? 'bg-pastel-blue text-slate-800 rounded-br-none' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'}`}>
                {comment.content}

                {/* Like Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleLike();
                    }}
                    className={`absolute -bottom-3 ${isMe ? '-left-3' : '-right-3'} bg-white border border-slate-100 shadow-sm rounded-full px-1.5 py-0.5 flex items-center gap-1 transition-all active:scale-95 z-10 ${hasLiked ? 'text-red-500' : 'text-slate-400'}`}
                >
                    <Heart size={10} fill={hasLiked ? 'currentColor' : 'none'} className="transition-all" />
                    {likesCount > 0 && <span className="text-[9px] font-bold">{likesCount}</span>}
                </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 px-1">
                {profile?.display_name || t('restaurant.user')} • {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );
}
