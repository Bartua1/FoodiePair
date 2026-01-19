import { List, Map as MapIcon, BarChart2, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type ViewType = 'feed' | 'map' | 'stats' | 'settings';

interface TabNavigationProps {
    view: ViewType;
    setView: (view: ViewType) => void;
}

export function TabNavigation({ view, setView }: TabNavigationProps) {
    const { t } = useTranslation();

    const tabs = [
        { id: 'feed', icon: List, label: 'Feed' }, // Label hardcoded as in original App.tsx
        { id: 'map', icon: MapIcon, label: 'Map' }, // Label hardcoded as in original App.tsx
        { id: 'stats', icon: BarChart2, label: t('nav.stats') },
        { id: 'settings', icon: Settings, label: t('nav.settings') },
    ];

    return (
        <div className="p-4 pt-2 bg-white border-t border-slate-100 flex justify-around gap-2 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {tabs.map(({ id, icon: Icon, label }) => (
                <button
                    key={id}
                    onClick={() => setView(id as ViewType)}
                    className={`flex-1 max-w-[100px] flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === id
                            ? 'bg-pastel-peach text-slate-800 shadow-sm'
                            : 'text-slate-400'
                        }`}
                >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                </button>
            ))}
        </div>
    );
}
