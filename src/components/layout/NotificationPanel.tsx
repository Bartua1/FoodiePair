import { Star, Utensils, Bell, MessageCircle, Heart, CheckCircle2 } from 'lucide-react';
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
    const totalCount = unratedRestaurants.length + unreadNotificationsCount;

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
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-white">
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
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-white">
                        <MessageCircle size={10} className="text-pastel-blue-dark fill-pastel-blue-dark" />
                    </div>
                </div>
            );
        }

        switch (notification.type) {
            case 'restaurant_match': return <Utensils className="w-5 h-5 text-pastel-mint-dark" />;
            case 'new_comment': return <MessageCircle className="w-5 h-5 text-pastel-blue-dark" />;
            case 'comment_liked': return <Heart className="w-5 h-5 text-pastel-pink-dark" />;
            default: return <Bell className="w-5 h-5 text-slate-500" />;
        }
    };

    const getBgColor = (type: Notification['type']) => {
        switch (type) {
            case 'restaurant_match': return 'bg-pastel-mint';
            case 'new_comment': return 'bg-pastel-blue';
            case 'comment_liked': return 'bg-pastel-pink';
            default: return 'bg-slate-100';
        }
    };

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[95vw] sm:absolute sm:top-full sm:right-0 sm:left-auto sm:translate-x-0 sm:w-[360px] sm:mt-3 max-h-[80vh] sm:max-h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-[100] animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Bell size={18} className="shrink-0 text-orange-500" />
                    {t('notifications.title', 'Notificaciones')}
                    {totalCount > 0 && (
                        <span className="bg-orange-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-sm">
                            {totalCount}
                        </span>
                    )}
                </h3>
                {unreadNotificationsCount > 0 && onMarkAllAsRead && (
                    <button
                        onClick={onMarkAllAsRead}
                        className="px-3 py-1 bg-pastel-blue/20 text-pastel-blue-dark hover:bg-pastel-blue/30 rounded-full text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                        <CheckCircle2 size={14} />
                        {t('notifications.markAllRead', 'Marcar leídas')}
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                {unratedRestaurants.length === 0 && notifications.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <Bell size={24} className="shrink-0 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium px-6">
                            {t('notifications.empty', '¡Estás al día! No tienes nuevas notificaciones.')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Section: Pending Ratings */}
                        {unratedRestaurants.length > 0 && (
                            <div className="space-y-1">
                                <h4 className="px-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('notifications.pending', 'Pendientes')}</h4>
                                {unratedRestaurants.map((restaurant) => (
                                    <button
                                        key={restaurant.id}
                                        onClick={() => {
                                            navigate(`/restaurant/${restaurant.id}`);
                                            onClose();
                                        }}
                                        className="w-full p-3 flex items-start gap-3 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl transition-all group text-left shadow-sm"
                                    >
                                        <div className="w-10 h-10 bg-pastel-peach rounded-xl flex-none flex items-center justify-center text-slate-800 shadow-sm group-hover:scale-105 transition-transform">
                                            <Utensils className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 text-sm truncate mb-0.5">
                                                {restaurant.name}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 font-medium">
                                                {t('notifications.pendingRating', 'Pendiente de puntuar')}
                                            </p>
                                        </div>
                                        <div className="flex-none self-center">
                                            <Star size={16} className="text-orange-200 group-hover:text-orange-400 transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Section: Recent Notifications */}
                        {notifications.length > 0 && (
                            <div className="space-y-1">
                                {unratedRestaurants.length > 0 && <div className="h-px bg-slate-100 my-2" />}
                                <h4 className="px-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('notifications.recent', 'Recientes')}</h4>
                                {notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full p-3 flex items-start gap-3 border hover:scale-[1.02] active:scale-[0.98] rounded-2xl transition-all group text-left ${notification.read ? 'bg-white border-slate-100 opacity-70' : 'bg-blue-50/50 border-blue-100'}`}
                                    >
                                        <div className={`w-10 h-10 ${getBgColor(notification.type)} rounded-xl flex-none flex items-center justify-center text-slate-800 shadow-sm group-hover:scale-105 transition-transform`}>
                                            {getIcon(notification)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 text-sm leading-snug mb-1">
                                                {t(`notifications.${notification.type}`, notification.data || { defaultValue: notification.message }) as string}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold">
                                                {new Intl.DateTimeFormat(i18n.language || 'es', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(notification.created_at))}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-none self-start mt-2" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-3 bg-slate-50 text-center border-t border-slate-100 sticky bottom-0 z-10">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Foodie Pair Interactions
                </p>
            </div>
        </div>
    );
}

