# src/controllers/meetingController.ts

## Responsibilities:
- Orchestrates the meeting processing workflow: Audio Upload -> Speech-to-Text -> AI Deal Intelligence.
- Manages the lifecycle of meeting records and extracted intelligence in MongoDB.
- Enforces meeting limits based on user verification status.

## Methods:
- `createMeeting`: 
    - Processes a new meeting recording.
    - **Verification Check**: If the user has not verified both email and phone, they are limited to a maximum of 5 meetings.
    - Coordinates calls to `transcribeAudio` and `extractDealIntelligence`.
    - Stores the full result, including transcript, speaker data, and persona-specific AI response.
- `getMeetings`: Returns all meeting records owned by the authenticated broker.
- `getMeetingDetail`: Returns the full details and AI intelligence for a specific meeting ID.
