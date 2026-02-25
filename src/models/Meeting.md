# src/modules/Meeting.ts

## Responsibilities:
- Meeting/Deal data structure for MongoDB.
- Mongoose model for Meeting collection.

## Fields:
- `brokerId`: Reference to the User (Broker).
- `title`: Title of the meeting.
- `audioUrl`: URL to the recorded audio file.
- `transcript`: Full transcript from the speech-to-text service.
- `clientProfile`: Structured data about client budget, loan, family size, and urgency.
- `interestSignals`: Preference for BHK, floor, vastu, location, and parking.
- `financialIntelligence`: Rent, builder schemes, negotiations, discounts, and holding period.
- `dealProbabilityScore`: Numeric score (0-100) indicating the chance of closing the deal.
- `keyConcerns`: Array of main client objections or worries.
- `suggestedAction`: AI-recommended next step for the broker.
