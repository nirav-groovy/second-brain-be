# src/controllers/meetingController.ts

## Responsibilities:
- Orchestrates the meeting processing workflow: Audio Upload -> Speech-to-Text -> AI Deal Intelligence.
- Manages the lifecycle of meeting records and extracted intelligence in MongoDB.
- Enforces meeting limits based on user verification status.

## Methods:
- `createMeeting`: 
    - Processes a new meeting recording.
    - **Verification Check**: If the user has not verified both email and phone, they are limited to a maximum of 5 meetings.
    - **Background Processing**: Responds immediately to the client and continues processing in the background.
    - **Workflow States**: 
        - `transcribe-generating`: Converting audio to text via Sarvam/Deepgram.
        - `speakers-generating`: Identifying names/roles and translating via Azure OpenAI.
        - `intelligence-generating`: Extracting structured deal insights.
        - `completed`: Full analysis finalized.
        - `failed`: An error occurred during processing.
    - **Automatic Follow-up**: Calls `scheduleFollowUp` to create calendar events if a date is mentioned in the intelligence response.
- `getMeetings`: Returns all meeting records owned by the authenticated broker.
- `getMeetingDetail`: Returns the full details and AI intelligence for a specific meeting ID.
