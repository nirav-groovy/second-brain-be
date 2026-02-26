import dotenv from "dotenv";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index";

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

export const extractDealIntelligence = async (transcript: string, promptUsed: 'nirav' | 'pankaj') => {
  if (!isEnabled || !AZURE_OPENAI_API_KEY) {
    console.warn("Azure OpenAI disabled or missing key, returning mock data");
    return { ai_response: getMockData(transcript, promptUsed), promptUsed };
  }

  try {
    const MAX_CHARS = 12000;
    const safeTranscript = transcript.length > MAX_CHARS ? transcript.slice(0, MAX_CHARS) : transcript;

    const response = await azureClient.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: getPrompt(safeTranscript, promptUsed),
      temperature: 0.2,
      max_tokens: 1500
    });

    const text = response?.choices?.[0]?.message?.content || "";
    const cleanJson = text.replace(/```json|```/g, "").trim();

    return { ai_response: JSON.parse(cleanJson), promptUsed };
  } catch (error: any) {
    console.error("Azure OpenAI failed:", error.message);
    return { ai_response: getMockData(transcript, promptUsed), promptUsed };
  }
};

const getPrompt = (transcript: string, from: 'nirav' | 'pankaj'): ChatCompletionMessageParam[] => {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' });
  // Example: 25-Feb-2026 (Wednesday)

  if (from === "nirav") {
    return [
      {
        role: "system",
        content: `You are an expert real estate deal intelligence engine. Today's date is ${currentDate}.
        If anyone mentions a day (e.g., "next Sunday") or a relative time, convert it to a specific date in the format: DD-MMM-YYYY (Day).
        Example: If today is Wednesday, 25-Feb-2026, and someone says "next Sunday", use "01-Mar-2026 (Sunday)".
        
        Your goal is to help brokers understand who they talked to (Buyer vs Seller) and what the most critical points were for each party.
        The transcript may be multilingual. Return strictly valid JSON.`
      },
      {
        role: "user",
        content: `
Analyze the following transcript. 
1. Identify if the primary lead is a Buyer, Seller, or Other.
2. Extract the main key points specifically for that lead.
3. Provide a concise summary and a 1-2 line "brokerTakeaway".
4. Provide a suggested next action.

Transcript:
"""
${transcript}
"""

Return JSON structure:
{
  "conversationType": "Buyer | Seller | General | Other",
  "summary": "Executive summary",
  "brokerTakeaway": "1-2 line punchy takeaway to help the broker remember the core of this conversation after many days",
  "mainKeyPoints": [
    { "point": "The specific detail/requirement/promise", "party": "Buyer | Seller | Broker", "category": "Financial | Requirement | Concern | Promise" }
  ],
  "clientProfile": { "budgetRange": "string or Not mentioned", "loanRequirement": "string or Not mentioned", "urgency": "string or Not mentioned" },
  "dealProbabilityScore": number (0-100)
  "suggestedAction": "Clear next step for the broker",
  "speakers": [ { "id": "Speaker ID from transcript", "role": "Buyer | Seller | Broker | Unknown", "name": "Name if mentioned" } ],
  "metadata": { "anyOtherRelevantInfo": "Dynamic fields based on conversation" }
}

Rules:
- Be precise about who said what.
- If it's a Seller, focus on listing price, property condition, and motivation.
- If it's a Buyer, focus on budget, requirements, and urgency.
- No markdown.
`
      }
    ];
  } else {
    return [
      {
        role: "system",
        content: `You are a Senior Real Estate Investment Strategy Consultant. Today's date is ${currentDate}.
        If anyone mentions a day or relative time, convert it to a specific date in the format: DD-MMM-YYYY (Day).

        Your goal is to analyze the provided transcript and convert raw conversation into professional, refined, and highly accurate investment intelligence. 

        CRITICAL GUIDELINES:
          - DO NOT just repeat what was said. Refine and professionalize the content.
          - "summary": Synthesize the conversation into a strategic overview.
          - "purpose": The primary reason for the call/meeting (e.g., Inquiry, Site Visit, Negotiation).
          - "main_interest": Clearly define the client's core requirement using professional real estate terminology.
          - "deal_score": A number from 0-100 representing lead quality.
          - "score_analysis": Brief reasoning for the assigned deal score.
          - "action_points": Array of next steps for the agent.
          - "follow_up_date": Suggested date for the next contact (calculated from current date). If no date is mentioned, use "Not mentioned".
          - "highlights": Key moments from the conversation.
          - "budget": Interpret the financial capacity, noting any flexibility or specific loan-to-value ratios mentioned.
          - "urgency": Evaluate the client's timeline based on verbal cues (e.g., "Ready to move" implies High Urgency).
          - "unit_preference": Detail the specific asset class and configuration preferences professionally.
          - "financing_requirement": Analyze the client's financial strategy (e.g., "70% LTV via Home Loan").
          - "objections": Identify underlying concerns or hesitations that might not be explicitly stated as "objections".
          - "risk_factors": Conduct a brief SWOT analysis—what are the potential deal-breakers or external market risks?
          - "builder_commitments": Note any professional guarantees, timelines, or incentives offered during the pitch.
        Format as a clean JSON object. If a data point is missing, use "Under Evaluation" instead of "Not specified".`
      },
      {
        role: "user",
        content: `
Analyze this transcript:
"""
${transcript}
"""

Return JSON structure:
{
  "summary": "Strategic overview",
  "purpose": "Inquiry | Site Visit | Negotiation",
  "main_interest": "Core requirement",
  "deal_score": number,
  "score_analysis": "Reasoning",
  "action_points": ["string"],
  "follow_up_date": "DD-MMM-YYYY (Day)",
  "highlights": ["string"],
  "budget": "string",
  "urgency": "string",
  "unit_preference": "string",
  "financing_requirement": "string",
  "objections": ["string"],
  "risk_factors": ["string SWOT"],
  "builder_commitments": ["string"]
}
`
      }
    ];
  }
};

const getMockData = (transcript: string, promptUsed: 'nirav' | 'pankaj') => {
  if (promptUsed === 'nirav') {
    return {
      conversationType: "Buyer",
      summary: "Client interested in 3BHK in Shela.",
      brokerTakeaway: "Emotionally attached to Vastu, needs 80% loan.",
      mainKeyPoints: [{ point: "Needs 80% funding", party: "Buyer", category: "Financial" }],
      clientProfile: { budgetRange: "₹80L–₹95L", loanRequirement: "Required", urgency: "Immediate" },
      dealProbabilityScore: 65,
      suggestedAction: "Share Vastu units list.",
      speakers: [{ id: "Speaker 0", role: "Broker", name: "Not mentioned" }],
      metadata: { propertyType: "3BHK" }
    };
  } else {
    return {
      summary: "Strategic inquiry into high-value residential assets.",
      purpose: "Inquiry",
      main_interest: "Luxury 3BHK Residence",
      deal_score: 65,
      score_analysis: "High interest but dependent on external financing.",
      action_points: ["Connect with mortgage consultant", "Provide Vastu-certified plans"],
      follow_up_date: "01-Mar-2026 (Sunday)",
      highlights: ["Strong focus on location-specific appreciation"],
      budget: "₹80M - ₹95M Range",
      urgency: "High - Immediate Acquisition",
      unit_preference: "3BHK Vastu-Compliant",
      financing_requirement: "80% LTV Target",
      objections: ["Maintenance costs in premium segments"],
      risk_factors: ["Financing approval delay"],
      builder_commitments: ["Standard structural warranty"]
    };
  }
};
