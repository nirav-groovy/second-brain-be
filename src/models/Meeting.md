# src/models/Meeting.ts

## Responsibilities:
- Defines the data structure for real estate meeting intelligence in MongoDB.
- Provides a flexible schema that supports different conversation types (Buyer vs. Seller).
- Stores both raw transcripts and AI-extracted actionable insights.

## Core Fields:
- `brokerId`: Reference to the User (Broker) who owns this meeting.
- `title`: User-provided title for the meeting.
- `audioUrl`: URL/path to the recorded audio file.
- `transcript`: Full raw text from the STT service.
- `speakers`: Array of identified participants with their IDs, roles, and names.

## Intelligence Fields (New Dynamic Structure):
- `conversationType`: Identifies the primary lead (Buyer, Seller, General, or Other).
- `summary`: A concise executive brief of the meeting.
- `brokerTakeaway`: **1-2 line "punchy" memory-jogger** for quick recall after many days.
- `mainKeyPoints`: Array of specific objects containing:
    - `point`: The actual requirement, promise, or concern.
    - `party`: Who said it (e.g., Buyer, Seller).
    - `category`: Type of point (Financial, Requirement, Concern, Promise).
- `dealProbabilityScore`: Numeric score (0-100) indicating the likelihood of closing the deal.
- `suggestedAction`: AI-recommended immediate next step for the broker.
- `metadata`: A `Mixed` type catch-all for any extra dynamic intelligence fields.

## Legacy/Specific Profile Fields:
- `clientProfile`: Structured data for budget, loan requirements, and urgency.
- `interestSignals`: Specific preferences like BHK, floor, and Vastu.
- `financialIntelligence`: Detailed financial data like expected rent and builder schemes.
- `keyConcerns`: List of specific objections or worries.
