# src/controller/meetingController.ts

## Responsibilities:
- Manage meetings/deal intelligence lifecycle.
- Handle upload of meeting metadata (audio URL, title).
- Retrieve list of meetings for a broker.
- Retrieve details for a single meeting.

## Methods:
- `createMeeting`: Saves initial meeting metadata linked to a broker.
- `getMeetings`: Fetches all meetings created by the authenticated broker.
- `getMeetingDetail`: Fetches full details for a specific meeting, with ownership check.
