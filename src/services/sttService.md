# src/services/sttService.ts

## Responsibilities:
- Converts meeting audio recordings into text using the **Deepgram SDK**.
- Provides both real-world Speech-to-Text (STT) and sample-based mocking for development and testing.
- Supports multilingual transcription and speaker diarization.

## Key Features:
- **`model: 'nova-2'`**: Uses Deepgram's latest model for high accuracy and low latency.
- **`language: 'multi'`**: Handles code-switching between languages (e.g., English and Hindi).
- **`diarize: true`**: Identifies different speakers in the conversation.
- **`smart_format`**: Automatically applies formatting for numbers, dates, and punctuation.

## Methods:
- `transcribeAudio(audioUrl, fromSample)`: 
    - `audioUrl`: Path to the local audio file.
    - `fromSample`: Boolean flag. If `true`, returns a random mock transcript from `SAMPLE_SCRIPTS`.
    - Returns an object containing the `transcript` (string) and an array of `speakers`.
