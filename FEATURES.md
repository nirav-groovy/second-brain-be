# AI Meeting Memory - Feature Documentation

This document provides a comprehensive overview of all features implemented in the **AI Meeting Memory** platform, a specialized solution for real estate brokers to capture, analyze, and act on meeting insights.

---

## 🚀 Major Features

### 1. User Authentication & Security

- **Secure Registration & Login:** JWT-based authentication for brokers to manage their data securely.
- **Dual-Factor Verification (OTP):** Verification of both **Email** and **Phone Number** via One-Time Passwords (OTP) to ensure high-quality lead data and account security.
- **Role-Based Access Control (RBAC):** Implementation of `UserRole` (Admin, User) to protect sensitive operations.
- **User Status Management:** Global tracking of account states (`active`, `inactive`) via `UserStatus` enums.

### 2. Project Management

- **Project CRUD:** Full capability to Create, Read, Update, and Delete projects.
- **Hierarchical Organization:** Users can organize their meetings under specific projects, facilitating better deal tracking and client management.
- **Project-Based Context:** Ensures all meeting intelligence is contextualized within a specific business goal or client engagement.

### 3. Meeting Recording & Management

- **Audio Upload:** Support for uploading meeting recordings in various formats (handled via `multer`). **Project ID is optional;** if not provided, the system automatically creates or assigns an "Unnamed Project" for organization.
- **Meeting Dashboard:** A centralized view for brokers to list and track all their recorded meetings, filterable by project.
- **Detailed Intelligence Sheets:** In-depth view for each meeting, containing the full transcript, AI-extracted insights, and metadata.
- **Intelligence Regeneration:** Ability to regenerate AI insights for an existing meeting without re-uploading the audio file.
- **Secure Deletion:** Complete removal of meeting records and associated audio files from the server.

### 4. Multilingual Speech-to-Text (STT)

- **Indian Language Support:** Optimized for Indian contexts, supporting **English, Hindi, Gujarati, and code-mixed (Hinglish)** conversations.
- **Dual-Engine Architecture:** Primary processing via **Sarvam AI** (specialized for Indian languages) with **Deepgram** as a secondary/fallback option.
- **Speaker Diarization:** Automatically identifies different speakers in the audio using `MeetingStatus` enums to track progress.
- **Improved Speaker Mapping:** Advanced AI logic to deduce real names and roles (e.g., "Doctor", "Buyer") from conversational cues, ensuring distinct identity assignment.

### 5. AI Deal Intelligence (Azure OpenAI)

- **Standardized Real Estate Engine:** Uses a high-quality real estate prompt to extract structured data from raw transcripts.
- **Multilingual-to-English Intelligence:** Automatically translates and interprets conversations in Hindi, Gujarati, or Hinglish into professional English deal sheets.
- **Conversation Classification:** Automatically identifies if a meeting is with a **Buyer, Seller, or General Inquiry**.
- **Strategic Summary & Takeaways:** Generates an executive summary and a "Broker Takeaway" with specific dates included for all mentioned relative times.
- **Date Standardization:** Automatically converts relative days (e.g., "next Tuesday") into specific `DD-MMM-YYYY (Day)` format across all fields.
- **Task Extraction (Action Items):** Extracts a structured list of tasks, including the specific date, the task description, and the person responsible.
- **Deal Probability Scoring:** AI-driven score (0-100) indicating the likelihood of the deal closing.
- **Client Profile Mapping:** Automatically identifies budget ranges, loan requirements, and urgency levels.

### 6. Automated Follow-up Scheduling

- **Multi-Event Scheduling:** Automatically creates **multiple** calendar events based on the `actionItems` extracted by the AI.
- **Intelligent Date Detection:** AI identifies mentioned dates or relative times and converts them into specific dates for calendar sync.

### 7. Broker CRM & Search System

- **Advanced Searching:** Search through all meetings by **Client Name**, **Meeting Title**, or keywords within the **Transcript**.
- **Project-Based Filtering:** Filter the deal pipeline by specific **Projects**, status, or lead type.
- **CRM Dashboard Stats:** High-level aggregation of performance, including total deals, average deal probability, and lead distribution.

---

## 🛠️ Minor & Supporting Features

### 1. Verification-Based Usage Limits

- **Verification Gates:** Unverified users are restricted to a maximum of **5 meetings**, incentivizing account verification.
- **Account Verification:** Seamless OTP-based flow for verifying broker identity.

### 2. Background Processing & Logging

- **Enum-Driven Workflow:** Tracks meeting state through standardized enums: `TRANSCRIBE_GENERATING` ➔ `SPEAKERS_GENERATING` ➔ `INTELLIGENCE_GENERATING` ➔ `COMPLETED`.
- **Comprehensive Logging:** Detailed step-by-step logging for background tasks, including transcript size, raw AI responses, and scheduling status for better auditability.
- **Asynchronous Execution:** Responds immediately to the user while performing heavy AI tasks in the background.

### 3. Developer Tools & Infrastructure

- **Interactive API Documentation:** Full **Swagger/OpenAPI** integration available at `/api-docs`.
- **Static Asset Management:** Secure serving of uploaded audio files via `/uploads`.
- **Centralized Error Handling:** Global middleware to handle file upload limits, validation errors, and server failures.
- **Validation Layer:** Strict request validation using `express-validator` and `isMongoId` checks for all critical inputs.

---

## 📈 Technical Stack

- **Backend:** Node.js, TypeScript, Express.
- **Database:** MongoDB (Mongoose) with Virtual Fields for consolidated API responses.
- **AI Services:** Azure OpenAI (GPT-4o), Sarvam AI, Deepgram.
- **Communications:** Twilio (SMS), SMTP (Email).
- **Testing:** Jest, Supertest, MongoDB Memory Server.
