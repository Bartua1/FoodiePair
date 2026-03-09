import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Restaurant } from '../../types';
import { Star, Heart, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useEffect } from 'react';
import MarkerClusterGroup from 'react-leaflet-cluster';

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
const createCustomIcon = (restaurant: Restaurant) => {
    const isVisited = restaurant.visit_status === 'visited';
    const isFavorite = restaurant.is_favorite;
    
    // Visited: Solid Green, Wishlist: Outlined Green (or translucent)
    const bgColor = isVisited ? '#4ADE80' : 'rgba(74, 222, 128, 0.2)'; 
    const iconColor = isVisited ? 'white' : '#166534';
    const borderColor = '#166534';

    const iconMarkup = renderToStaticMarkup(
        <div style={{
            position: 'relative',
            backgroundColor: bgColor,
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            border: `2px solid ${isVisited ? 'white' : borderColor}`,
            transition: 'all 0.2s ease-in-out'
        }}>
            <MapPin size={22} color={iconColor} fill={isVisited ? iconColor : 'none'} strokeWidth={isVisited ? 2.5 : 2} />
            
            {isFavorite && (
                <div style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    backgroundColor: '#EF4444',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    <Heart size={10} fill="white" color="white" />
                </div>
            )}
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
    onViewDetails?: (restaurant: Restaurant) => void;
}

export function RestaurantMap({ restaurants, userLocation, onViewDetails }: RestaurantMapProps) {
    const center: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : restaurants.length > 0
            ? [restaurants[0].lat, restaurants[0].lng]
            : [37.3890, -5.9949]; // Default to Seville if no restaurants and no location

    return (
        <div className="absolute inset-0 w-full h-full">
            <style>
                {`
                .leaflet-cluster-anim .leaflet-marker-icon, .leaflet-cluster-anim .leaflet-marker-shadow {
                    transition: transform 0.3s ease-out, opacity 0.3s ease-in;
                }
                .marker-cluster-small {
                    background-color: rgba(181, 226, 191, 0.6);
                }
                .marker-cluster-small div {
                    background-color: rgba(110, 204, 57, 0.6);
                }
                .marker-cluster-medium {
                    background-color: rgba(241, 211, 87, 0.6);
                }
                .marker-cluster-medium div {
                    background-color: rgba(240, 194, 12, 0.6);
                }
                .marker-cluster-large {
                    background-color: rgba(253, 156, 115, 0.6);
                }
                .marker-cluster-large div {
                    background-color: rgba(241, 128, 23, 0.6);
                }
                .marker-cluster {
                    background-clip: padding-box;
                    border-radius: 20px;
                }
                .marker-cluster div {
                    width: 30px;
                    height: 30px;
                    margin-left: 5px;
                    margin-top: 5px;
                    text-align: center;
                    border-radius: 15px;
                    font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
                    font-weight: bold;
                    display: flex;
                    alignItems: center;
                    justify-content: center;
                }
                .marker-cluster span {
                    line-height: 30px;
                }
                `}
            </style>
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

                <MarkerClusterGroup
                    chunkedLoading
                    maxClusterRadius={60}
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={false}
                >
                    {restaurants.map((r) => (
                        <Marker
                            key={r.id}
                            position={[r.lat, r.lng]}
                            icon={createCustomIcon(r)}
                        >
                            <Popup className="custom-popup">
                                <div className="p-2 min-w-[200px]">
                                    <h3 className="font-bold text-slate-800 text-lg mb-1 leading-tight">{r.name}</h3>
                                    <div className="flex items-center gap-1 mb-2">
                                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                        <span className="font-bold text-slate-700">{r.avg_score?.toFixed(1) || 'N/A'}</span>
                                        <span className="text-slate-400 text-[10px] uppercase ml-auto font-semibold bg-slate-100 px-2 py-0.5 rounded-full">{r.cuisine_type}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{r.address}</p>
                                    <div className="flex gap-2 text-[10px] mb-3">
                                        <span className={`px-2 py-0.5 rounded-full font-bold ${r.visit_status === 'visited' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {r.visit_status === 'visited' ? 'VISITADO' : 'PENDIENTE'}
                                        </span>
                                        {r.is_favorite && (
                                            <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                <Heart size={8} fill="currentColor" /> FAVORITO
                                            </span>
                                        )}
                                    </div>
                                    {onViewDetails && (
                                        <button
                                            onClick={() => onViewDetails(r)}
                                            className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 active:scale-[0.98] transition-all shadow-md"
                                        >
                                            Ver detalles
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>

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
