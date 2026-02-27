# src/routes/meetingRoutes.ts

## Responsibilities:
- Defines API endpoints for processing meetings and retrieving deal intelligence.
- Orchestrates the integration of authentication, file upload (Multer), and validation middlewares.
- Maps meeting-related HTTP requests to the `meetingController`.

## Endpoints:
- `POST /api/meetings`: 
    - Processes a new meeting recording.
    - Requires `bearerAuth`.
    - Accepts `multipart/form-data` with an audio file (`recording`) and metadata (`title`, `fromSample`, `usePrompt`).
    - `usePrompt`: Allows selecting between different AI personas (`nirav` or `pankaj`).
- `GET /api/meetings`: 
    - Retrieves a list of all meetings owned by the authenticated broker.
    - Requires `bearerAuth`.
- `GET /api/meetings/get/:id`: 
    - Fetches the comprehensive deal intelligence sheet for a specific meeting ID.
    - Requires `bearerAuth`.
    - Includes validation for the meeting ID parameter.
