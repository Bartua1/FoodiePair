// Restaurant type removed as it was unused in this file
export interface ExternalDiscovery {
    id: string;
    name: string;
    address: string;
    cuisine_type: string | null;
    lat: number;
    lng: number;
    price_range: number;
    is_external: true;
}

export async function discoverNearbyRestaurants(
    lat: number,
    lng: number,
    radius: number = 2000, // meters
    cuisine: string | null = null
): Promise<ExternalDiscovery[]> {
    // Overpass QL query: find restaurants, fast_food, and cafes
    const baseFilter = '["amenity"~"restaurant|fast_food|cafe",i]';

    // Improved cuisine mapping for common terms
    let filterPart = "";
    let nameFilter = cuisine || "";
    if (cuisine) {
        if (cuisine.toLowerCase() === 'burger') {
            filterPart = `["cuisine"~"burger|hamburger|fast_food",i]`;
            nameFilter = "burger|hamburguesa";
        } else {
            filterPart = `["cuisine"~"${cuisine}",i]`;
        }
    } else {
        filterPart = baseFilter;
    }

    const query = `
    [out:json][timeout:25];
    (
      node${filterPart}(around:${radius},${lat},${lng});
      way${filterPart}(around:${radius},${lat},${lng});
      relation${filterPart}(around:${radius},${lat},${lng});
      // Also search name if cuisine filter is active
      ${cuisine ? `node["amenity"~"restaurant|fast_food|cafe",i]["name"~"${nameFilter}",i](around:${radius},${lat},${lng});` : ''}
      ${cuisine ? `way["amenity"~"restaurant|fast_food|cafe",i]["name"~"${nameFilter}",i](around:${radius},${lat},${lng});` : ''}
    );
    out center;
  `;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
        });

        if (!response.ok) throw new Error('OSM Discovery failed');

        const data = await response.json();

        const results = data.elements.map((el: any) => {
            const elLat = el.lat || el.center?.lat;
            const elLng = el.lon || el.center?.lon;

            const tags = el.tags || {};

            // Extract rating if available (OSM tags like 'stars', 'rating', 'user_rating')
            const rating = parseFloat(tags.stars || tags.rating || tags['user_rating'] || '0');

            return {
                id: `osm-${el.id}`,
                name: tags.name || 'Unnamed Spot',
                address: tags['addr:street']
                    ? `${tags['addr:street']} ${tags['addr:housenumber'] || ''}`.trim()
                    : 'Address unknown',
                cuisine_type: tags.cuisine?.split(';')[0] || null,
                lat: elLat,
                lng: elLng,
                price_range: mapOsmPriceRange(tags),
                is_external: true,
                rating: rating > 0 ? rating : undefined,
            };
        }).filter((r: any) => r.name !== 'Unnamed Spot');

        // Sort by distance to the search center
        return results.sort((a: any, b: any) => {
            if (!a.lat || !a.lng || !b.lat || !b.lng) return 0;
            const distA = calculateDistance(lat, lng, a.lat, a.lng);
            const distB = calculateDistance(lat, lng, b.lat, b.lng);
            return distA - distB;
        });
    } catch (error) {
        console.error('Discovery error:', error);
        return [];
    }
}

function mapOsmPriceRange(tags: any): number {
    if (tags['payment:coins'] === 'yes' || tags['cuisine'] === 'fast_food') return 1;
    const price = tags['price'] || tags['fee'];
    if (price === 'high' || tags['expensive'] === 'yes') return 3;
    if (price === 'moderate') return 2;
    return 2; // Default
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}
