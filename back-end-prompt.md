
# Spring Boot Backend Generation for NearShare

**Role:** Act as a Senior Java Backend Engineer and Software Architect.

**Objective:** Create a complete, production-ready Spring Boot backend REST API for the "NearShare" application. 
This backend will replace the existing frontend mock service (`mockApi.ts`).

**Context:** 
create project: NearShare-back-end
NearShare is a hyper-local, trust-based platform for neighbors to borrow tools and exchange skills. The frontend is built with React/TypeScript. The backend needs to handle authentication, geolocation-based listing retrieval, real-time-like messaging, and trust reputation logic.

## 1. Technical Stack Requirements
*   **Language:** Java 17+
*   **Framework:** Spring Boot 3.x
*   **Build Tool:** Maven
*   **Database:** PostgreSQL (Production) / H2 In-Memory (Dev/Test)
*   **ORM:** Spring Data JPA (Hibernate)
*   **Security:** Spring Security 6 + JWT (Stateless Authentication)
*   **Documentation:** OpenAPI / Swagger UI (`springdoc-openapi`)
*   **Utilities:** Lombok, MapStruct (optional, for DTO mapping)

## 2. Data Models (Entities)
Translate the following TypeScript interfaces (from `types.ts`) into JPA Entities. Use proper relationships (`@OneToMany`, `@ManyToOne`, `@Enumerated`).

*   **Enums:** `ListingType` (GOODS, SKILL), `AvailabilityStatus` (AVAILABLE, BORROWED, PENDING, etc.), `UserRole` (ADMIN, LENDER, BORROWER, MEMBER), `VerificationStatus`.
*   **User Entity:**
    *   Fields: `UUID id`, `String name`, `String email` (unique), `String password` (hashed), `String phone`, `String address`, `String avatarUrl`, `int trustScore` (default 50), `int vouchCount`, `VerificationStatus`, `Location` (Embeddable: lat, lng), `LocalDateTime joinedDate`, `UserStatus` (ACTIVE, BLOCKED).
*   **Listing Entity:**
    *   Fields: `UUID id`, `String title`, `String description`, `ListingType`, `String category`, `String imageUrl`, `List<String> gallery` (ElementCollection), `double hourlyRate`, `boolean autoApprove`, `AvailabilityStatus`, `Location`.
    *   Relationships: `owner` (User), `borrower` (User, nullable).
*   **Review Entity:**
    *   Fields: `int rating`, `String comment`, `LocalDateTime timestamp`.
    *   Relationships: `author` (User), `targetUser` (User), `listing` (Listing).
*   **Message Entity:**
    *   Fields: `String content`, `LocalDateTime timestamp`, `boolean isRead`.
    *   Relationships: `sender` (User), `receiver` (User).

## 3. API Endpoints & Logic
Implement Controllers and Services to match the frontend `mockApi.ts` functionality.

### Authentication (`/api/auth`)
*   `POST /login`: Accepts email/password, returns JWT token + User DTO.
*   `POST /register`: Creates new user.

### Users (`/api/users`)
*   `GET /me`: Returns current authenticated user.
*   `PATCH /me`: Update profile (name, avatar, etc.).
*   `GET /`: (Admin only) Get all users.
*   `POST /{id}/vouch`: Increment vouch count, logic to bump trust score slightly.
*   `POST /verification-request`: Set status to PENDING, save address/phone.
*   `POST /{id}/approve-verification`: (Admin only) Set status VERIFIED, increase trust score.
*   `POST /{id}/revoke-verification`: (Admin only).
*   `POST /{id}/status`: (Admin only) Block/Unblock user.

### Listings (`/api/listings`)
*   `GET /`: Support pagination (`page`, `size`) and filtering (`search`, `category`, `type`, `minPrice`).
    *   **Critical:** Implement a Haversine formula (or Postgres PostGIS if strictly necessary, but Java-side calculation is fine for MVP) to calculate `distanceMiles` relative to the current user's location.
    *   Exclude HIDDEN/BLOCKED items unless the user is Admin or Owner.
