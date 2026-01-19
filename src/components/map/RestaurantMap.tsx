import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Restaurant } from '../../types';
import { Star, Heart } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useEffect } from 'react';

// Fix for default Leaflet icon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom markers using Lucide
const createCustomIcon = (isFavorite: boolean) => {
    const color = isFavorite ? '#FCE4EC' : '#FFECB3'; // Pastel Pink for favorites, Peach for others
    const iconMarkup = renderToStaticMarkup(
        <div style={{
            backgroundColor: color,
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '2px solid white'
        }}>
            {isFavorite ? <Heart size={20} fill="#E91E63" color="#E91E63" /> : <Star size={20} fill="#FF9800" color="#FF9800" />}
        </div>
    );

    return L.divIcon({
        html: iconMarkup,
        className: 'custom-leaflet-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
    });
};

interface RestaurantMapProps {
    restaurants: (Restaurant & { avg_score?: number })[];
    userLocation?: { lat: number; lng: number } | null;
}

export function RestaurantMap({ restaurants, userLocation }: RestaurantMapProps) {
    const center: [number, number] = restaurants.length > 0
        ? [restaurants[0].lat, restaurants[0].lng]
        : userLocation
            ? [userLocation.lat, userLocation.lng]
            : [40.4168, -3.7038]; // Default to Madrid if no restaurants and no location

    return (
        <div className="h-full w-full">
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {userLocation && (
                    <CircleMarker
                        center={[userLocation.lat, userLocation.lng]}
                        radius={8}
                        pathOptions={{
                            fillColor: '#4285F4',
                            fillOpacity: 1,
                            color: 'white',
                            weight: 2,
                        }}
                    >
                        <Popup>You are here</Popup>
                    </CircleMarker>
                )}

                {restaurants.map((r) => (
                    <Marker
                        key={r.id}
                        position={[r.lat, r.lng]}
                        icon={createCustomIcon(r.is_favorite)}
                    >
                        <Popup className="custom-popup">
                            <div className="p-2 min-w-[150px]">
                                <h3 className="font-bold text-slate-800 text-lg mb-1">{r.name}</h3>
                                <div className="flex items-center gap-1 mb-2">
                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                    <span className="font-bold text-slate-700">{r.avg_score?.toFixed(1) || 'N/A'}</span>
                                    <span className="text-slate-400 text-xs text-uppercase ml-auto uppercase font-medium">{r.cuisine_type}</span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2">{r.address}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <MapUpdater center={center} />
            </MapContainer>
        </div>
    );
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
        // Ensure tiles are correctly loaded when container size changes
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [center, map]);
    return null;
}
