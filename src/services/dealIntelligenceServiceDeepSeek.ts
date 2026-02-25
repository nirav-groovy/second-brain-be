import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

const deepseek = new OpenAI({
  apiKey: DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com" // Important
});

export const extractDealIntelligence = async (transcript: string) => {
  if (!DEEPSEEK_API_KEY) {
    console.warn("DEEPSEEK_API_KEY missing, returning mock data");
    return getMockData(transcript);
  }

  try {
    // Hard cap transcript to avoid token explosion
    const MAX_CHARS = 12000;
    const safeTranscript =
      transcript.length > MAX_CHARS
        ? transcript.slice(0, MAX_CHARS)
        : transcript;

    const messages = [
      {
        role: "system",
        content:
          "You are a real estate deal intelligence engine. Return ONLY valid JSON."
      },
      {
        role: "user",
        content: `
Analyze this transcript and extract structured intelligence.

Transcript:
"""
${safeTranscript}
"""

Return strictly this JSON structure:

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

If data is missing use "Not mentioned".
Score dealProbabilityScore 0–100 based on urgency and intent.
`
      }
    ];
    console.log(`🚀 ~ dealIntelligenceServiceDeepSeek.ts:79 ~ messages:`, messages);
    return null;

    /*
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat", // Or deepseek-coder if testing structured logic
      temperature: 0.2,
      messages
    });

    const text = response?.choices?.[0]?.message?.content || "";

    // DeepSeek sometimes wraps JSON in markdown
    const cleanJson = text.replace(/```json|```/g, "").trim();

    return JSON.parse(cleanJson);
    */
  } catch (error: any) {
    console.error("DeepSeek failed:", error.message);
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