*   `GET /{id}`: Return details. Hydrate `owner` and `borrower` info.
*   `POST /`: Create listing.
*   `PUT /{id}`: Update listing.
*   `DELETE /{id}`: Soft delete or hard delete.
*   `POST /{id}/borrow`:
    *   Logic: If `autoApprove` is true, set status `BORROWED`. If false, set `PENDING`. Set `borrower` to current user.
*   `POST /{id}/approve`: Owner approves pending request.
*   `POST /{id}/deny`: Owner denies request (reset to AVAILABLE).
*   `POST /{id}/return`: Return item (reset to AVAILABLE).
*   `POST /{id}/block`: (Admin only) Toggle BLOCKED status.

### Messages (`/api/messages`)
*   `GET /conversations`: Return unique users the current user has chatted with.
*   `GET /{userId}`: Get message history with a specific user.
*   `POST /`: Send a message.

### Reviews (`/api/reviews`)
*   `GET /user/{userId}`: Get reviews for a specific user.
*   `POST /`: Create a review. Trigger logic to recalculate the `targetUser`'s `trustScore` (average rating * 20).

## 4. Requirements & Best Practices
1.  **CORS:** Configure Global CORS to allow requests from `http://localhost:3000` (or local React port).
2.  **Exception Handling:** Create a `@ControllerAdvice` to return JSON errors (e.g., `404 Not Found`, `400 Bad Request`, `401 Unauthorized`) instead of HTML stack traces.
3.  **DTO Pattern:** Do not expose Entities directly. Create `UserDTO`, `ListingDTO`, `CreateListingRequest`, etc.
4.  **Seeding:** Create a `CommandLineRunner` to seed the database with the data found in `data/mockData.ts` (Linda Lender, Bob Borrower, etc.) so the app isn't empty on startup.
5.  **Environment Variables:** Use `application.properties` for DB credentials and JWT Secret.

## 5. JSON Mock Data Examples (Frontend Expectations)
Use these JSON structures to guide your DTO design so the frontend works seamlessly.

### Auth: Login
**Request:**
```json
{
  "email": "linda.lender@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "user_lender",
    "name": "Linda Lender",
    "email": "linda.lender@example.com",
    "role": "LENDER",
    "avatarUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
    "trustScore": 98,
    "vouchCount": 156,
    "verificationStatus": "VERIFIED",
    "location": { "lat": 0.002, "lng": 0.002 },
    "joinedDate": "2021-05-15"
  }
}
```

### Listings: Get All
**Response (Paginated):**
```json
{
  "content": [
    {
      "id": "item_l1",
      "ownerId": "user_lender",
      "title": "Professional Tile Cutter",
      "description": "Manual tile cutter...",
      "type": "GOODS",
      "category": "Tools",
      "imageUrl": "https://...",
      "distanceMiles": 0.2, 
      "status": "AVAILABLE",
      "hourlyRate": 15.0,
      "location": { "x": 10, "y": 10 },
      "owner": {
        "id": "user_lender",
        "name": "Linda Lender",
        "trustScore": 98,
        "avatarUrl": "..."
      }
    }
  ],
  "pageable": { ... },
  "totalPages": 5,
  "totalElements": 50
}
```

### Listings: Create
**Request:**
```json
{
  "title": "New Item",
  "description": "Description...",
  "category": "Tools",
  "type": "GOODS",
  "hourlyRate": 10,
  "imageUrl": "...",
  "gallery": ["url1", "url2"],
  "autoApprove": false,
  "location": { "x": 0, "y": 0 }
}
```

### Messages: Get Conversation
**Response:**
```json
[
  {
    "id": "msg_1",
    "senderId": "user_borrower",
    "receiverId": "user_lender",
    "content": "Hi, is this available?",
    "timestamp": "2023-10-25T14:30:00Z",
    "isRead": true
  }
]
```

### Reviews: Create
**Request:**
```json
{
  "targetUserId": "user_lender",
  "listingId": "item_l1",
  "rating": 5,
  "comment": "Great experience!"
}
```
Ensure the code structure follows standard Spring Boot directory layout (`com.nearshare.api...`).
Use maven to manage dependencies.
