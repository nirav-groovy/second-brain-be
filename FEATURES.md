# AI Meeting Memory - Feature Documentation

This document provides a comprehensive overview of all features implemented in the **AI Meeting Memory** platform, a specialized solution for real estate brokers to capture, analyze, and act on meeting insights.

---

## 🚀 Major Features

### 1. User Authentication & Security
- **Secure Registration & Login:** JWT-based authentication for brokers to manage their data securely.
- **Dual-Factor Verification (OTP):** Verification of both **Email** and **Phone Number** via One-Time Passwords (OTP) to ensure high-quality lead data and account security.
- **Role-Based Access Control:** Middleware protection for all meeting-related endpoints.

### 2. Meeting Recording & Management
- **Audio Upload:** Support for uploading meeting recordings in various formats (handled via `multer`).
- **Sample Mode:** Ability to simulate a meeting using predefined high-quality "Hinglish" and Gujarati scripts for testing and demonstration purposes.
- **Meeting Dashboard:** A centralized view for brokers to list and track all their recorded meetings.
- **Detailed Intelligence Sheets:** In-depth view for each meeting, containing the full transcript, AI-extracted insights, and metadata.

### 3. Multilingual Speech-to-Text (STT)
- **Indian Language Support:** Optimized for Indian contexts, supporting **English, Hindi, Gujarati, and code-mixed (Hinglish)** conversations.
- **Dual-Engine Architecture:** Primary processing via **Sarvam AI** (specialized for Indian languages) with **Deepgram** as a secondary/fallback option.
- **Speaker Diarization:** Automatically identifies different speakers in the audio (e.g., Speaker 0, Speaker 1).

### 4. AI Deal Intelligence (Azure OpenAI)
- **Automated Insight Extraction:** Extracts structured data from raw transcripts using advanced LLM prompts.
- **Multilingual-to-English Intelligence:** Automatically translates and interprets conversations in Hindi, Gujarati, or Hinglish into professional English deal sheets.
- **Conversation Classification:** Automatically identifies if a meeting is with a **Buyer, Seller, or General Inquiry**.
- **Strategic Summary:** Generates an executive summary and a "Broker Takeaway" to help remember core details weeks later.
- **Deal Probability Scoring:** AI-driven score (0-100) indicating the likelihood of the deal closing based on verbal cues.
- **Client Profile Mapping:** Automatically identifies budget ranges, loan requirements, and urgency levels.

### 5. Smart Speaker Identification & Translation
- **Contextual Identity Mapping:** Uses AI to deduce real names and roles (Buyer/Seller/Broker) from conversational cues.
- **Automatic Translation:** Seamlessly translates multilingual Indian conversations (Hindi/Gujarati/Marathi) into professional English transcripts.

### 6. Automated Follow-up Scheduling
- **Intelligent Date Detection:** AI identifies mentioned dates or relative times (e.g., "next Sunday") and converts them into specific dates.
- **Calendar Integration:** Automatically creates follow-up events in the system's calendar based on the AI's "suggested next action".

### 7. Broker CRM & Search System
- **Advanced Searching:** Search through all meetings by **Client Name**, **Meeting Title**, or even specific keywords within the **Transcript**.
- **Contextual Filtering:** Filter your deal pipeline by status (e.g., completed, failed) or lead type (Buyer vs. Seller).
- **CRM Dashboard Stats:** High-level aggregation of broker performance, including total deals, average deal probability, and lead distribution.
- **Automated Client Profiling:** AI automatically extracts and indexes client names and deal types directly into the CRM database.

---

## 🛠️ Minor & Supporting Features

### 1. AI Persona Selection
- **Customizable Extraction Styles:** Support for different AI personas (`nirav` for punchy broker takeaways vs. `pankaj` for senior investment consultant style reports).

### 2. Verification-Based Usage Limits
- **Verification Gates:** Unverified users are restricted to a maximum of **5 meetings**, incentivizing account verification via email and phone.
- **Account Verification:** Seamless OTP-based flow for verifying broker identity.

### 3. Background Processing
- **Asynchronous Workflow:** Responds immediately to the user while processing heavy STT and AI tasks in the background to ensure a smooth UI experience.
- **Real-time Status Updates:** Tracks meeting state through: `transcribe-generating` ➔ `speakers-generating` ➔ `intelligence-generating` ➔ `completed`.

### 4. Developer Tools & Infrastructure
- **Interactive API Documentation:** Full **Swagger/OpenAPI** integration available at `/api-docs`.
- **Static Asset Management:** Secure serving of uploaded audio files via `/uploads`.
- **Centralized Error Handling:** Global middleware to handle file upload limits, validation errors, and server failures.
- **Validation Layer:** Strict request validation using `express-validator` for all critical inputs (Auth, Meetings).

---

## 📈 Technical Stack
- **Backend:** Node.js, TypeScript, Express.
- **Database:** MongoDB (Mongoose).
- **AI Services:** Azure OpenAI (GPT-4o), Sarvam AI, Deepgram.
- **Communications:** Twilio (SMS), SendGrid/SMTP (Email).
