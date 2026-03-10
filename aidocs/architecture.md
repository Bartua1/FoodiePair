# FoodiePair Architecture Document

This document outlines the architecture of FoodiePair, including the tech stack, overarching design patterns, database structural rules (RLS), and a breakdown of the core file directory.

## 1. Tech Stack
- **Frontend Core**: React 19 (managed via Vite) and TypeScript.
- **Styling**: Tailwind CSS for utility-driven styling.
- **Authentication**: Clerk React SDK for secure and seamless user identity management.
- **Database & Backend**: Supabase (PostgreSQL) handling relational data, file storage, and real-time syncing.
- **Routing**: React Router v7 (`react-router-dom`) for client-side routing.
- **Maps**: `leaflet` and `react-leaflet` for drawing interactive maps.
- **Internationalization**: `react-i18next` alongside `i18next-browser-languagedetector`.

## 2. Design Patterns
- **Feature-based Component Structure**: The `src/components/` directory is logically separated by feature domain (e.g., `auth`, `feed`, `map`, `pairing`, `restaurant`, `views`) rather than by generic UI type.
- **Custom Hooks for Data Fetching & Logic**: Business logic and Supabase network calls are decoupled from the UI components directly and instead abstracted into custom hooks found in `src/hooks/` (e.g., `useRestaurants`, `useGeolocation`, `useNotifications`). This cleanly separates presentation and data collection.
- **Page-Level "View" Components**: Top-level routes defined in `App.tsx` directly map to aggregate components located in `src/components/views/`. These View components act as "smart" containers that hold page-level state and compose smaller "dumb" UI elements.
- **Real-Time Data Syncing**: Supabase's real-time subscriptions are used (as seen in `App.tsx`) to listen for incoming `postgres_changes` across tables like `profiles` or `comments`, auto-updating the UI state across connected devices without requiring manual refreshes.

## 3. Row Level Security (RLS) Policies
Given that FoodiePair data must be strictly shared *only* between paired users, Supabase Row Level Security (RLS) policies form the backbone of the application's authorization strategy. Key policies include:

- **Profiles**: `Users can manage their own profile` -> Constrained directly to `id = auth.uid()`.
- **Pairs**: `Users can read their pair` -> Constrained to where `auth.uid()` matches either `user1_id` or `user2_id`.
- **Restaurants, Ratings, Photos, and Comments**: The core isolation pattern. Users can SELECT, INSERT, UPDATE, or DELETE from these tables **ONLY** if the foreign key `pair_id` aligns with the pair they belong to. The policy effectively checks:
  ```sql
  pair_id IN (SELECT pair_id FROM profiles WHERE id = auth.uid()::text)
  ```
- **Storage**: Allows public reads for the `restaurant-photos` bucket (`bucket_id = 'restaurant-photos'`), but strictly requires `auth.role() = 'authenticated'` for uploads.

## 4. File Structure & Roles

### `src/` Overview
- **`App.tsx`**: The main application shell. Orchestrates routing, authenticates user sessions (Clerk's `<SignedIn />` / `<SignedOut />`), and handles real-time profile fetching from Supabase.
- **`main.tsx`**: React entry point that bootstraps providers (`ClerkProvider`, `BrowserRouter`, i18n).

### `src/components/` - The UI Domain
- **`views/`**: Contains the top-level route components acting as pages.
  - `FeedView`: The main list of restaurants with a premium 2-column grid layout, text search, and filtering/sorting tools.
  - `MapView`: Renders restaurants on a Leaflet map.
  - `SettingsView` / `StatsView` / `RestaurantDetailView`.
- **`stats/`**: Houses the premium `InsightSlideshow` and `PairStats` components for the Pair Analytics dashboard.
- **`auth/`**: Contains `UserSync`, which bridges Clerk authentication with our Postgres `profiles` table.
- **`pairing/`**: Encompasses the code handling matching two accounts together (pairing codes).
- **`restaurant/`**: Specific UI blocks for single restaurants (e.g., `AddRestaurantDrawer`, `RestaurantFAB`).

### `src/hooks/` - Abstracted Logic Container
- **`useRestaurants.ts`**: Fetches a pair's shared restaurants array, returning states like `loading`, `error`, and exposing a `refresh` function.
- **`useGeolocation.ts`**: Safely requests browser coordinate locations, handling permissions and errors.
- **useCommentLikes.ts** / **useNotifications.ts**: Modularizes interactions regarding the social features of the app.
- **useRecommendations.ts**: Orchestrates the Chef's Suggestions logic by combining historical user preferences with real-time geolocation.

### `src/utils/` - Auxiliary Logic & Engines
- **`calendarUtils.ts`**: Handles the generation of Google Calendar URLs and Apple/ICS files for the "Plan a Date" feature.
- **`recommendationEngine.ts`**: The core algorithm used to compute the "Chef's Suggestions" based on historical pair data.
- **`imageUtils.ts`**: Provides helper functions for image optimization (e.g., resizing via Supabase storage parameters).

### `supabase/` - Database Definitions
- **`schema.sql` / `setup.sql`**: The canonical definitions of our Database structure. Outlines Tables, Foreign Keys, Triggers, and every RLS Policy described above. Updates here denote a hard schema change.
- **`add_comments.sql`**: An example migration file adjusting the schema to introduce relational comments and their specific RLS rule.
