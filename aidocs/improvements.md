# FoodiePair Review & Improvement Plan

## 1. Critique & Review

### 🎨 UI/UX & Design Phase
*   **Theme Consistency:** The "Pastel" theme is well-configured in `tailwind.config.js`, and components use it consistently. However, some contrast ratios (white text on pastel backgrounds or vice-versa) might be low. Ensure accessibility (a11y) compliance.
*   **Global Styles Conflict:** `index.css` has a conflict where it declares `color-scheme: light dark` at the root but then forces specific light-mode styles in a media query. This can complications on devices with Dark Mode enabled.
    *   *Recommendation:* strictly enforce the light/pastel theme by removing the `dark` scheme property or fully implement dark mode support with appropriate inverse pastel colors.
*   **Navigation:** The app currently uses manual state-based routing (`view` state in `App.tsx`). This breaks the browser's "Back" button functionality and makes deep-linking (e.g., sharing a URL to a specific restaurant) impossible.
    *   *Recommendation:* Refactor to use `react-router-dom` or `@tanstack/react-router`.
*   **Carousel Interactions:** The hero image carousel in `RestaurantDetailView` uses manual scroll event listeners to update the active dot. This often leads to performance issues or "jank" on mobile devices.
    *   *Recommendation:* Use a CSS-scroll-snap based approach with an `IntersectionObserver` or a lightweight library like `embla-carousel` for smoother touch interactions.

### 🏗 Code Architecture
*   **Separation of Concerns:** `App.tsx` contains too much business logic (filtering, sorting, distance calculation). This makes the main component messy and hard to test.
    *   *Recommendation:* Move the filter/sort logic into a custom hook, e.g., `useRestaurantFilter(restaurants, filters, userLocation)`.
*   **Image Handling:** Images are displayed directly from Supabase Storage URLs.
    *   *Recommendation:* Use Supabase Image Transformations to request smaller sizes (thumbnails) for the Feed and standard sizes for the Detail view to improve load times and reduce data usage.

## 2. Functionality Improvement Plan

We propose the following roadmap to enhance the application:

### Phase A: Core Experience Improvements (High Priority)
1.  **Refactor Routing:** Implement `react-router-dom` to support browser history and direct links (e.g., `/restaurant/:id`).
2.  **Image Optimization:** Implement a helper utility to request resized images from Supabase based on the viewport (Thumbnail vs Full).
3.  **Search Functionality:** Add a textual search bar to the `FilterBar` to allow finding restaurants by name or address.

### Phase B: Social & Engagement (Medium Priority)
4.  **"Wishlist" / "To Go" List:** distinct from "Favorites". A list of places the pair *wants* to go but hasn't visited yet.
5.  **Shareable Lists:** Generate a public read-only link for a pair's "Top 5" to share with friends.
6.  **Memories View:** A timeline view showing photos and comments from past dates (restaurant visits).

### Phase C: Technical Robustness (Low Priority)
7.  **PWA Support:** Configure `vite-plugin-pwa` to allow users to install the app on their home screen with offline fallback for viewed content.
8.  **Virtualization:** Implement `react-window` for the Home Feed to support lists of hundreds of restaurants without performance degradation.

## 3. Immediate Action Items (Refactoring)
*   [ ] **Fix `index.css`**: Remove conflicting color-scheme properties.
*   [ ] **Extract Filters**: Move filter logic from `App.tsx` to `hooks/useFilteredRestaurants.ts`.
*   [ ] **Update Carousel**: Refactor `RestaurantDetailView` carousel to use `IntersectionObserver` for better performance.
