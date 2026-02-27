# src/models/Meeting.ts

## Responsibilities:

- Defines the data structure for meeting records and AI intelligence in MongoDB.
- Stores meeting metadata, raw transcripts, and speaker information.
- Captures AI-generated intelligence in a flexible, simplified structure.
- Tracks the processing status of the meeting through background tasks.

## Core Fields:

- `brokerId`: Reference to the `User` (Broker) who owns this meeting record.
- `title`: Title of the meeting.
- `audioUrl`: Link to the recorded audio file.
- `transcript`: Raw text transcript generated from the speech-to-text service.
- `speakers`: Array of speaker objects containing `speakerId`, `role`, and `name`.
- `status`: Enum field for background processing status (`transcribe-generating`, `speakers-generating`, `intelligence-generating`, `completed`, `failed`).
- `createdAt`: Timestamp of when the record was created.

## Intelligence Fields (Simplified Structure):

- `ai_response`: A `Mixed` type field that stores the complete JSON response from Azure OpenAI, containing extracted insights, summaries, and action items.
