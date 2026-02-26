# src/controller/meetingController.ts

## Responsibilities:
- Orchestrate the meeting processing pipeline: Speech-to-Text -> AI Deal Intelligence.
- Manage meetings/deal intelligence lifecycle in the database.
- Handle multi-part form data (audio recording + metadata).
- Retrieve list of meeting cards and full deal intelligence sheets for a broker.

## Methods:
- `createMeeting`: 
    - Accepts an audio file or a `fromSample` flag.
    - Triggers `transcribeAudio` (STT).
    - Triggers `extractDealIntelligence` (AI Understanding).
    - Saves the complete record (transcript, speakers, dynamic intelligence fields) to MongoDB.
- `getMeetings`: Fetches a summary list of all meetings for the authenticated broker.
- `getMeetingDetail`: Fetches the comprehensive deal intelligence sheet for a specific meeting.
