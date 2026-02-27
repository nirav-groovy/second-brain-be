import dotenv from "dotenv";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index";

dotenv.config();

const {
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_DEPLOYMENT_NAME,
  AZURE_OPENAI_API_VERSION,
} = process.env;


// Initialize Azure OpenAI only if key is present to prevent crashes in CI/Tests
const azureClient = AZURE_OPENAI_API_KEY ? new OpenAI({
  apiKey: AZURE_OPENAI_API_KEY,
  baseURL: `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { "api-version": AZURE_OPENAI_API_VERSION },
  defaultHeaders: {
    "api-key": AZURE_OPENAI_API_KEY!
  }
}) : null;

export const extractDealIntelligence = async (transcript: string) => {
  if (!azureClient || !AZURE_OPENAI_API_KEY) {
    console.warn("Azure OpenAI disabled or missing key, returning mock data");
    return { ai_response: getMockData(), long_transcript: false };
  }

  try {
    const MAX_CHARS = 12000;
    const is_max_char = transcript.length > MAX_CHARS;
    const safeTranscript = is_max_char ? transcript.slice(0, MAX_CHARS) : transcript;

    const response = await azureClient.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: getPrompt(safeTranscript),
      temperature: 0.2,
      max_tokens: 1500
    });

    const text = response?.choices?.[0]?.message?.content || "";
    const cleanJson = text.replace(/```json|```/g, "").trim();

    return { ai_response: JSON.parse(cleanJson), long_transcript: is_max_char };
  } catch (error: any) {
    console.error("Azure OpenAI failed:", error.message);
    return { ai_response: getMockData(), long_transcript: false };
  }
};

export const identifySpeakers = async (transcript: string) => {
  if (!azureClient || !AZURE_OPENAI_API_KEY) return null;

  try {
    const response = await azureClient.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: [
        {
          role: "system",
          content: `You are an expert at identifying speaker names and translating multilingual Indian real estate transcripts (English, Hindi, Gujarati) into English.
          Your goal is to map Speaker IDs (e.g., "0", "1") to their real names and roles based on conversational cues.
          Carefully deduce who is speaking. For example, if Speaker 0 says "Hello Nirav", then Speaker 1 is likely Nirav. If Speaker 0 says "I am Nirav", then Speaker 0 is Nirav.
          Be sensitive to Indian naming conventions and honorifics (like -bhai, -ben, Mr., Shrimati).
          Also, identify that the speaker is one of: "Buyer", "Seller", "Broker", or "Other".`
        },
        {
          role: "user",
          content: `Analyze this JSON transcript, map the speakers to their real names and roles, and translate the conversation to English.
          
          Transcript:
          """
          ${transcript}
          """
          
          Do NOT return JSON. Return the transcript formatted exactly as plain text, translating everything to English.
          Format each line as:
          "{Speaker Name or 'Speaker X'} ({Role}): {Translated English text}"
          `
        }
      ],
      temperature: 0,
      max_tokens: 4000
    });

    const text = response?.choices?.[0]?.message?.content || "";
    return text.trim();
  } catch (error) {
    console.error("Speaker identification failed:", error);
    return null;
  }
};

const getPrompt = (transcript: string): ChatCompletionMessageParam[] => {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' });

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
Analyze the following multilingual JSON transcript array (can contain English, Hindi, Gujarati, mixed, Marathi, etc). 
1. Identify if the primary lead is a Buyer, Seller, or Other.
2. Extract the main key points specifically for that lead.
3. Provide a concise summary and a 1-2 line "brokerTakeaway".
4. Provide a suggested next action.

JSON Transcript:
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
  "metadata": { "anyOtherRelevantInfo": "Dynamic fields based on conversation" },
  "client_name": "Name of the buyer or seller if identified"
}

Rules:
- Be precise about who said what.
- If it's a Seller, focus on listing price, property condition, and motivation.
- If it's a Buyer, focus on budget, requirements, and urgency.
- No markdown.
`
    }
  ];
};

const getMockData = () => {
  return {
    conversationType: "Buyer",
    summary: "Client interested in 3BHK in Shela.",
    brokerTakeaway: "Emotionally attached to Vastu, needs 80% loan.",
    mainKeyPoints: [{ point: "Needs 80% funding", party: "Buyer", category: "Financial" }],
    clientProfile: { budgetRange: "₹80L–₹95L", loanRequirement: "Required", urgency: "Immediate" },
    dealProbabilityScore: 65,
    suggestedAction: "Share Vastu units list.",
    speakers: [{ id: "Speaker 0", role: "Broker", name: "Not mentioned" }],
    metadata: { propertyType: "3BHK" },
    client_name: "Not mentioned"
  };
};
