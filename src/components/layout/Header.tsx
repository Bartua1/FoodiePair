import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { NotificationPanel } from './NotificationPanel';
import type { Restaurant } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';

interface HeaderProps {
    unratedRestaurants: Restaurant[];
}

export function Header({ unratedRestaurants }: HeaderProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    const totalNotifications = unratedRestaurants.length + unreadCount;

    return (
        <header className="p-4 bg-white/80 backdrop-blur-md border-b border-pastel-mint flex items-center justify-between sticky top-0 z-50 flex-none">
            <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate('/')}
            >
                <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 700, fontSize: '24px', color: '#111827' }}>
                    Foodie<span style={{ fontFamily: 'sans-serif', color: '#f97316', fontStyle: 'normal' }}>.</span>
                </div>
            </div>

            <div className="flex items-center gap-3 relative">
                <SignedIn>
                    <div className="relative group">
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="relative w-10 h-10 flex items-center justify-center text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 hover:text-slate-900 rounded-full transition-all shadow-sm active:scale-95 z-20"
                            aria-label="Notifications"
                        >
                            <Bell
                                size={20}
                                className={`shrink-0 transition-all ${isNotificationsOpen ? 'fill-orange-500 stroke-orange-500' : 'fill-none stroke-slate-600'}`}
                                strokeWidth={2.5}
                            />
                            {totalNotifications > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white border-2 border-white shadow-md animate-in zoom-in">
                                    {totalNotifications}
                                </span>
                            )}
                        </button>

                        <NotificationPanel
                            isOpen={isNotificationsOpen}
                            onClose={() => setIsNotificationsOpen(false)}
                            unratedRestaurants={unratedRestaurants}
                            notifications={notifications}
                            onMarkAsRead={markAsRead}
                            onMarkAllAsRead={markAllAsRead}
                        />
                    </div>

                    <div className="w-10 h-10 flex items-center justify-center overflow-hidden border border-slate-300 bg-slate-200 rounded-full shadow-sm hover:border-slate-400 transition-all cursor-pointer ring-offset-2 hover:ring-2 ring-pastel-peach/50 active:scale-95">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </SignedIn>

                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="px-4 py-2 bg-pastel-peach border border-orange-200 rounded-full font-bold text-slate-800 text-sm shadow-sm hover:scale-[1.02] transition-all">
                            {t('app.signIn')}
                        </button>
                    </SignInButton>
                </SignedOut>
            </div>
        </header>
    );
}
