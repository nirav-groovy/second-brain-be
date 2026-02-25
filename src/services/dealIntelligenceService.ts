import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const extractDealIntelligence = async (transcript: string) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
    console.warn('GEMINI_API_KEY is missing, returning mock data');
    return getMockData(transcript);
  }

  // We try gemini-1.5-flash first, then fallback to gemini-pro if needed
  const modelsToTry = ['gemini-1.5-flash', 'gemini-pro'];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting intelligence extraction with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `
        You are a real estate deal intelligence engine. 
        Analyze the following transcript of a conversation between a broker and potential client(s).
        Extract structured intelligence into a strict JSON format.
        
        Transcript:
        """
        ${transcript}
        """
        
        Return ONLY a JSON object with this exact structure:
        {
          "clientProfile": {
            "budgetRange": "string",
            "loanRequirement": "string (Required/Not Required/Maybe)",
            "familySize": "string",
            "urgency": "string (Immediate/1-3 months/Long-term/Investment)"
          },
          "interestSignals": {
            "preference": "string (e.g. 2BHK, 3BHK, Villa)",
            "floorPreference": "string",
            "vastuImportance": "string (High/Medium/Low)",
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
          "dealProbabilityScore": number (0-100),
          "keyConcerns": ["string"],
          "suggestedAction": "string",
          "speakers": [
            { "id": "string", "role": "string (Broker/Client)", "name": "string (if mentioned)" }
          ]
        }
        
        If information is missing, use "Not mentioned". 
        For dealProbabilityScore, calculate based on urgency, budget fit, and interest.
        Identify who is the Broker and who is the Client from the context.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const cleanJson = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);

      return data;
    } catch (error: any) {
      lastError = error;
      console.warn(`Model ${modelName} failed: ${error.message}`);
      // Continue to next model if 404
      if (error.status === 404) continue;
      // Break if other fatal error
      break;
    }
  }

  console.error('All Gemini models failed. Last error:', lastError);
  return getMockData(transcript);
};

const getMockData = (transcript: string) => {
  console.log('Using mock deal intelligence');
  let extracted: any = {
    clientProfile: { budgetRange: '₹80L–₹95L', loanRequirement: 'Required', familySize: '3', urgency: 'Immediate' },
    interestSignals: { preference: '3BHK', floorPreference: 'Any', vastuImportance: 'Moderate', locationPriority: 'Shela', parkingRequirement: '2' },
    financialIntelligence: { expectedRent: '₹30k', builderScheme: 'Standard', negotiationPossibility: 'High', discountProbability: 'Medium', holdingPeriod: '3 years' },
    dealProbabilityScore: 65,
    keyConcerns: ['Price too high', 'Wife not convinced'],
    suggestedAction: 'Call after 3 days to check on bank loan approval progress.',
    speakers: [{ id: 'Speaker 0', role: 'Broker' }, { id: 'Speaker 1', role: 'Client' }]
  };

  if (transcript.includes('1.2 Crore')) {
    extracted.clientProfile.budgetRange = '₹1.2Cr';
    extracted.dealProbabilityScore = 40;
  }
  return extracted;
};
