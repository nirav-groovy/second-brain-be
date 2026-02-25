import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const {
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_DEPLOYMENT_NAME,
  AZURE_OPENAI_API_VERSION,
  OPENAI_ANALYSIS_ENABLED
} = process.env;

const isEnabled = OPENAI_ANALYSIS_ENABLED === "true";

const azureClient = new OpenAI({
  apiKey: AZURE_OPENAI_API_KEY,
  baseURL: `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { "api-version": AZURE_OPENAI_API_VERSION },
  defaultHeaders: {
    "api-key": AZURE_OPENAI_API_KEY!
  }
});

export const extractDealIntelligence = async (transcript: string) => {
  if (!isEnabled || !AZURE_OPENAI_API_KEY) {
    console.warn("Azure OpenAI disabled or missing key, returning mock data");
    return getMockData(transcript);
  }

  try {
    // Hard cap transcript to avoid context overflow
    const MAX_CHARS = 12000;
    const safeTranscript =
      transcript.length > MAX_CHARS
        ? transcript.slice(0, MAX_CHARS)
        : transcript;

    const response = await azureClient.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT_NAME!, // REQUIRED for TS typing
      messages: [
        {
          role: "system",
          content:
            "You are a real estate deal intelligence engine. Return strictly valid JSON only."
        },
        {
          role: "user",
          content: `
Analyze the following transcript and extract structured intelligence.

Transcript:
"""
${safeTranscript}
"""

Return JSON structure:
{
  "clientProfile": {
    "budgetRange": "string",
    "loanRequirement": "string",
    "familySize": "string",
    "urgency": "string"
  },
  "interestSignals": {
    "preference": "string",
    "floorPreference": "string",
    "vastuImportance": "string",
    "locationPriority": "string",
    "parkingRequirement": "string"
  },
  "financialIntelligence": {
    "expectedRent": "string",
    "builderScheme": "string",
    "negotiationPossibility": "string",
    "discountProbability": "string",
    "holdingPeriod": "string"
  },
  "dealProbabilityScore": number,
  "keyConcerns": ["string"],
  "suggestedAction": "string",
  "speakers": [
    { "id": "string", "role": "string", "name": "string" }
  ]
}

Rules:
- If missing data → use "Not mentioned"
- Score dealProbabilityScore 0-100
- No markdown
`
        }
      ],
      temperature: 0.2,
      max_tokens: 1500
    });

    const text = response?.choices?.[0]?.message?.content || "";

    const cleanJson = text.replace(/```json|```/g, "").trim();

    return JSON.parse(cleanJson);
  } catch (error: any) {
    console.error("Azure OpenAI failed:", error.message);
    return getMockData(transcript);
  }
};

const getMockData = (transcript: string) => {
  return {
    clientProfile: {
      budgetRange: "₹80L–₹95L",
      loanRequirement: "Required",
      familySize: "3",
      urgency: "Immediate"
    },
    interestSignals: {
      preference: "3BHK",
      floorPreference: "Any",
      vastuImportance: "Medium",
      locationPriority: "Shela",
      parkingRequirement: "2"
    },
    financialIntelligence: {
      expectedRent: "₹30k",
      builderScheme: "Standard",
      negotiationPossibility: "High",
      discountProbability: "Medium",
      holdingPeriod: "3 years"
    },
    dealProbabilityScore: 65,
    keyConcerns: ["Price too high", "Wife not convinced"],
    suggestedAction:
      "Call after 3 days to check on bank loan approval progress.",
    speakers: [
      { id: "Speaker 0", role: "Broker", name: "Not mentioned" },
      { id: "Speaker 1", role: "Client", name: "Not mentioned" }
    ]
  };
};