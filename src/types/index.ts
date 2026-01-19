export interface Profile {
    id: string;
    pair_id: string | null;
    display_name: string | null;
    language: string;
    theme: string;
}

export interface Pair {
    id: string;
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
    is_favorite: boolean;
    visit_date: string | null;
    general_comment: string | null;
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
