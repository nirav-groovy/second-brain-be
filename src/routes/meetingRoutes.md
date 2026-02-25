# src/routes/meetingRoutes.ts

## Responsibilities:
- Define HTTP routes for meeting data and deal intelligence.
- Connect routes to `meetingController` methods.
- Protect all routes using `authenticate` middleware.

## Routes:
- `POST /api/meetings`: Adds a new meeting record.
- `GET /api/meetings`: Lists all meetings for the broker.
- `GET /api/meetings/:id`: Fetches details for a single meeting.
