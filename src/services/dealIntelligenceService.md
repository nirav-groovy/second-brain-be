# src/services/dealIntelligenceService.ts

## Responsibilities:
- Transforms raw meeting transcripts into structured, actionable intelligence using **Azure OpenAI**.
- Uses a specialized real estate deal intelligence engine for analyzing broker-client meetings.
- Identifies speaker names and roles from conversational context.
- Translates multilingual Indian conversations into professional English deal sheets.

## Deal Intelligence Model:
- **Lead Classification**: Automatically identifies the lead type (Buyer/Seller).
- **Executive Summary**: Synthesizes the conversation into a strategic overview.
- **Broker Takeaway**: Provides a 1-2 line punchy takeaway to help remember the core of the conversation.
- **Key Points Extraction**: Maps specific requirements, concerns, and promises.
- **Client Profile**: Identifies budget, loan requirements, and urgency.
- **Deal Probability Scoring**: Assigns a score (0-100) based on lead quality.
- **Next Action Recommendation**: Suggests the most critical next step for the broker.

## Key Features:
- **Multilingual-to-English Intelligence**: Automatically translates and interprets conversations in Hindi, Gujarati, or Hinglish.
- **Date Normalization**: Automatically converts relative dates (e.g., "next Sunday") into specific dates.
- **Speaker Identification**: Analyzes conversational cues to map Speaker IDs to real names (e.g., "Mister Patel") and roles (e.g., "Seller").
- **Mock Fallback**: Provides realistic mock data if the Azure OpenAI service is disabled or fails.

## Methods:
- `extractDealIntelligence(transcript)`: 
    - `transcript`: The raw text to analyze.
    - Returns an object containing the parsed `ai_response` and metadata.
- `identifySpeakers(transcript)`: 
    - `transcript`: The raw JSON transcript string from STT.
    - Uses Azure OpenAI to deduce names and roles, and translates the entire dialogue to English.
    - Returns the formatted English transcript with speaker names and roles.
