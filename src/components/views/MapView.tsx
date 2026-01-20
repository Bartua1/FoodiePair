import { RestaurantMap } from '../map/RestaurantMap';
import { FilterBar } from '../feed/FilterBar';
import { useAppStore } from '../../store/useAppStore';
import { useProcessedRestaurants } from '../../hooks/useProcessedRestaurants';

export function MapView() {
    // Store
    const filters = useAppStore(state => state.filters);
    const setFilters = useAppStore(state => state.setFilters);
    const userLocation = useAppStore(state => state.userLocation);

    // Processed data
    const { processedRestaurants, uniqueCuisines } = useProcessedRestaurants();

    return (
        <div className="flex-1 relative w-full h-full">
            <RestaurantMap restaurants={processedRestaurants} userLocation={userLocation} />
            <div className="absolute top-4 left-4 right-4 z-[1000]">
                <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl shadow-lg border border-white/50">
                    <FilterBar
                        filters={filters}
                        setFilters={setFilters}
                        cuisines={uniqueCuisines}
                    />
                </div>
            </div>
        </div>
    );
}
