# Security Improvements

- **[Strict RLS Policies on Public Shares]** (Priority: High)
  - **Description:** The `/shared/:id` route intentionally exposes restaurant details to unauthenticated users. It's crucial to ensure this doesn't accidentally expose sensitive partner comments or leak the entirety of a couple's history.
  - **Implementation Details:** Refine the Supabase RLS on the `restaurants` table to allow `SELECT` for unauthenticated peers ONLY if an explicit `is_public` boolean or unique `share_token` column precisely matches the route. Guarantee that relational queries for contextual `comments` stringently require `auth.role() = 'authenticated'` and a validated `pair_id` session verification.

- **[Clerk Session Re-verification for Destructive Actions]** (Priority: Medium)
  - **Description:** High-risk actions like permanently unpairing a partner account, wiping historical logs, or deleting the primary profile entirely should mandate an additional, intentional security gate.
  - **Implementation Details:** Implement Clerk's "Step-Up Authentication" mechanisms or enforce an explicit UI re-authentication flow (prompting for an OTP or exact password subset) before permitting progression with destructive mutations on native `profiles` or `pairs` tables via custom Supabase RPCs.

- **[Rate Limiting Edge Functions and APIs]** (Priority: Medium)
  - **Description:** Prevent aggressive, automated scraping of public shared links or excessive API calls that could rapidly exhaust Supabase free-tier quotas and incur unnecessary utilization bills.
  - **Implementation Details:** Restrict API endpoints by leveraging either a future Supabase API Gateway rollout or rapidly deploy a custom Edge Function middleware layer that hashes the requesting IP address (or logged-in user ID) to rigidly cap the volume of allowable transactional requests per rolling minute.

- **[Secure Target Location Handling]** (Priority: Low)
  - **Description:** Browsers natively process required geolocation prompts securely via HTTPS. However, raw precise coordinates should never be needlessly synchronized to the backend database or indefinitely retained if not practically required for specific active features.
  - **Implementation Details:** Structurally enforce that the `useGeolocation` return state solely exists in volatile client-side React memory context, primarily utilized exclusively as URL query parameters for ad-hoc distance sorting computations. Any persistent location storage (e.g., defining a "Home Base") should algorithmically broaden to an approximate locale (city center radius) rather than preserving exact GPS coordinate precision persistently.
