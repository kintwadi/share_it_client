
# Project Analysis and Specification

## Part 1: API Readiness Assessment & Improvement Plan

The application is **structurally ready** for API integration because it abstracts data fetching into a service layer (`services/mockApi.ts`) and uses asynchronous patterns (`Promise`, `useEffect`). However, several key architectural changes are required to handle real-world server interactions efficiently.

### 1. Authentication & Security (Critical)
*   **Current State:** Login is simulated by setting a LocalStorage key and retrieving a mock user object.
*   **Required Change:**
    *   **Token Management:** Implement JWT handling. The `Connect.tsx` login must exchange credentials for an `accessToken` (and `refreshToken`).
    *   **Headers:** Create an Axios instance or a fetch wrapper that automatically injects `Authorization: Bearer <token>` into every request.
    *   **Route Protection:** The current check `if (!currentUser)` is client-side only. API endpoints must validate tokens server-side.

### 2. Server-Side Pagination & Filtering
*   **Current State:** `Home.tsx` fetches **all** listings (`mockApi.getListings()`) and performs filtering and pagination (slicing arrays) in the browser.
*   **Required Change:**
    *   **API Query Params:** Update the service layer to accept parameters: `GET /listings?page=1&limit=6&category=Tools&q=search_term`.
    *   **Response Shape:** The API response should return metadata (total count, total pages) alongside the data array to render the pagination controls correctly.

### 3. Image Uploading
*   **Current State:** The `ItemForm` in `Dashboard.tsx` uses `FileReader` to convert images to Base64 strings.
*   **Required Change:**
    *   **Multipart/Form-Data:** Real APIs rarely accept large Base64 strings in JSON bodies. You need to implement a file upload flow:
        1.  User selects file -> Upload to `POST /upload` (or direct to S3/Cloudinary).
        2.  Server returns a URL.
        3.  Submit the Listing JSON containing the image *URL*, not the raw data.

### 4. ID Generation & Optimistic UI
*   **Current State:** The frontend generates IDs (e.g., `id: item_${Date.now()}`).
*   **Required Change:**
    *   **Server IDs:** The server database (UUID/Auto-increment) must generate IDs.
    *   **Optimistic Updates:** When a user "Borrows" an item, the UI currently manually updates the local state. With a real API, you should use libraries like **TanStack Query (React Query)** to handle caching, invalidation, and background refetching to keep the UI in sync with the server.

### 5. Error Handling
*   **Current State:** Simple `console.error` or `alert("Failed")`.
*   **Required Change:**
    *   **Interceptor:** Implement a global error handler to catch 401 (Unauthorized - redirect to login), 403 (Forbidden), and 500 errors.
    *   **User Feedback:** replace `alert()` with a Toast notification system (e.g., `react-hot-toast`) for better UX.

---

## Part 2: Project Specification Document

# Project Specification: NearShare

## 1. Executive Summary
**NearShare** is a hyper-local, trust-based web platform designed to facilitate the borrowing of goods (tools, equipment) and the exchange of skills (tutoring, labor) between neighbors. Unlike broad marketplaces, NearShare focuses on community building, trust metrics, and proximity (walking distance interactions).

## 2. Core Features & Functionality

### 2.1 Authentication & Roles
*   **Guest:** Can view public listings but cannot interact.
*   **Member:** Verified or unverified user who can list items, borrow items, and chat.
*   **Lender:** A member who actively lists items.
*   **Borrower:** A member who requests items.
*   **Admin:** Staff with access to the Admin Dashboard for moderation.
*   **Modes:** Support for Demo Login (one-click access for testing) and standard email/password auth.

### 2.2 Discovery (Home)
*   **Search & Filter:** Keyword search, Category filtering (Tools, Gardening, etc.), and Listing Type toggles (Goods vs. Skills).
*   **Map Visualization:** A mock scatter plot utilizing `recharts` to visualize item density relative to the user's location.
*   **Pagination:** Grid view with page navigation.
*   **Localization:**
    *   **Multi-language:** Full support for English (EN), Portuguese (PT), and German (DE).
    *   **Multi-currency:** Dynamic pricing display in USD, EUR, GBP, BRL.

