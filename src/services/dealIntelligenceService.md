# src/services/dealIntelligenceService.ts

## Responsibilities:
- Transforms raw meeting transcripts into structured, actionable intelligence using **Azure OpenAI**.
- Supports multiple AI personas/prompt versions (`nirav` and `pankaj`) to cater to different business needs.
- Extracts summaries, key points, broker takeaways, and deal-specific metrics.

## Personas:
- **`nirav`**: Focuses on identifying the lead type (Buyer/Seller), core requirements, and punchy broker takeaways. Provides a structured client profile and speaker attribution.
- **`pankaj`**: Acts as a Senior Investment Strategy Consultant. Refines and professionalizes the conversation, focusing on strategic overviews, SWOT analysis of risk factors, and builder commitments.

## Key Features:
- **Persona-Based Extraction**: Returns different JSON structures based on the selected prompt version.
- **Multilingual Support**: Effectively processes code-switching between English, Hindi, and Hinglish.
- **Date Normalization**: Automatically converts relative dates (e.g., "next Sunday") into specific dates based on the current context.
- **Mock Fallback**: Provides realistic mock data if the Azure OpenAI service is disabled or fails.

## Methods:
- `extractDealIntelligence(transcript, promptUsed)`: 
    - `transcript`: The raw text to analyze.
    - `promptUsed`: Either `'nirav'` or `'pankaj'`.
    - Returns an object containing the parsed `ai_response` and the `promptUsed`.
