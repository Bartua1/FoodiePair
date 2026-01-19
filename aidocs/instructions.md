# Instructions: Project FoodiePair

## 1. Project Overview
**FoodiePair** is a mobile-first web application designed for couples to track, rate, and discover restaurants together. The app features a shared experience where two users are linked as a "Pair," allowing them to see a shared map and feed of visited places, compare individual ratings, and filter restaurants by distance and category.

## 2. Tech Stack
*   **Frontend:** Next.js (App Router) or React (Vite).
*   **Auth:** Clerk (Social Login: Google/Apple).
*   **Database & Storage:** Supabase (PostgreSQL + Storage).
*   **Maps:** Leaflet.js + React-Leaflet (using OpenStreetMap - 100% Free).
*   **Styling:** Tailwind CSS + ShadcnUI.
*   **Icons:** Lucide-React.

## 3. The Pastel Design System
Apply these specific colors in the Tailwind configuration to ensure a soft, aesthetic look:
*   **Background:** `#FAFAFA`
*   **Pastel Pink:** `#FCE4EC` (Romantic/Dinner)
*   **Pastel Blue:** `#E3F2FD` (Vibe/Atmosphere)
*   **Pastel Green:** `#E8F5E9` (Healthy/Fresh)
*   **Pastel Yellow:** `#FFF9C4` (Price/Quality)
*   **Pastel Lavender:** `#F3E5F5` (General)
*   **Pastel Mint:** `#B2DFDB` (Accents)
*   **Pastel Peach:** `#FFECB3` (Primary Buttons/FAB)
*   **Border Radius:** Use `rounded-2xl` (1rem) for cards and `rounded-full` for buttons.

## 4. Database Schema (PostgreSQL)

### Table: `profiles`
*   `id`: `text` (Primary Key, matches Clerk `user_id`).
*   `pair_id`: `uuid` (References `pairs.id`, nullable).
*   `display_name`: `text`.
*   `language`: `text` (default: 'es').
*   `theme`: `text` (default: 'light').

### Table: `pairs`
*   `id`: `uuid` (Primary Key).
*   `user1_id`: `text` (Clerk ID).
*   `user2_id`: `text` (Clerk ID).
*   `created_at`: `timestamp`.

### Table: `restaurants`
*   `id`: `uuid` (Primary Key).
*   `pair_id`: `uuid` (References `pairs.id`).
*   `name`: `text`.
*   `address`: `text`.
*   `cuisine_type`: `text`.
*   `price_range`: `int` (1-3).
*   `lat`: `float8`.
*   `lng`: `float8`.
*   `is_favorite`: `boolean` (default: false).
*   `visit_date`: `date`.
*   `general_comment`: `text`.

### Table: `ratings`
*   `id`: `uuid`.
*   `restaurant_id`: `uuid` (References `restaurants.id`).
*   `user_id`: `text` (Clerk ID).
*   `food_score`: `float` (0.5 steps).
*   `service_score`: `float` (0.5 steps).
*   `vibe_score`: `float` (0.5 steps).
*   `price_quality_score`: `float` (0.5 steps).
*   `favorite_dish`: `text`.

### Table: `photos`
*   `id`: `uuid`.
*   `restaurant_id`: `uuid`.
*   `url`: `text`.

## 5. Core Feature Logic

### A. Clerk-Supabase Sync & Pair Linking
1.  On first login, create a `profile` entry using the Clerk `user_id`.
2.  **Pairing Flow:** User A generates a "Pair Code" (their `user_id`). User B enters this code. The app creates a row in `pairs` and updates both `profiles` with the new `pair_id`.

### B. The Rating System (The "Pair" Score)
*   **Calculation:** For any restaurant, the app must fetch ratings from both users in the pair.
*   **FoodiePair Average:** `(Sum of all scores from User A + Sum of all scores from User B) / Total Number of Categories`.
*   **Comparison UI:** Show a side-by-side radar chart or progress bars comparing User A vs. User B's scores.

### C. Free Map Implementation (Leaflet)
*   Use `react-leaflet`. Do **not** use Google Maps or Mapbox (to keep it free).
*   **Source:** OpenStreetMap Tiles.
*   **Functionality:** 
    *   Display all `restaurants` linked to the user's `pair_id`.
    *   If `is_favorite` is true, use a special Heart/Star marker icon.
    *   Clicking a marker opens a Pastel-styled popup with the restaurant name and average score.

### D. Filtering & Distance
*   Calculate distance on the client-side using the **Haversine Formula** based on `navigator.geolocation`.
*   **Filter Bar:** A horizontal scrollable list of pills:
    *   Distance (<1km, <5km, Any).
    *   Price (€, €€, €€€).
    *   Favorites (Toggle).
    *   Cuisine Type (Dropdown).

## 6. UI Structure & Components

### View 1: Home Feed
*   Sticky top bar with filter pills.
*   Vertical list of cards: `bg-white border border-pastel-mint shadow-sm rounded-2xl`.
*   Each card shows the main photo, the "Pair Score," and the category.

### View 2: Map View
*   Full-screen map using Leaflet.
*   Floating "Filter" button over the map.
*   High-contrast "Favorite" markers.

### View 3: Floating Action Button (FAB)
*   Position: `fixed bottom-6 right-6`.
*   Style: `w-16 h-16 rounded-full bg-pastel-peach shadow-lg flex items-center justify-center`.
*   Action: Opens a Multi-step drawer/modal to add a restaurant.
    *   **Step 1:** Name/Address (Fetch Lat/Lng from a free Geocoding API like Nominatim).
    *   **Step 2:** Multi-criteria ratings (0-5 stars, 0.5 increments).
    *   **Step 3:** Photo upload to Supabase `foodie-photos` bucket.

### View 4: Stats Page
*   "Pickiest Eater" section: Compare the average total score given by each user to see who is harder to please.

## 7. Security (RLS Policies)
Apply Row Level Security in Supabase:
*   Users can only `SELECT/INSERT/UPDATE` data where `pair_id` matches their own `pair_id` in the `profiles` table.

## 8. Environment Variables
```env
VITE_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 9. Development Steps for the Agent
1.  **Phase 1: Setup.** Initialize Next.js/Vite with Tailwind and Pastel config. Set up Clerk and Supabase clients.
2.  **Phase 2: Auth & Pairing.** Implement the logic to link two Clerk users into one `pair_id`.
3.  **Phase 3: Restaurant CRUD.** Build the FAB and the multi-step form (including the 0.5 star slider).
4.  **Phase 4: Map & Geolocation.** Integrate Leaflet, render markers, and implement the Haversine distance filter.
5.  **Phase 5: Styling.** Apply the pastel theme across all components using ShadcnUI as a base.