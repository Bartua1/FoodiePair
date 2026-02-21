import type { Restaurant, Rating } from '../types';

export interface RecommendationReason {
    key: string;
    params?: Record<string, any>;
}

export interface RecommendationResult {
    restaurant: Restaurant;
    score: number;
    reasons: RecommendationReason[];
    distance?: number;
}

export function generateRecommendations(
    allRestaurants: Restaurant[],
    allRatings: Rating[],
    externalDiscoveries: any[] = [],
    selectedCuisine: string | null = null,
    userLocation: { lat: number; lng: number } | null = null
): RecommendationResult[] {
    const visited = allRestaurants.filter((r) => r.visit_status === 'visited');
    const wishlist = allRestaurants.filter((r) => r.visit_status === 'wishlist' || !r.visit_status); // fallback to wishlist if undefined

    if (visited.length === 0) {
        return wishlist.slice(0, 3).map((r) => ({
            restaurant: r,
            score: 0,
            reasons: [{ key: 'recommendations.reasons.noRatingsYet' }],
        }));
    }

    // 1. Map ratings to restaurants
    const restaurantRatingsMap = new Map<string, Rating[]>();
    allRatings.forEach((rating) => {
        const list = restaurantRatingsMap.get(rating.restaurant_id) || [];
        list.push(rating);
        restaurantRatingsMap.set(rating.restaurant_id, list);
    });

    // Calculate average scores per restaurant (aggregated by all users who rated)
    const calculateRestaurantAvg = (ratings: Rating[]) => {
        if (ratings.length === 0) return 0;
        const scores = ratings.flatMap((r) => [
            r.food_score,
            r.service_score,
            r.vibe_score,
            r.price_quality_score,
        ]);
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    };

    // 2. Aggregate preferences by Cuisine
    const cuisineScores: Record<string, { total: number; count: number }> = {};
    visited.forEach((r) => {
        if (!r.cuisine_type) return;
        const ratings = restaurantRatingsMap.get(r.id) || [];
        const avg = calculateRestaurantAvg(ratings);

        if (!cuisineScores[r.cuisine_type]) {
            cuisineScores[r.cuisine_type] = { total: 0, count: 0 };
        }
        cuisineScores[r.cuisine_type].total += avg;
        cuisineScores[r.cuisine_type].count += 1;
    });

    const avgCuisineScores: Record<string, number> = {};
    Object.entries(cuisineScores).forEach(([cuisine, data]) => {
        avgCuisineScores[cuisine] = data.total / data.count;
    });

    // 3. Aggregate preferences by Price Range
    const priceScores: Record<number, { total: number; count: number }> = {};
    visited.forEach((r) => {
        const ratings = restaurantRatingsMap.get(r.id) || [];
        const avg = calculateRestaurantAvg(ratings);

        if (!priceScores[r.price_range]) {
            priceScores[r.price_range] = { total: 0, count: 0 };
        }
        priceScores[r.price_range].total += avg;
        priceScores[r.price_range].count += 1;
    });

    const avgPriceScores: Record<number, number> = {};
    Object.entries(priceScores).forEach(([price, data]) => {
        avgPriceScores[Number(price)] = data.total / data.count;
    });

    // 4. Score the wishlist
    const recommendations: RecommendationResult[] = wishlist.map((r) => {
        const reasons: RecommendationReason[] = [];
        let score = 0;

        // Cuisine bonus
        if (selectedCuisine && r.cuisine_type?.toLowerCase().includes(selectedCuisine.toLowerCase())) {
            score += 10;
            reasons.push({ key: 'recommendations.reasons.craving' });
        } else if (r.cuisine_type && avgCuisineScores[r.cuisine_type]) {
            const cuisineScore = avgCuisineScores[r.cuisine_type];
            if (cuisineScore >= 4) {
                score += (cuisineScore - 3) * 2;
                reasons.push({
                    key: 'recommendations.reasons.bothLoveCuisine',
                    params: { cuisine: r.cuisine_type }
                });
            }
        }

        // Distance bonus
        let distance: number | undefined;
        if (userLocation && r.lat && r.lng) {
            distance = calculateDistance(userLocation.lat, userLocation.lng, r.lat, r.lng);
            if (distance < 1) {
                score += 3;
                reasons.push({
                    key: 'recommendations.reasons.veryClose',
                    params: { distance: distance.toFixed(1) }
                });
            } else if (distance < 3) {
                score += 1.5;
                reasons.push({
                    key: 'recommendations.reasons.distanceAway',
                    params: { distance: distance.toFixed(1) }
                });
            }
        }

        // Price and Favorite
        if (r.price_range && avgPriceScores[r.price_range] && avgPriceScores[r.price_range] >= 4) {
            score += 1;
        }
        if (r.is_favorite) {
            score += 2;
            reasons.push({ key: 'recommendations.reasons.favorite' });
        }

        return { restaurant: r, score, reasons, distance };
    });

    // 5. Score external discoveries
    const externalRecommendations: RecommendationResult[] = externalDiscoveries.map((ext) => {
        const reasons: RecommendationReason[] = [{ key: 'recommendations.reasons.newDiscovery' }];
        let score = 0.5;
        let distance: number | undefined;

        if (selectedCuisine && ext.cuisine_type?.toLowerCase().includes(selectedCuisine.toLowerCase())) {
            score += 8;
            reasons.push({ key: 'recommendations.reasons.matchesCraving' });
        }

        if (userLocation && ext.lat && ext.lng) {
            distance = calculateDistance(userLocation.lat, userLocation.lng, ext.lat, ext.lng);
            if (distance < 1) {
                score += 3;
                reasons.push({
                    key: 'recommendations.reasons.distanceAway',
                    params: { distance: distance.toFixed(1) }
                });
            } else if (distance < 5) {
                score += 1;
            }
        }

        if (ext.rating && ext.rating >= 4) {
            score += (ext.rating - 3);
            reasons.push({
                key: 'recommendations.reasons.highlyRated',
                params: { rating: ext.rating }
            });
        }

        return {
            restaurant: {
                ...ext,
                visit_status: 'wishlist',
                is_favorite: false,
                pair_id: ''
            } as Restaurant,
            score,
            reasons,
            distance
        };
    });

    // Combine and sort
    const combined = [...recommendations, ...externalRecommendations];

    return combined
        .sort((a, b) => b.score - a.score)
        .filter(rec => rec.score > 0 || combined.length <= 5)
        .slice(0, 5);
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
