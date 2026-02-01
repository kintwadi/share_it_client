# NearShare - Neighborhood Exchange Platform

NearShare is a hyper-local, trust-based platform designed to facilitate item borrowing and skill exchanges among neighbors.

## Project Architecture

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS (Utility-first architecture)
- **Icons**: Lucide React
- **Visualization**: Recharts for the map interface
- **Routing**: React Router DOM (HashRouter)

### Mock Backend
The application uses a service-layer abstraction (`services/mockApi.ts`) to interact with static mock data (`data/mockData.ts`). This simulates a RESTful API with network latency (`DELAY_MS`), allowing for realistic UI state management (loading states, async rendering) without a live server.

### Key Features
1.  **Hyper-local Discovery**: 
    - A toggleable List/Map view.
    - `MapVisualizer`: A mock scatter plot representing the user's 2-mile radius.
    - `ResourceCard`: Displays item details with computed distance and owner trust metrics.
    
2.  **Trust & Verification**:
    - Users have a `Trust Score` (0-100) and `Vouch Count`.
    - These metrics are prominently displayed on resource cards and user profiles to encourage safe transactions.

3.  **Messaging & Logistics**:
    - Real-time simulated chat interface.
    - Allows coordination for item handoffs.

4.  **AI Assistance**:
    - Integration with Google Gemini API to assist users in writing friendly, high-trust descriptions for their listings.

## Data Schema
See `api_schema.json` for the full JSON schema definition of the mock data entities.

## Getting Started
The project uses ES Modules and CDN-based dependencies for a zero-build setup where possible, but is structured to support standard bundlers (Vite/Webpack).

1.  Import dependencies via `importmap` in `index.html`.
2.  Run with a local development server.
