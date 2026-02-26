import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@deepgram/sdk';

dotenv.config();

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
const deepgram = createClient(DEEPGRAM_API_KEY);

const SAMPLE_SCRIPTS = [
  {
    transcript: `Broker: Good morning Mr. Sharma, welcome to SkyHigh Residency. Aaj hum 3BHK sample flat dekhenge.
Client: Good morning. Haan, I've been looking for something in this area. Shela is quite developing now.
Broker: Exactly sir. This unit is 1850 sqft. Purely Vastu compliant. Entrance is East-facing.
Client: Okay, living room toh kaafi spacious hai. Kitchen mein utility space kitni hai?
Broker: Utility space 6 by 4 ki hai sir. Alag se washing machine area diya hai.
Wife: Interior kaafi achha hai, but kitchen thoda chhota lag raha hai humein. Can we expand this?
Broker: Ma'am, structural wall hai so we can't move it, but we can provide more overhead storage. 
Client: Budget ka kya scene hai? Last time you mentioned 1.2 Crore.
Broker: Sir, base price 1.2 Cr hai. Including GST, Stamp Duty and 2 parking slots, it will go around 1.35 Cr.
Client: 1.35 Cr is a bit high for me. Mera budget stretch karke maximum 1.25 Cr tak ja sakta hai inclusive of everything.
Broker: Sir, I can talk to the developer. Agar aap aaj token dete hain, toh maybe we can work on the parking charges.
Client: Loan ka kya process hai? I'm looking for 80% funding.
Broker: Humare paas SBI aur HDFC ke saath tie-up hai. 3 din mein doorstep document collection ho jayega.
Client: Theek hai, mujhe Vastu report aur carpet area breakdown mail kar do. I will discuss with my father and let you know by Sunday.`,
    speakers: [{ id: 'S1', role: 'Broker' }, { id: 'S2', role: 'Buyer' }, { id: 'S3', role: 'Buyer' }]
  },
  {
    transcript: `Broker: Hello Mr. Patel, regarding your penthouse in Satellite area. I have a potential buyer.
Seller: Hello. Satelite waala property? Yes, tell me. What is their profile?
Broker: He is a local businessman, looking for immediate possession. Unka budget around 4.5 Cr hai.
Seller: 4.5 Cr? No way. I told you specifically, 5 Crore se niche main baat bhi nahi karunga. It's a prime location with a private terrace.
Broker: Sir, market thoda slow hai abhi, and there are new projects coming up nearby. Buyer is ready with full payment in 15 days. No loan.
Seller: Dekho, immediate payment is good, but value is value. Main 4.8 Cr tak aa sakta hoon, but not a rupee less. 
Broker: 4.8 Cr... theek hai, let me try to push him. Usne pucha tha ki maintenance dues clear hain?
Seller: Haan, sab clear hai. Last week hi society ka NOC liya hai for some other work. 
Broker: Perfect. And wooden flooring ka kaam finish ho gaya?
Seller: Almost done. 2 days mein complete ho jayega. You can show the flat on Friday evening.
Broker: Done sir. Friday 6 PM fixed. Main buyer ko update kar deta hoon.`,
    speakers: [{ id: 'S1', role: 'Broker' }, { id: 'S2', role: 'Seller' }]
  },
  {
    transcript: `Broker: Sir, yeh builder ka naya scheme hai - 20:80 subvention. Aapko sirf 20% abhi dena hai, baaki possession pe.
Client: Subvention schemes are risky. What if the project gets delayed?
Broker: Yeh RERA registered hai sir. Completion date Dec 2026 hai. Builder ka track record kaafi strong hai.
Client: Puraane projects ka delivery kaisa tha? I heard some issues in their last project in Gota.
Broker: Gota waale project mein environmental clearance ka issue tha, but yahan saare papers ready hain. I can show you the file.
Client: I need 2 car parkings side-by-side. Is it possible?
Broker: Generally allotment random hoti hai, but for specific request we can charge 2 Lakhs extra for fixed side-by-side spots.
Client: 2 Lakhs extra? That's too much. Society charges kitne hain?
Broker: 3 saal ka advance maintenance 4 Lakhs hai. 
Client: Total costing ka breakdown sheet do mujhe. Plus, I want to see the actual unit, not just the show flat.
Broker: Construction abhi 10th floor tak pahucha hai, aapka unit 14th floor pe hai. Safety reasons ki wajah se abhi allow nahi karenge, but I can take you to the 8th floor to show the view.
Client: Okay, let's go. View is very important for my wife. Aur terrace garden ki access sabko hai?
Broker: Haan, it's a common amenity on the 22nd floor.
Client: Fine, let's check the 8th floor. If view is good, we can sit and discuss numbers.`,
    speakers: [{ id: 'S1', role: 'Broker' }, { id: 'S2', role: 'Buyer' }]
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
        language: 'multi',
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
