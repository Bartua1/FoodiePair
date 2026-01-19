import { Heart } from 'lucide-react';

interface FilterBarProps {
    filters: {
        distance: string;
        price: number | null;
        favoritesOnly: boolean;
        cuisine: string;
    };
    setFilters: (filters: any) => void;
    cuisines: string[];
}

export function FilterBar({ filters, setFilters, cuisines }: FilterBarProps) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-4 px-1 no-scrollbar scroll-smooth">
            {/* Favorites Toggle */}
            <button
                onClick={() => setFilters({ ...filters, favoritesOnly: !filters.favoritesOnly })}
                className={`flex-none flex items-center gap-1 px-4 py-2 rounded-full border text-sm font-medium transition-all ${filters.favoritesOnly
                        ? 'bg-pastel-pink border-pastel-pink text-slate-800'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
            >
                <Heart size={14} className={filters.favoritesOnly ? 'fill-red-500 text-red-500' : ''} />
                Favorites
            </button>

            {/* Distance Filter */}
            <select
                value={filters.distance}
                onChange={(e) => setFilters({ ...filters, distance: e.target.value })}
                className="flex-none px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-500 outline-none focus:ring-2 focus:ring-pastel-mint"
            >
                <option value="any">Any Distance</option>
                <option value="1">{"< 1km"}</option>
                <option value="5">{"< 5km"}</option>
            </select>

            {/* Price Filter */}
            <div className="flex-none flex bg-white border border-slate-200 rounded-full p-1">
                {[1, 2, 3].map((p) => (
                    <button
                        key={p}
                        onClick={() => setFilters({ ...filters, price: filters.price === p ? null : p })}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${filters.price === p
                                ? 'bg-pastel-yellow text-slate-800'
                                : 'text-slate-300'
                            }`}
                    >
                        {'€'.repeat(p)}
                    </button>
                ))}
            </div>

            {/* Cuisine Filter */}
            <select
                value={filters.cuisine}
                onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
                className="flex-none px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-500 outline-none focus:ring-2 focus:ring-pastel-mint"
            >
                <option value="all">All Cuisines</option>
                {cuisines.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
        </div>
    );
}
