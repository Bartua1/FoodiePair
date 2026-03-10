# Project Overview: FoodiePair

## Introduction
FoodiePair is a progressive web application built for couples or partners to jointly discover, track, and rate restaurants. It serves as a shared culinary diary and wishlist, allowing paired users to sync their dining experiences and maintain a cohesive list of places they want to visit or have already enjoyed.

## Core Capabilities & Features

### 1. User Authentication & Pairing
- **Authentication**: Powered by Clerk, providing secure and straightforward login/signup flows.
- **Partner Pairing**: Users can generate pairing codes to link their accounts with a partner (recorded in Supabase). Once paired, they share access to the same restaurant data and can view each other's ratings.
- **Profile Synchronization**: The app maintains a synced profile utilizing Supabase real-time subscriptions, keeping language preferences and pairing status up to date.

### 2. Restaurant Discovery & Tracking
- **Visited vs. To-Go (Wishlist)**: Restaurants can be tagged as "Visited" or added to a "To Go" list. Unrated visited restaurants surface as action items for users. The visit date can be manually adjusted to account for delayed entries.
- **Add & Manage Restaurants**: Users can add new restaurants via an interactive Drawer component, capturing location, cuisine type, and price level.
- **Filtering & Layout**: Robust filtering by name (text search), distance, price, cuisine, and "favorites only". The main feed implements a premium 2-column responsive grid layout with highly styled restaurant cards. Sorting is available by rating or distance.
- **Date Night Planning**: Users can schedule upcoming visits to restaurants in their "To Go" list. This feature includes a date picker and integration with native calendars (Google, Apple/ICS) to move from wishlist to action.

### 3. Maps & Geolocation
- **Location Awareness**: The app requests device geolocation to calculate distances to saved restaurants dynamically.
- **Interactive Map View**: Powered by `react-leaflet`, plotting discovered or wishlisted restaurants on a map centered around the user's current location or their tracked restaurants.

### 4. Shared & Public Experiences
- **Public Restaurant Pages**: Individual restaurants can be shared publicly via a dedicated link (`/shared/:id`). Unauthenticated users can view limited details but are prompted to sign up to interact.
- **Comments & Activity**: Detailed restaurant views include a comment/feed section, with personalized notifications for new partner comments.
- **Blind Partner Ratings**: To prevent bias, a partner's detailed rating is blurred out until the current user inputs their own rating.

### 5. Statistics & Personalization
- **Stats View**: Aggregated insights and premium "Culinary Slideshow" highlighting joint habits (e.g., favorite cuisines, pickiest eater, vibe master).
- **Memory Timeline**: A chronological journal of everywhere the couple has eaten together, surfacing photos, ratings, and comments in a scrollable memory feed.
- **Couple Achievement Badges**: Gamified milestones that track joint progress, such as variety of cuisines tried and consistency in ratings.
- **Internationalization (i18n)**: Multi-language support seamlessly integrated with the user's profile and `react-i18next`.

## Tech Stack
- **Frontend Framework**: React 19 (via Vite)
- **Language**: TypeScript throughout the application.
- **Styling**: Tailwind CSS for utility-first styling with Lucide React for consistent iconography.
- **State & Data**: Supabase (PostgreSQL) for remote database, real-time sync, and backend-as-a-service logic.
- **Authentication**: Clerk React SDK.
- **Maps**: Leaflet + React Leaflet.
- **Routing**: React Router DOM
