import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@deepgram/sdk';

dotenv.config();

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
const deepgram = createClient(DEEPGRAM_API_KEY);

const SAMPLE_SCRIPTS = [
  // (keeping existing SAMPLE_SCRIPTS)
  {
    transcript: "Broker: Welcome to the 3BHK show flat. It's 1250 sqft. \nClient: The living room is nice. What's the final price? \nBroker: We are quoted at 85 Lakhs. \nClient: Is there any discount? I have a 20 Lakh down payment ready, looking for a loan for the rest.",
    speakers: [{ id: 'S1', role: 'Broker' }, { id: 'S2', role: 'Client' }]
  },
  {
    transcript: "Broker: This project has a great clubhouse. \nHusband: My office is in Shela, so the location is perfect. \nWife: But the kitchen is small. Can we get a 3BHK instead of 2BHK? \nBroker: Yes, 3BHK starts from 95 Lakhs. \nWife: That's above our 80 Lakh budget. \nHusband: We might stretch if the loan eligibility is good.",
    speakers: [{ id: 'S1', role: 'Broker' }, { id: 'S2', role: 'Client' }, { id: 'S3', role: 'Client' }]
  },
  {
    transcript: "Junior Broker: This is the floor plan for the penthouse. \nSenior Broker: Actually, for this client, the 4th floor garden view is better. \nClient: I agree. Vastu is very important for me. Is it North facing? \nSenior Broker: Yes, fully Vastu compliant. The price is 1.2 Crore. \nClient: I need to check with my bank if they can fund 80% of this.",
    speakers: [{ id: 'S1', role: 'Broker' }, { id: 'S2', role: 'Broker' }, { id: 'S3', role: 'Client' }]
  },
  {
    transcript: "Broker: The expected rent here is 40,000 per month. \nPartner A: That's a 4% yield. Not bad for this area. \nPartner B: What about the holding period? \nBroker: Most investors here exit in 3 years with 20% appreciation. \nPartner A: We are looking to invest 2 Crores across two units.",
    speakers: [{ id: 'S1', role: 'Broker' }, { id: 'S2', role: 'Client' }, { id: 'S3', role: 'Client' }]
  },
  {
    transcript: "Broker: The builder is offering a 5 Lakh discount today. \nClient: Not enough. I know the neighbor got it for 72 Lakhs. \nBroker: That was a lower floor. \nClient: Give me 72 Lakhs and I'll sign the cheque right now. No loan, full payment in 30 days.",
    speakers: [{ id: 'S1', role: 'Broker' }, { id: 'S2', role: 'Client' }]
  }
];

export const transcribeAudio = async (audioUrl: string | null, fromSample: boolean = false) => {
  if (fromSample) {
    console.log('Using sample script for transcription');
    const sample = SAMPLE_SCRIPTS[Math.floor(Math.random() * SAMPLE_SCRIPTS.length)] || SAMPLE_SCRIPTS[0];
    return sample;
  }

  if (!audioUrl) throw new Error('Audio file path is required for real STT');

  console.log(`Transcribing real audio from: ${audioUrl} using Deepgram`);

  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      fs.readFileSync(audioUrl),
      {
        model: 'nova-2',
        smart_format: true,
        diarize: true,
        language: 'en', // Can be changed based on need
      }
    );

    if (error) throw error;

    // Process transcript into speaker-diarized text
    const paragraphs = result?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs;
    let diarizedTranscript = '';
    const uniqueSpeakers = new Set<string>();

    if (paragraphs) {
      for (const p of paragraphs.paragraphs) {
        diarizedTranscript += `Speaker ${p.speaker}: ${p.sentences.map((s: any) => s.text).join(' ')}\n`;
        uniqueSpeakers.add(`Speaker ${p.speaker}`);
      }
    } else {
      diarizedTranscript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
    }

    return {
      transcript: diarizedTranscript,
      speakers: Array.from(uniqueSpeakers).map(s => ({ id: s, role: 'Other' })) // AI will detect roles later
    };
  } catch (err: any) {
    console.error('Deepgram Error:', err);
    throw new Error('Speech-to-text conversion failed: ' + err.message);
  }
};
