# Performance Improvements

- DONE **[Lazy Loading the Map Components]** (Priority: High)
  - **Description:** The `MapView` and all underlying `react-leaflet`/Leaflet dependencies are significantly large in bundle size. Deferring their loading until the user explicitly navigates to the map tab drastically speeds up the initial application Time to Interactive.
  - **Implementation Details:** Use React 19's `lazy()` utility combined with `<Suspense>` boundaries to dynamically import the `MapView` aggregate component from `App.tsx`. Display a lightweight, branded loading spinner as the fallback while the chunk is fetched.

- Canceled **[Image Optimization, Resizing, and Caching]** (Priority: High)
  - **Description:** Large, unoptimized user-uploaded restaurant photos can consume immense bandwidth and completely stall rendering in the `FeedView`. Delivering precisely optimized images ensures smooth scrolling.
  - **Implementation Details:** Enforce Supabase Storage Image Transformations (`transform={width, format: 'webp'}`) directly in the component `src` attributes. Configure strict Cache-Control headers on the Storage bucket, and utilize the native browser `loading="lazy"` attribute on `<img>` tags for images rendered under the initially visible fold.

- DONE **[Virtualization / Cursor Pagination for Feed]** (Priority: Medium)
  - **Description:** Over time, as couples add hundreds of restaurants, rendering the entire React tree for the data list simultaneously will degrade browser DOM performance and frame rates.
  - **Implementation Details:** Transition the Supabase query in the `useRestaurants` hook to utilize infinite loading cursor-based pagination. Alternatively, integrate a virtualized list library like `@tanstack/react-virtual` in the `FeedView` to only mount and render the DOM nodes currently visible within the viewport.

- DONE **[Debouncing & Throttling Real-time Payloads]** (Priority: Low)
  - **Description:** Excessive or hyper-rapid real-time updates from Supabase (e.g., rapid partner typing or rating modifications) could cause jarring, non-stop UI re-renders that consume unnecessary main-thread processing power.
  - **Implementation Details:** Implement a debouncing or throttling mechanism to safely batch continuous UI updates reacting to the `postgres_changes` subscriptions. Aggregate updates into state changes every ~300ms rather than applying every granular websocket payload instantly.
