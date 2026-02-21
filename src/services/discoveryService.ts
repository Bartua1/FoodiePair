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
    // Overpass QL query: find restaurants within radius of lat,lng
    const cuisineFilter = cuisine ? `["cuisine"~"${cuisine}",i]` : '["amenity"="restaurant"]';

    const query = `
    [out:json][timeout:25];
    (
      node${cuisineFilter}(around:${radius},${lat},${lng});
      way${cuisineFilter}(around:${radius},${lat},${lng});
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

        return data.elements.map((el: any) => {
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
