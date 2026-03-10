import { Star, Utensils, Bell, MessageCircle, Heart, CheckCircle2, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Restaurant, Notification } from '../../types';


interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    unratedRestaurants: Restaurant[];
    notifications?: Notification[];
    onMarkAsRead?: (id: string) => void;
    onMarkAllAsRead?: () => void;
}

export function NotificationPanel({ isOpen, onClose, unratedRestaurants, notifications = [], onMarkAsRead, onMarkAllAsRead }: NotificationPanelProps) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const unreadNotificationsCount = notifications.filter(n => !n.read).length;
    
    // Filter out restaurant_match notifications if the restaurant is already in unratedRestaurants (redundant)
    const filteredNotifications = notifications.filter(n => {
        if (n.type === 'restaurant_match' && n.restaurant_id) {
            return !unratedRestaurants.some(r => r.id === n.restaurant_id);
        }
        return true;
    });

    const totalCount = unratedRestaurants.length + filteredNotifications.filter(n => !n.read).length;

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read && onMarkAsRead) {
            onMarkAsRead(notification.id);
        }

        if (notification.restaurant_id) {
            navigate(`/restaurant/${notification.restaurant_id}`);
        }
        onClose();
    };

    const getIcon = (notification: Notification) => {
        if (notification.type === 'comment_liked' && notification.data?.liker_avatar) {
            return (
                <div className="relative w-full h-full">
                    <img
                        src={notification.data.liker_avatar}
                        alt="User"
                        className="w-full h-full object-cover rounded-xl"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 rounded-full p-0.5 shadow-sm border border-white dark:border-zinc-900">
                        <Heart size={10} className="text-pastel-pink-dark fill-pastel-pink-dark" />
                    </div>
                </div>
            );
        }

        if (notification.type === 'new_comment' && notification.data?.commenter_avatar) {
            return (
                <div className="relative w-full h-full">
                    <img
                        src={notification.data.commenter_avatar}
                        alt="User"
                        className="w-full h-full object-cover rounded-xl"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 rounded-full p-0.5 shadow-sm border border-white dark:border-zinc-900">
                        <MessageCircle size={10} className="text-pastel-blue-dark fill-pastel-blue-dark" />
                    </div>
                </div>
            );
        }

        switch (notification.type) {
            case 'restaurant_match': return <Utensils className="w-5 h-5 text-pastel-mint-dark" />;
            case 'new_comment': return <MessageCircle className="w-5 h-5 text-pastel-blue-dark" />;
            case 'comment_liked': return <Heart className="w-5 h-5 text-pastel-pink-dark" />;
            default: return <Bell className="w-5 h-5 text-slate-500 dark:text-zinc-400" />;
        }
    };

    const getBgColor = (type: Notification['type']) => {
        switch (type) {
            case 'restaurant_match': return 'bg-pastel-mint/20 dark:bg-pastel-mint/10';
            case 'new_comment': return 'bg-pastel-blue/20 dark:bg-pastel-blue/10';
            case 'comment_liked': return 'bg-pastel-pink/20 dark:bg-pastel-pink/10';
            default: return 'bg-slate-100 dark:bg-zinc-800';
        }
    };

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[95vw] sm:absolute sm:top-full sm:right-0 sm:left-auto sm:translate-x-0 sm:w-[380px] sm:mt-3 max-h-[80vh] sm:max-h-[550px] bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col z-[100] animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
                <h3 className="font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2.5 tracking-tight">
                    <Bell size={20} className="shrink-0 text-orange-500" />
                    {t('notifications.title', 'Notificaciones')}
                    {totalCount > 0 && (
                        <span className="bg-orange-600 dark:bg-orange-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-sm">
                            {totalCount}
                        </span>
                    )}
                </h3>
                {unreadNotificationsCount > 0 && onMarkAllAsRead && (
                    <button
                        onClick={onMarkAllAsRead}
                        className="px-3.5 py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                        <CheckCircle2 size={14} />
                        {t('notifications.markAllRead', 'Marcar leídas')}
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 scrollbar-hide space-y-6">
                {unratedRestaurants.length === 0 && filteredNotifications.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                            <Bell size={32} className="shrink-0 text-slate-200 dark:text-zinc-700" />
                        </div>
                        <h4 className="text-slate-800 dark:text-zinc-200 font-bold mb-1">{t('notifications.allCaughtUp', '¡Todo al día!')}</h4>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium px-8 leading-relaxed">
                            {t('notifications.empty', 'No tienes nuevas notificaciones por ahora.')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Section: Pending Ratings */}
                        {unratedRestaurants.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="px-3 text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">{t('notifications.pending', 'Pendientes')}</h4>
                                {unratedRestaurants.map((restaurant) => (
                                    <button
                                        key={restaurant.id}
                                        onClick={() => {
                                            navigate(`/restaurant/${restaurant.id}`);
                                            onClose();
                                        }}
                                        className="w-full p-3.5 flex items-start gap-3.5 bg-white dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-2xl transition-all group text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <div className="w-11 h-11 bg-pastel-peach rounded-[1.2rem] flex-none flex items-center justify-center text-slate-800 shadow-sm group-hover:scale-105 transition-transform dark:bg-orange-200">
                                            <Utensils className="w-5.5 h-5.5" />
                                        </div>
                                        <div className="flex-1 min-w-0 py-0.5">
                                            <h4 className="font-bold text-slate-800 dark:text-zinc-100 text-[14px] truncate mb-0.5">
                                                {restaurant.name}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-1">
                                                <Star size={10} className="text-orange-500" />
                                                {t('notifications.pendingRating', 'Pendiente de puntuar')}
                                            </p>
                                        </div>
                                        <div className="flex-none self-center h-8 w-8 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <ChevronRight size={18} className="text-orange-500" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Section: Recent Notifications */}
                        {filteredNotifications.length > 0 && (
                            <div className="space-y-2">
                                {unratedRestaurants.length > 0 && <div className="mx-3 h-px bg-slate-100 dark:bg-zinc-800/50 my-4" />}
                                <h4 className="px-3 text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.1em]">{t('notifications.recent', 'Recientes')}</h4>
                                {filteredNotifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full p-3.5 flex items-start gap-3.5 border hover:-translate-y-0.5 active:translate-y-0 rounded-2xl transition-all group text-left shadow-sm hover:shadow-md ${notification.read ? 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800/50 opacity-80' : 'bg-blue-50/40 dark:bg-blue-500/5 border-blue-100/50 dark:border-blue-500/20'}`}
                                    >
                                        <div className={`w-11 h-11 ${getBgColor(notification.type)} rounded-[1.2rem] flex-none flex items-center justify-center text-slate-800 dark:text-zinc-100 shadow-sm group-hover:scale-105 transition-transform`}>
                                            {getIcon(notification)}
                                        </div>
                                        <div className="flex-1 min-w-0 py-0.5">
                                            <p className="font-bold text-slate-800 dark:text-zinc-100 text-[13px] leading-tight mb-1">
                                                {t(`notifications.${notification.type}`, notification.data || { defaultValue: notification.message }) as string}
                                            </p>
                                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                                                {new Intl.DateTimeFormat(i18n.language || 'es', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(notification.created_at))}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] flex-none self-center" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-950 text-center border-t border-slate-100 dark:border-zinc-800 sticky bottom-0 z-10">
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-[0.2em] opacity-80">
                    Foodie Pair Interactions
                </p>
            </div>
        </div>
    );
}
