# src/services/dealIntelligenceService.ts

## Responsibilities:
- Uses **Azure OpenAI (GPT-4/GPT-4o)** to transform raw transcripts into actionable intelligence.
- Identifies the **Conversation Type** (Buyer vs Seller vs General).
- Extracts a 1-2 line **Broker Takeaway** for quick memory recall.
- Summarizes the meeting into an executive brief.
- Extracts **Dynamic Key Points** based on the party (Buyer requirements vs Seller motivation).
- Provides a structured **Client Profile** (Budget, Urgency, Financing).
- Calculates a **Deal Probability Score (0-100)**.
- Suggests concrete **Next Actions**.

## Key Features:
- **Multilingual Support**: Can process transcripts containing Hindi, English, and Hinglish.
- **Dynamic Field Extraction**: Adapts its JSON response based on what's found in the conversation (captured in `metadata`).
- **Speaker Attribution**: Maps intelligence to specific speakers (Buyer, Seller, Broker).

## Methods:
- `extractDealIntelligence(transcript)`: Takes a string and returns a structured JSON object.
