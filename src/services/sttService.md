# src/services/sttService.ts

## Responsibilities:
- Converts meeting audio recordings into text using **Sarvam AI** and **Deepgram SDK**.
- Provides both real-world Speech-to-Text (STT) and sample-based mocking for development and testing.
- Specialized in Indian languages and multilingual code-mixed (Hinglish) transcription.

## Key Engines:
- **Sarvam AI (Primary)**: 
    - **`model: 'saaras:v3'`**: Optimized for Indian languages (Hindi, Gujarati, etc.).
    - **`withDiarization: true`**: Identifies different speakers in the conversation.
    - **Batch Processing**: Handles file uploads, job monitoring, and result downloading.
- **Deepgram (Fallback/Secondary)**:
    - **`model: 'nova-2'`**: High accuracy and low latency for general multilingual support.
    - **`language: 'multi'`**: Handles code-switching between languages.
    - **`diarize: true`**: Identifies different speakers.

## Key Features:
- **`smart_format`**: Automatically applies formatting for numbers, dates, and punctuation.
- **Sample Scripts**: Includes high-quality mock scripts for real estate scenarios (Buyer/Seller/Broker) in English, Hindi, and Gujarati.

## Methods:
- `transcribeAudio(audioUrl, fromSample)`: 
    - `audioUrl`: Path to the local audio file.
    - `fromSample`: Boolean flag. If `true`, returns a random mock transcript from `SAMPLE_SCRIPTS`.
    - Returns the transcription result (either from Sarvam, Deepgram, or mock data).
- `transcribeAudioSarvam(audioUrl)`: Handles the Sarvam AI batch job lifecycle.
- `transcribeAudioDeepgram(audioUrl)`: Fallback method using Deepgram Nova-2.
