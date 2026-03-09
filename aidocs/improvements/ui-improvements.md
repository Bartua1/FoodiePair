# UI Improvements

- DONE **[Dark Mode and Theming Support]** (Priority: High)
  - **Description:** Implement a dark mode to improve accessibility and allow users to view the app comfortably in low-light environments, such as during a romantic dinner. This adds a visual polish users expect from modern apps.
  - **Implementation Details:** Utilize Tailwind CSS's `dark` variant class capabilities. Implement a global theme toggle persisting in Clerk user metadata or browser local storage, updating a React context provider that controls toggling the `.dark` class on the `<html>` root element.

- DONE **[Enhanced Map Markers and Clustering]** (Priority: High)
  - **Description:** When users have many saved restaurants, the map can become cluttered and unreadable. Clustering and richer custom markers representing the restaurant's status improve visual clarity and interaction.
  - **Implementation Details:** Use the `react-leaflet-cluster` package to group nearby markers dynamically based on zoom level. Customize Leaflet markers with custom HTML/CSS (using `L.divIcon`) returning Lucide React icons colored based on the restaurant status (e.g., solid green for "Visited", outlines for "To-Go").

- DONE **[Skeleton Loading States]** (Priority: Medium)
  - **Description:** Prevent layout shifts and provide immediate visual feedback while Supabase data (like the feed or restaurant details) is being fetched natively, making the app feel significantly faster.
  - **Implementation Details:** Create reusable skeleton components leveraging Tailwind's `animate-pulse` and `bg-gray-200` (or `bg-gray-800` in dark mode) classes. Conditionally render these blocks in `FeedView` and `RestaurantDetailView` while the `loading` state from custom hooks (like `useRestaurants`) is `true`.

- DONE **[Micro-interactions & Animations]** (Priority: Low)
  - **Description:** Add smooth transitions when adding a restaurant or seamlessly revealing the partner's rating to make the app feel premium, polished, and attentive to detail.
  - **Implementation Details:** Utilize `framer-motion` for complex mount/unmount animations (like sliding in the `AddRestaurantDrawer`), or stick to standard Tailwind classes (`transition-all duration-300 ease-in-out`) for hover states, button scaling, and the fade-in of the partner's rating once the current user's rating is submitted.
