import { Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function RestaurantFAB() {
    const setIsDrawerOpen = useAppStore(state => state.setIsDrawerOpen);

    return (
        <button
            onClick={() => setIsDrawerOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-pastel-peach shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
            aria-label="Add restaurant"
        >
            <Plus className="w-8 h-8 text-slate-800 group-hover:rotate-90 transition-transform duration-300" />
        </button>
    );
}
