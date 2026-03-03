import dotenv from "dotenv";
import OpenAI from "openai";
import { logError } from "@/utils/logger";
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

    console.log(`[AI] Extracting intelligence for transcript (${transcript.length} chars)...`);
    const response = await azureClient.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: getPrompt(safeTranscript),
      temperature: 0.2,
      max_tokens: 1500
    });

    const text = response?.choices?.[0]?.message?.content || "";
    console.log(`[AI] Raw intelligence response: ${text.slice(0, 500)}...`);
    const cleanJson = text.replace(/```json|```/g, "").trim();

    return { ai_response: JSON.parse(cleanJson), long_transcript: is_max_char };
  } catch (error: any) {
    // Log to error database
    await logError(error, {
      source: 'BACKGROUND_TASK',
      context: { transcriptSnippet: transcript.slice(0, 200), service: 'AzureOpenAI_Intelligence' }
    });
    return { ai_response: getMockData(), long_transcript: false };
  }
};

export const identifySpeakers = async (transcript: string) => {
  if (!azureClient || !AZURE_OPENAI_API_KEY) return null;

  try {
    console.log(`[AI] Identifying speakers for transcript (${transcript.length} chars)...`);
    const response = await azureClient.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: [
        {
          role: "system",
          content: `You are an expert at identifying speaker names and roles from professional transcripts. 
          The conversations can be in English, Hindi, Gujarati, or code-mixed.
          Your goal is to map Speaker IDs (e.g., "0", "1") to their names and logical roles (e.g., "Doctor", "Patient", "Interviewer", "Candidate") based on conversational cues.
          Carefully deduce who is speaking. For example, if Speaker 0 says "Hello Nirav", then Next Speaker is likely Nirav. If Speaker 0 says "I am Nirav", then Speaker 0 is Nirav.
          Be sensitive to Indian naming conventions and honorifics (like -bhai, -ben, Mr., Shrimati).
          CRITICAL: Ensure that distinct speakers have distinct names and roles. Do not assign the same name to different roles unless it is explicitly clear they share the same name.`
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
    console.log(`[AI] Raw speaker identification response: ${text.slice(0, 500)}...`);
    return text.trim();
  } catch (error: any) {
    // Log to error database
    await logError(error, {
      source: 'BACKGROUND_TASK',
      context: { transcriptSnippet: transcript.slice(0, 200), service: 'AzureOpenAI_Speakers' }
    });
    return null;
  }
};

const getPrompt = (transcript: string): ChatCompletionMessageParam[] => {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' });

  return [
    {
      role: "system",
      content: `You are an expert omni-industry conversation intelligence engine. Today's date is ${currentDate}.
      If anyone mentions a day (e.g., "next Sunday") or a relative time, convert it to a specific date in the format: DD-MMM-YYYY (Day).
      Example: If today is Wednesday, 25-Feb-2026, and someone says "next Sunday", use "01-Mar-2026 (Sunday)".
      IMPORTANT: This date conversion MUST be applied in EVERY field where a day or relative time is mentioned, including 'mainKeyPoints', 'summary', and 'suggestedAction'.

      Identify the industry and nature of the meeting automatically. 
      Your goal is to analyze multilingual transcripts from various professions (Real Estate, Healthcare, Education, Legal, Tech, etc.) and return strictly valid JSON.`
    },
    {
      role: "user",
      content: `
Analyze the following multilingual transcript (can contain English, Hindi, Gujarati, mixed, Marathi, etc). 
1. Detect the Industry and Nature of the conversation (as arrays).
2. Identify participants and map them to logical industry roles.
3. Extract key commitments, requirements, and financial markers.
4. Provide a concise summary and a "suggestedAction" with a specific date.
5. Create an "actionItems" array specifically for tasks and follow-ups.

Transcript:
"""
${transcript}
"""

Return JSON structure:
{
  "detectedContext": {
    "industry": ["e.g., Real Estate", "e.g., Legal"],
    "nature": ["e.g., Sales", "e.g., Consultation"]
  },
  "conversationType": "Primary intent of the conversation",
  "summary": "High-level overview of the meeting. Include specific dates for any mentioned days.",
  "keyTakeaway": "1-2 line punchy takeaway to help remember the core of this conversation",
  "mainKeyPoints": [
    { "point": "The specific detail/requirement/promise. Include specific dates for any mentioned days.", "party": "Mapped Role (e.g., Patient, Buyer)", "category": "Financial | Requirement | Concern | Medical | Technical" }
  ],
  "participantProfiles": [
    {
      "speakerId": "Speaker ID from transcript",
      "name": "Name of person",
      "role": "Detected Role",
      "attributes": { "budget_or_salary": "If applicable", "urgency_or_priority": "High | Medium | Low", "key_concern": "Main blocker or interest" }
    }
  ],
  "actionItems": [
    { "date": "DD-MMM-YYYY (Day)", "task": "Specific task to be performed", "performedBy": "Role or Name of person responsible" }
  ],
  "priorityScore": number (0-100),
  "suggestedAction": "Clear next step. MUST INCLUDE A SPECIFIC DATE in DD-MMM-YYYY format if mentioned or implied.",
  "metadata": { "anyOtherRelevantInfo": "Dynamic fields based on conversation" },
  "client_name": "Primary client/lead name identified"
}

Rules:
- Be precise about who said what.
- Ensure that different participants are NOT assigned the same name unless explicitly stated.
- Translate any multilingual segments (Hindi, Gujarati, Marathi, etc.) to English.
- Return strictly valid JSON.
- No markdown.
`
    }
  ];
};

const getMockData = () => {
  return {
    detectedContext: {
      industry: ["Healthcare", "Wellness"],
      nature: ["Consultation", "Lifestyle"]
    },
    conversationType: "Patient Consultation",
    summary: "Patient Rajesh consulting for knee pain and lifestyle changes.",
    keyTakeaway: "Knee inflammation remains; physiotherapy and weight management recommended.",
    mainKeyPoints: [{ point: "Needs MRI if pain continues for 10 days", party: "Doctor", category: "Medical" }],
    participantProfiles: [
      { speakerId: "1", name: "Rajesh", role: "Patient", attributes: { urgency_or_priority: "High", key_concern: "Surgery fear" } }
    ],
    actionItems: [
      { date: "14-Mar-2026 (Saturday)", task: "Physiotherapy session", performedBy: "Patient" }
    ],
    priorityScore: 75,
    suggestedAction: "Schedule follow-up for 14-Mar-2026",
    metadata: { propertyType: "N/A" },
    client_name: "Rajesh"
  };
};
