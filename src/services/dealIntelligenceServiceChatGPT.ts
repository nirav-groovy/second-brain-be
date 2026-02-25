import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const extractDealIntelligence = async (transcript: string) => {
  if (!OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY missing, returning mock data");
    return getMockData(transcript);
  }
  const MAX_CHARS = 8000;
  const tooLong = transcript.length > MAX_CHARS;
  transcript = tooLong
    ? transcript.slice(0, MAX_CHARS)
    : transcript;

  if (tooLong) {
    console.warn("Transcript is too long, truncating");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2, // lower randomness = better JSON compliance
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "deal_intelligence",
          schema: {
            type: "object",
            properties: {
              clientProfile: {
                type: "object",
                properties: {
                  budgetRange: { type: "string" },
                  loanRequirement: { type: "string" },
                  familySize: { type: "string" },
                  urgency: { type: "string" }
                },
                required: ["budgetRange", "loanRequirement", "familySize", "urgency"]
              },
              interestSignals: {
                type: "object",
                properties: {
                  preference: { type: "string" },
                  floorPreference: { type: "string" },
                  vastuImportance: { type: "string" },
                  locationPriority: { type: "string" },
                  parkingRequirement: { type: "string" }
                },
                required: [
                  "preference",
                  "floorPreference",
                  "vastuImportance",
                  "locationPriority",
                  "parkingRequirement"
                ]
              },
              financialIntelligence: {
                type: "object",
                properties: {
                  expectedRent: { type: "string" },
                  builderScheme: { type: "string" },
                  negotiationPossibility: { type: "string" },
                  discountProbability: { type: "string" },
                  holdingPeriod: { type: "string" }
                },
                required: [
                  "expectedRent",
                  "builderScheme",
                  "negotiationPossibility",
                  "discountProbability",
                  "holdingPeriod"
                ]
              },
              dealProbabilityScore: { type: "number" },
              keyConcerns: {
                type: "array",
                items: { type: "string" }
              },
              suggestedAction: { type: "string" },
              speakers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    role: { type: "string" },
                    name: { type: "string" }
                  },
                  required: ["id", "role", "name"]
                }
              }
            },
            required: [
              "clientProfile",
              "interestSignals",
              "financialIntelligence",
              "dealProbabilityScore",
              "keyConcerns",
              "suggestedAction",
              "speakers"
            ]
          }
        }
      },
      messages: [
        {
          role: "system",
          content:
            "You are a real estate deal intelligence engine. Extract structured deal intelligence from transcripts."
        },
        {
          role: "user",
          content: `
            Analyze the following transcript and extract intelligence.

            Transcript:
            """
            ${transcript}
            """

            Rules:
            - If data missing → use "Not mentioned"
            - Score dealProbabilityScore from 0-100 based on urgency + budget alignment + intent
            - Identify Broker and Client
            - Return valid JSON only
          `
        }
      ]
    });

    return JSON.parse(response?.choices?.[0]?.message?.content!);
  } catch (error: any) {
    console.error("GPT-4o-mini failed:", error.message);
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