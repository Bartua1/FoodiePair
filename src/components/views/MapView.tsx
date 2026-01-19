import { RestaurantMap } from '../map/RestaurantMap';
import { FilterBar } from '../feed/FilterBar';

interface MapViewProps {
    restaurants: any[];
    filters: any;
    setFilters: (filters: any) => void;
    cuisines: string[];
}

export function MapView({ restaurants, filters, setFilters, cuisines }: MapViewProps) {
    return (
        <div className="flex-1 relative">
            <RestaurantMap restaurants={restaurants} />
            <div className="absolute top-4 left-4 right-4 z-[1000]">
                <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl shadow-lg border border-white/50">
                    <FilterBar
                        filters={filters}
                        setFilters={setFilters}
                        cuisines={cuisines}
                    />
                </div>
            </div>
        </div>
    );
}
