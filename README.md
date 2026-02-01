# CORVID by Magpie - Tech Lead Interview

## Architecture Overview
This project demonstrates a modern, scalable architecture for a high-performance e-commerce dashboard.

-   **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, **Google Fonts (Inter)**.
-   **UI Library**: Shadcn/UI for accessible, professional components + Recharts for visualizations.
-   **Data Layer**: PostgreSQL (Neon Serverless) queried via Prisma ORM.
-   **Data Pipeline**: Trigger.dev v3 for reliable, scheduled background jobs.

## Architecture Decisions
-   **Normalized Schema with Integer IDs**: I normalized `Order`, `Product`, and `OrderItem` tables and migrated to standard **Integer IDs** (instead of UUIDs/Strings) for primary keys. This ensures better indexing performance and canonical ordering.
-   **Centralized Type Definitions**: To improve maintainability and avoid circular dependency issues, all shared TypeScript interfaces (`Product`, `Order`, `AggregatedMetric`) are centralized in the `types/` directory.
-   **Route Groups**: The dashboard is isolated under a `(dashboard)` route group with a dedicated layout (`app/(dashboard)/layout.tsx`) that handles the navigation bar and background styling (`bg-[#FEF8D6]`), keeping the auth flow visually and structurally distinct.
-   **Synthetic History**: The mock API provides static snapshots. My sync logic distributes orders over the last 30 days to visualize meaningful trends on the dashboard.
-   **Server Actions**: Data fetching is handled server-side for security and performance, directly aggregating metrics from the DB.

## How to Run

1.  **Environment Setup**:
    ```bash
    cp .env.example .env
    # Add DATABASE_URL (Neon) and TRIGGER_SECRET_KEY
    ```

2.  **Install & Generate**:
    ```bash
    npm install
    npx prisma generate
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Run Trigger.dev Worker (in separate terminal)**:
    ```bash
    npx trigger.dev@latest dev
    # Go to the dashboard URL provided and click "Test" on sync-orders task
    ```

## AI Disclosure
This project utilized AI assistance (Gemini/Copilot) for:
-   Scaffolding repetitive UI code (Shadcn components).
-   Generating initial Prisma schema definitions.
-   Writing TypeScript interfaces for API responses.

All architectural decisions, data modeling, and business logic implementation were directed and reviewed by me.

## Business Insight
**Revenue by Category**: The dashboard highlights which product categories drive the most value. This insight helps identify underperforming segments (e.g., high inventory but low sales velocity) vs. cash cows.
