Add New Listing# Share It Recommendations

## Overview
- Personalized discovery results are delivered by a server endpoint and surfaced in the Discover page below pagination when the user is logged in.
- Recommendations exclude blocked/hidden items, the user’s own listings, and any listings the user has explicitly dismissed.

## Server Endpoint
- `GET /api/listings/recommended?size=<N>`
- Returns up to `N` `ListingDTO` items scored for the current user.
- Controller: `NearShare-back-end/src/main/java/com/nearshare/api/controller/ListingsController.java:40`
- Service: `NearShare-back-end/src/main/java/com/nearshare/api/service/ListingService.java:108`

### Inputs
- Authenticated user (JWT) identifies the current user.
- Optional `size` query param (default 6).

### Output
- Array of `ListingDTO` with distance, owner summary, gallery, and flags.

## Scoring Model
- Implemented in `ListingService.recommended(...)` at `NearShare-back-end/src/main/java/com/nearshare/api/service/ListingService.java:108–134`.
- Steps:
  - Load all listings from the repository.
  - Filter candidates:
    - Status equals `AVAILABLE` only.
    - Owner exists and is not the current user.
    - Listing not in the user’s dismissal set.
  - Compute score per candidate:
    - Proximity: `score += max(0, 10 - distanceMiles) / 10` where distance uses Haversine.
      - Distance utility: `NearShare-back-end/src/main/java/com/nearshare/api/util/DistanceUtil.java:4`.
    - Owner trust: `score += owner.trustScore / 100` (higher trust increases relevance).
    - Instant book: `score += 0.3` if `autoApprove` is true.
  - Sort by score descending and take the top `size` items.

## Dismissals
- Users can dismiss individual recommendations; dismissed listings are excluded in future results.
- Persistence model: `RecommendationDismiss` JPA entity
  - File: `NearShare-back-end/src/main/java/com/nearshare/api/model/RecommendationDismiss.java`
  - Repository: `NearShare-back-end/src/main/java/com/nearshare/api/repository/RecommendationDismissRepository.java`
- Endpoint: `POST /api/listings/{id}/dismiss`
  - Controller: `NearShare-back-end/src/main/java/com/nearshare/api/controller/ListingsController.java:102–109`
  - Service method: `NearShare-back-end/src/main/java/com/nearshare/api/service/ListingService.java:136–141`

## Frontend Integration
- Discover page (`pages/Home.tsx`) displays "Recommended for You" under pagination for logged-in users.
- Primary data source: `mockApi.getRecommendedListings(size)` calling `GET /api/listings/recommended`.
- Dismiss action: `mockApi.dismissRecommendation(id)` calls `POST /api/listings/{id}/dismiss` and removes the card from the UI.
- Fallback: If server returns no data or fails, a client-side heuristic computes recommendations using
  - borrow history categories (+2),
  - current type filter (+1),
  - current category filter (+1),
  - proximity boost (same as server).

## API Contracts
### GET /api/listings/recommended
- Request: authenticated, optional `size` (default 6).
- Response (200): `ListingDTO[]`
  - `id`, `title`, `description`, `type`, `category`, `imageUrl`, `gallery[]`, `hourlyRate`, `autoApprove`
  - `distanceMiles`, `status`, `location{x,y}`
  - Owner summary: `{ id, name, avatarUrl, trustScore }`

### POST /api/listings/{id}/dismiss
- Request: authenticated, path param `id`.
- Response (200): `{ "status": "dismissed" }`

## Notes & Future Directions
- Extend server scoring using user’s borrow history categories and recent activity.
- Add preference weighting for categories/types and support "undo dismiss" in settings.
- Consider time-decay and diversity to reduce repetitive results.