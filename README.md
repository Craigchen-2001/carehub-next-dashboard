## CareHub – Full-Stack Healthcare Provider Dashboard
CareHub is a full-stack healthcare provider dashboard built with Next.js 14 (App Router) and TypeScript. The goal of this project is to simulate a realistic provider workflow environment using mock API routes, while focusing on clean architecture, strong typing, proper state management, and production-oriented error handling. Instead of optimizing for visual design, this implementation prioritizes maintainability, clarity, and correctness.

The application allows providers to manage patients, schedule and reschedule appointments, detect scheduling conflicts, and receive real-time notifications. All backend logic is implemented using Next.js API routes with realistic mock data and simulated network behavior.

## Tech Stack 
This project is built using Next.js 14 with the App Router architecture and TypeScript as the primary language. React Query (@tanstack/react-query) is used for server state management, caching, retry logic, and optimistic updates. Tailwind CSS is used for styling. Zod is used for request validation in API routes. Vitest is used for API route testing.

Node 18+ is recommended.

## Setup Instructions
Install dependencies: npm install
Start the development server: npm run dev
Open in browser: http://localhost:3000
Run tests: npm run test
Run type checking: npm run typecheck

## Feature Overview
Patient List (/patients)

The patient list page supports advanced filtering including text search (name, MRN, DOB), status filtering, provider filtering, risk level filtering, pagination, sorting, and page size selection. Filter state is synchronized with the URL so the page remains shareable and refresh-safe. Search input is debounced to avoid excessive network calls. Loading states, empty states, and error states are explicitly handled. The API returns pagination metadata to simulate a realistic backend contract.

Patient Detail (/patients/[id])

The patient detail page is structured into clear sections including overview, appointments, vitals, and notes. Data fetching is performed in parallel to avoid waterfall loading. Each section has its own error handling to prevent a single failing endpoint from breaking the entire page. Editing is performed through validated modal interactions. Notes use optimistic updates for responsiveness and rollback on failure.

Appointment Scheduler (/schedule)

The scheduler supports both weekly and day views. Appointments can be filtered by provider and room. Conflict detection identifies overlapping appointments per provider and visually marks them. A side panel allows viewing details, rescheduling, and creating new appointments. Rescheduling supports both manual editing and drag-and-drop interactions. Drag-and-drop includes confirmation before committing changes and uses optimistic updates with rollback logic. The scheduler includes a today indicator and week navigation. Network failures are simulated and handled with retry logic and manual retry controls.

Notifications

The notification system includes a bell with unread count, a dropdown displaying recent notifications, and support for marking notifications as read individually or in bulk. Toast-style feedback confirms user interactions. Notification data is managed via React Query and mock API routes.

## API Design
All API routes are implemented using Next.js App Router API handlers. The mock backend includes endpoints for patients, appointments, providers, and notifications. Artificial network latency (200–500ms) and occasional 503 failures are simulated to test resilience and error handling.

Implemented endpoints include:

Patients
GET /api/patients
GET /api/patients/:id
PUT /api/patients/:id
GET /api/patients/:id/appointments
GET /api/patients/:id/notes
POST /api/patients/:id/notes

Appointments
GET /api/appointments
POST /api/appointments
PUT /api/appointments/:id
DELETE /api/appointments/:id

Providers
GET /api/providers
GET /api/providers/:id/schedule

Notifications
GET /api/notifications
PUT /api/notifications/:id/read
POST /api/notifications/mark-all-read

Mock data includes over 50 patients, more than 100 appointments across two weeks, and 5 providers with different schedules.

## Architecture Decisions
The App Router structure keeps UI routes and API routes clearly separated while remaining in a single repository. React Query is used instead of manual state handling to ensure proper caching, retry behavior, and predictable mutation flows. Optimistic updates are implemented for scheduling and note editing to maintain responsiveness. Conflict detection is implemented client-side for flexibility. Native drag-and-drop APIs are used instead of heavy third-party libraries to keep the implementation lightweight and understandable.

Code is structured to separate UI components, API logic, and shared utilities. Type definitions are explicit and avoid the use of any. API payloads are validated to enforce predictable contracts.

## Error Handling and Production Readiness
The application includes a global error boundary and section-level error handling. React Query retry logic protects against simulated 503 failures. Manual retry controls are provided in the UI. Optimistic updates include rollback on failure. Loading states and empty states are clearly rendered to avoid layout shift and ambiguous UI behavior.

## Testing Strategy
Vitest is used to test API routes. Tests validate response structure, status codes, and returned data types. API behavior including simulated 503 responses is verified. The testing focus is on ensuring stable API contracts and preventing regressions.

Run tests using: npm run test

## What I Would Improve With More Time
With additional time, I would implement a more advanced time-grid scheduler layout, enhance accessibility for drag-and-drop interactions, and add end-to-end tests using Playwright for critical workflows. Persisting notification read state beyond memory (for example via localStorage or a lightweight persistence layer) would improve realism. UI accessibility improvements and keyboard drag support would also be prioritized.

## Project Structure
src/
app/
api/
patients/
schedule/
components/
lib/
tests/

