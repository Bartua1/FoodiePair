import { useState } from 'react';
import { Menu, X, List, Map as MapIcon, BarChart2, Settings, Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

export function NavigationFAB() {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: '/', icon: List, label: 'Feed' },
        { id: '/togo', icon: Bookmark, label: t('wishlist.toGo') },
        { id: '/map', icon: MapIcon, label: 'Map' },
        { id: '/stats', icon: BarChart2, label: t('nav.stats') },
        { id: '/settings', icon: Settings, label: t('nav.settings') },
    ];

    const currentPath = location.pathname;

    const handleSelect = (id: string) => {
        navigate(id);
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-6 left-6 z-[2000] flex flex-col items-start gap-4">
            <div className={`flex flex-col gap-3 transition-all duration-300 origin-bottom-left ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-10 pointer-events-none absolute bottom-0 left-0'}`}>
                {tabs.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => handleSelect(id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-full shadow-lg transition-all transform hover:scale-105 ${currentPath === id
                            ? 'bg-pastel-peach text-slate-900 font-bold ring-2 ring-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium whitespace-nowrap opacity-100 ml-1">
                            {label}
                        </span>
                    </button>
                ))}
            </div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center transition-all duration-500 hover:scale-105 active:scale-95 relative overflow-hidden ${isOpen ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'
                    }`}
                aria-label="Menu"
            >
                <div className={`transition-all duration-500 absolute inset-0 flex items-center justify-center ${isOpen ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`}>
                    <Menu className="w-7 h-7" />
                </div>
                <div className={`transition-all duration-500 absolute inset-0 flex items-center justify-center ${isOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`}>
                    <X className="w-7 h-7" />
                </div>
            </button>

            {/* Backdrop for mobile to close when clicking outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-[-1]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
