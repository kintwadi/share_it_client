## Placement
- Show a new section titled "Recommended for You" directly below the existing pagination on the Discover (Home) page.
- Render only when a user is logged in and at least one recommendation is available.

## Data Sourcing
- Detect login state in `pages/Home.tsx` by calling `mockApi.getCurrentUser()` on mount.
- Fetch candidate listings via `mockApi.getListings()` (reuse existing data pipeline).
- Optionally fetch borrow history via `mockApi.getBorrowingHistory()` to boost categories the user previously borrowed.

## Recommendation Logic (client-side initial)
- Exclude listings owned by the current user.
- Score candidates using simple heuristics:
  - +2 if listing.category is among categories from the user's borrow history.
  - +1 if listing.type matches the current filter selection.
  - +1 if listing.category matches the current category filter.
  - +proximity boost if `listing.location` is near the user's `location` (if available).
- Sort by the score (desc) then by recency; take top N (e.g., 6–9). Cache in component state.

## API Option (backend enhancement)
- Add `GET /api/listings/recommended` that computes recommendations on the server using:
  - user’s borrow history categories
  - proximity to user location
  - owner trust score / verification
  - exclude blocked/hidden
- Frontend switches to the dedicated endpoint when available; fallback remains client-side.

## UI/UX Details
- Section title: "Recommended for You".
- Grid layout matching ResourceCard tiles (same as main grid), limited to one or two rows.
- Include a subtle description like "Based on your activity and nearby listings".
- Only render when `currentUser != null`.

## Implementation Steps (frontend)
1. In `pages/Home.tsx`:
   - Add `currentUser` state; load it via `mockApi.getCurrentUser()`.
   - Add `recommended` state and an effect that recomputes when `listings`, `currentUser`, `filterType`, and `selectedCategory` change.
   - Implement a scoring function and slice top N.
   - Render the new section after the pagination block.
2. Keep existing filters and pagination untouched.
3. Ensure i18n strings (LanguageContext) for the title/description or inline English if not required.

## Validation
- Log in and open Discover.
- Verify the section appears below pagination with 6–9 recommended items.
- Change category/type filters; confirm recommendations recalibrate.
- Confirm it hides when logged out or when no candidates score above threshold.

## Future Enhancements
- Switch to server-side recommendations endpoint.
- Add a dismiss button per recommendation and improve personalization over time.