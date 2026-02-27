# src/routes/meetingRoutes.ts

## Responsibilities:
- Defines API endpoints for processing meetings and retrieving deal intelligence.
- Orchestrates the integration of authentication, file upload (Multer), and validation middlewares.
- Maps meeting-related HTTP requests to the `meetingController`.

## Endpoints:
- `POST /api/meetings`: 
    - Processes a new meeting recording from an uploaded audio file.
    - Requires `bearerAuth`.
    - Accepts `multipart/form-data` with an audio file (`recording`) and a title.
- `GET /api/meetings`: 
    - Retrieves a search-able and filter-able list of all meetings owned by the authenticated broker.
    - Requires `bearerAuth`.
    - Query Params: `search`, `status`, `type`, `sortBy`, `order`.
- `GET /api/meetings/stats`:
    - Retrieves high-level CRM statistics for the broker dashboard.
    - Requires `bearerAuth`.
- `GET /api/meetings/get/:id`: 
    - Fetches the comprehensive deal intelligence sheet for a specific meeting ID.
    - Requires `bearerAuth`.
    - Includes validation for the meeting ID parameter.
