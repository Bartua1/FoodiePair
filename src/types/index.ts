export interface Profile {
    id: string;
    pair_id: string | null;
    display_name: string | null;
    avatar_url: string | null;
    language: string;
    theme: string;
}

export interface Pair {
    id: string;
    pair_id: string | null; // This seems redundant or incorrect in original, but keeping structure
    user1_id: string;
    user2_id: string | null;
    created_at: string;
}

export interface Restaurant {
    id: string;
    pair_id: string;
    name: string;
    address: string | null;
    cuisine_type: string | null;
    price_range: number;
    lat: number;
    lng: number;
    visit_status?: 'visited' | 'wishlist';
    is_favorite: boolean; // Derived from favorites list for current user
    favorites?: Profile[]; // List of users who favorited
    visit_date: string | null;
    general_comment: string | null;
    created_by: string | null;
    avg_score?: number;
    user_has_rated?: boolean;
    distance?: number;
}

export interface Rating {
    id: string;
    restaurant_id: string;
    user_id: string;
    food_score: number;
    service_score: number;
    vibe_score: number;
    price_quality_score: number;
    favorite_dish: string | null;
}

export interface Photo {
    id: string;
    restaurant_id: string;
    url: string;
}

export interface Comment {
    id: string;
    restaurant_id: string;
    user_id: string;
    content: string;
    created_at: string;
}

export interface SharedRestaurantConfig {
    allow_comments: boolean;
    allow_photos: boolean;
    show_photos: boolean;
    show_ratings: boolean;
    show_comments: boolean;
    theme: string;
}

export interface SharedRestaurant {
    id: string;
    restaurant_id: string;
    created_by: string;
    configuration: SharedRestaurantConfig;
    is_public: boolean;
    created_at: string;
}

export interface SharedRestaurantUser {
    id: string;
    shared_restaurant_id: string;
    user_id: string;
    created_at: string;
}

export interface SharedRestaurantConfig {
    allow_comments: boolean;
    allow_photos: boolean;
    show_photos: boolean;
    show_ratings: boolean;
    show_comments: boolean;
    theme: string;
}

export interface SharedRestaurant {
    id: string;
    restaurant_id: string;
    created_by: string;
    configuration: SharedRestaurantConfig;
    is_public: boolean;
    created_at: string;
}

export interface SharedRestaurantUser {
    id: string;
    shared_restaurant_id: string;
    user_id: string;
    created_at: string;
}

