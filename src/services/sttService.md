# src/services/sttService.ts

## Responsibilities:
- Convert audio recorded by the broker into text using **Deepgram SDK**.
- Provides both **Real-world STT** and **Sample-based Mocking** for testing.
- Supports **Multilingual Transcription** (Auto-detecting and transcribing English, Hindi, etc., in a single recording).
- Implements **Speaker Diarization** (Identifying who spoke what).

## Key Features:
- **`language: 'multi'`**: Enabled to handle codeswitching (e.g., Hinglish).
- **`model: 'nova-2'`**: Uses Deepgram's fastest and most accurate model.
- **`smart_format`**: Automatically formats numbers, dates, and punctuation.

## Methods:
- `transcribeAudio(audioUrl, fromSample)`: 
    - If `fromSample` is true, returns a randomly selected long/complex scenario from `SAMPLE_SCRIPTS`.
    - Otherwise, performs a real transcription using the Deepgram API.