### 2.3 Listing Management
*   **CRUD Operations:** Users can Create, Read, Update, and Delete their listings.
*   **AI Integration:** Integration with **Google Gemini API** to auto-generate friendly, trust-inducing item descriptions based on title and category.
*   **Availability Control:** Lenders can toggle items as Hidden, Available, or indicate they are Borrowed.
*   **Approval Settings:** Lenders can enable "Instant Book" (auto-approve) or require manual approval for requests.

### 2.4 Transaction Flow (Borrowing)
1.  **Request:** User selects a duration and submits a request.
2.  **Payment/checkout:** User selects payment method (Card, PayPal, Cash). Logic includes hourly rate calculation and service fee estimation.
3.  **Approval:**
    *   *Manual:* Lender receives a notification in Dashboard to Approve/Deny.
    *   *Instant:* Transaction is immediately confirmed.
4.  **Return & Review:** Upon return, the borrower rates the interaction (1-5 stars) and leaves a comment.

### 2.5 Trust & Reputation System
*   **Trust Score (0-100):** A calculated metric based on successful transactions, reviews, and verification status.
*   **Vouches:** A counter representing community endorsements.
*   **Identity Verification:** Users can submit address/phone details. Admins review and grant "Verified" badges.

### 2.6 Communication
*   **Internal Messaging:** Real-time (simulated) chat between Lender and Borrower to coordinate pickup/logistics.
*   **Notifications:** Visual indicators for pending requests and unread messages.

### 2.7 Administration
*   **User Management:** View all users, ban/block users, approve verification requests.
*   **Listing Moderation:** View all listings, flag/block illegal or inappropriate items.
*   **Platform Health:** Visual stats on total users, listings, and server status.

## 3. Technical Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 | Component-based UI architecture. |
| **Routing** | React Router DOM v7 | Client-side routing (`HashRouter` used for portability). |
| **Styling** | Tailwind CSS | Utility-first styling for responsive design. |
| **State Management** | React Context API | Used for Authentication, Language, and Currency state. |
| **Icons** | Lucide React | Consistent, lightweight SVG icons. |
| **AI Service** | Google GenAI SDK | Gemini Flash model for text generation. |
| **Data Visualization** | Recharts | Scatter charts for the map view. |
| **Build Tool** | Vite / ESM | Utilizes ES Modules via `importmap` for no-build dev environments. |

## 4. Data Models (Schema Strategy)

The application expects the following entities from the REST API:

### User
```json
{
  "id": "uuid",
  "name": "String",
  "email": "String",
  "role": "MEMBER | ADMIN",
  "trustScore": "Integer",
  "verificationStatus": "UNVERIFIED | PENDING | VERIFIED",
  "location": { "lat": "Float", "lng": "Float" }
}
```

### Listing
```json
{
  "id": "uuid",
  "ownerId": "uuid",
  "title": "String",
  "description": "String",
  "type": "GOODS | SKILL",
  "category": "String",
  "imageUrl": "URL String",
  "hourlyRate": "Float",
  "status": "AVAILABLE | BORROWED | PENDING | HIDDEN",
  "autoApprove": "Boolean"
}
```

### Transaction/Request
*Links a Listing, a Borrower, and a Lender with status and dates.*

### Review
*Links a Transaction to a Rating and Comment.*

## 5. UI/UX Design Philosophy
*   **Aesthetics:** Clean, modern interface using a Teal/Emerald green palette (`brand-500`) to evoke trust and growth.
*   **Feedback:** Extensive use of loading spinners (`Loader2`), skeletons, and empty states to inform the user of system status.
*   **Responsiveness:** Mobile-first design pattern ensuring full functionality on phones and desktops.
