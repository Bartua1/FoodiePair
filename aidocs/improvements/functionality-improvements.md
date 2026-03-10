# Functionality Improvements

- **["Decide For Us" Randomizer]** (Priority: High)
  - **Description:** Couples often struggle to choose where to eat. A feature that randomly selects a restaurant from their synced "To-Go" list solves this common pain point playfully and effectively.
  - **Implementation Details:** Build a specific UI component accessible from the `FeedView`. It will query the active client-side dataset from `useRestaurants`, filter by `status = 'To-Go'`, and procedurally pick a random entry. Present this choice using a "roulette" style visual animation before fully revealing the venue details.

- **[Custom Shared Lists & Collections]** (Priority: Medium)
  - **Description:** Expand beyond the binary "Visited" vs. "To-Go" statuses to allow couples to group restaurants into custom contextual lists like "Anniversary Spots", "Cheap Eats", or "Weekend Brunch".
  - **Implementation Details:** Expand the Supabase schema to include a `collections` table and a junction table linking `restaurants` to `collections`, enforcing RLS strictly by `pair_id`. Update the frontend `AddRestaurantDrawer` and Detail views to include a multi-select component for adding venues to these localized collections.

- DONE **[Date Night Calendar Integration]** (Priority: Medium)
  - **Description:** Allow users to schedule an upcoming visit to a "To-Go" restaurant and export it directly to their device's native calendar, moving from wishlist to action.
  - **Implementation Details:** Add an optional `planned_date` column to the `restaurants` table. Implement a date picker component in the specific restaurant view. Create a client-side ICS file generator to allow adding events (with restaurant name and Google Maps links) to Google Calendar/Apple Calendar.

- **[AI-Driven Couple Recommendations]** (Priority: Low)
  - **Description:** Proactively suggest *new* venues nearby based on the couple's historically highly-rated cuisines and mutual price preferences.
  - **Implementation Details:** Implement a Supabase Edge Function that computes the most frequent, highly-rated cuisines and tags associated with a specific `pair_id`. Use this aggregated profile to query the Google Places API or Yelp API for similar nearby spots to present as a prioritized "Discover" feed outside their known lists.
