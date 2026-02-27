# src/services/sttService.ts

## Responsibilities:
- Converts real-world meeting audio recordings into text using **Sarvam AI** and **Deepgram SDK**.
- Specialized in Indian languages and multilingual code-mixed (Hinglish) transcription.
- Performs speaker diarization to separate multiple voices in a single recording.

## Key Engines:
- **Sarvam AI (Primary)**: 
    - **`model: 'saaras:v3'`**: Optimized for Indian languages (Hindi, Gujarati, etc.).
    - **`withDiarization: true`**: Identifies different speakers in the conversation.
    - **Batch Processing**: Handles file uploads, job monitoring, and results.
- **Deepgram (Fallback/Secondary)**:
    - **`model: 'nova-2'`**: High accuracy and low latency for general multilingual support.
    - **`language: 'multi'`**: Handles code-switching between languages.
    - **`diarize: true`**: Identifies different speakers.

## Key Features:
- **Smart Formatting**: Automatically applies formatting for numbers, dates, and punctuation.
- **Multilingual Support**: Effectively processes code-switching between English, Hindi, and Hinglish.
- **Speaker Diarization**: Automatically separates speakers for downstream AI analysis.

## Methods:
- `transcribeAudio(audioUrl)`: 
    - `audioUrl`: Path to the local audio file to be transcribed.
    - Returns the transcription result (either from Sarvam or Deepgram fallback).
- `transcribeAudioSarvam(audioUrl)`: Handles the Sarvam AI batch job lifecycle for Indian languages.
- `transcribeAudioDeepgram(audioUrl)`: Fallback method using Deepgram Nova-2 for multilingual support.
