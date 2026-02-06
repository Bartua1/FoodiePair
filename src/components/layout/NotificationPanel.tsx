import { Star, Utensils, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Restaurant } from '../../types';

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    unratedRestaurants: Restaurant[];
}

export function NotificationPanel({ isOpen, onClose, unratedRestaurants }: NotificationPanelProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="absolute top-full right-0 mt-3 w-[320px] max-h-[480px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-[100] animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Bell size={18} className="shrink-0 text-orange-500" />
                    {t('notifications.title', 'Notificaciones')}
                    <span className="bg-orange-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-sm">
                        {unratedRestaurants.length}
                    </span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {unratedRestaurants.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <Bell size={24} className="shrink-0 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium px-6">
                            {t('notifications.empty', '¡Estás al día! No tienes restaurantes pendientes de puntuar.')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
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
            </div>

            {unratedRestaurants.length > 0 && (
                <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        {t('notifications.footer', 'Tu opinión importa')}
                    </p>
                </div>
            )}
        </div>
    );
}
