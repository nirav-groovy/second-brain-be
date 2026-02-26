import fs from 'fs';
import dotenv from 'dotenv';
import { SarvamAIClient } from "sarvamai";
import { createClient } from '@deepgram/sdk';

dotenv.config();

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
const deepgram = createClient(DEEPGRAM_API_KEY);

const SAMPLE_SCRIPTS = [
  {
    title: "Hinglish Meeting with Broker and Buyer",
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
    title: "Hinglish Meeting with Broker and Seller",
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
    title: "Hinglish Meeting with Broker and Buyer",
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
  },
  {
    title: "Gujarati Meeting with Broker and Buyer",
    transcript: `
    Broker: Hello, Jigneshbhai, aa navu project che, "Saffron Heights". Yeh location bahut jordar hai.
    Client: Hello, Location toh barabar che, par construction quality kaisi hogi?
    
    Broker: Quality ekdam top-notch che. Humne deewal ma red bricks vapraya che.
    Wife: Kitchen ma platform motu joiye. Humari family badi hai toh space joyie.
    
    Broker: Ma'am, kitchen design bau j modern che. Hum extra storage pan banavi aapenge.
    Client: Budget ketlu che? Last time aapne 1.5 Cr bola tha.
    
    Broker: Ha, base price 1.5 Cr che. Pan tame NRI cho toh benefits malshe.
    Client: Final price ma ketlo farak padshe? I want a clear breakdown.
    
    Broker: Sir, baithi ne vaat kariye. Token ready hoy toh hu owner sathe vaat kari saku. Price negotiable che.
    Wife: Amne Vastu mujab j ghar joiye. Entrance North-East hi hovu joiyie.
    
    Broker: Chinta mat karo, badha j flats Vastu compliant che. Aa map juo, badhu perfect che.
    Client: Thik che. Kal sanje avi ne site visit karenge. Location check kari ne final kariye.`,

    speakers: [{ id: 'S1', role: 'Broker' }, { id: 'S2', role: 'Buyer' }, { id: 'S3', role: 'Buyer' }]
  }
];

export const transcribeAudio = async (audioUrl: string | null, fromSample: boolean = false) => {
  if (fromSample) {
    console.log('Using sample script for transcription');
    const sample = SAMPLE_SCRIPTS[Math.floor(Math.random() * SAMPLE_SCRIPTS.length)] || SAMPLE_SCRIPTS[0];
    return sample;
  }

  if (!audioUrl) throw new Error('Audio file path is required for real STT');

  // We are now prioritizing Sarvam AI for Indian language support and diarization.
  return await transcribeAudioSarvam(audioUrl);
};

// Keeping Deepgram as a fallback or secondary option
const transcribeAudioDeepgram = async (audioUrl: string) => {
  console.log(`Transcribing real audio from: ${audioUrl} using Deepgram Nova-3 Multilingual`);

  try {
    const { result, error } = (await deepgram.listen.prerecorded.transcribeFile(
      fs.readFileSync(audioUrl),
      {
        model: 'nova-2',
        language: 'multi',
        smart_format: true,
        diarize: true,
        punctuate: true,
        utterances: true,
      }
    )) as any;

    if (error) throw error;

    const alternative = result?.results?.channels?.[0]?.alternatives?.[0];
    const words = alternative?.words;
    const paragraphs = alternative?.paragraphs;

    let diarizedTranscript = '';
    const uniqueSpeakers = new Set<string>();

    // Priority 1: Use paragraphs for best readability if available
    if (paragraphs && paragraphs.paragraphs.length > 0) {
      console.log('Processing transcript using paragraphs structure');
      for (const p of paragraphs.paragraphs) {
        diarizedTranscript += `Speaker ${p.speaker}: ${p.sentences.map((s: any) => s.text).join(' ')}\n`;
        uniqueSpeakers.add(`Speaker ${p.speaker}`);
      }
    }
    // Priority 2: Use word-level diarization if paragraphs are missing (common in multi-language)
    else if (words && words.length > 0) {
      console.log('Processing transcript using word-level diarization');
      let currentSpeaker = words[0].speaker;
      diarizedTranscript += `Speaker ${currentSpeaker}: `;
      uniqueSpeakers.add(`Speaker ${currentSpeaker}`);

      for (const word of words) {
        if (word.speaker !== currentSpeaker) {
          currentSpeaker = word.speaker;
          diarizedTranscript += `\nSpeaker ${currentSpeaker}: `;
          uniqueSpeakers.add(`Speaker ${currentSpeaker}`);
        }
        diarizedTranscript += (word.punctuated_word || word.word) + ' ';
      }
    }
    // Fallback: Just the raw transcript
    else {
      console.log('Fallback: Using raw transcript without speaker labels');
      diarizedTranscript = alternative?.transcript ?? "";
    }

    return {
      transcript: diarizedTranscript.trim(),
      speakers: Array.from(uniqueSpeakers).map(s => ({
        id: s.startsWith('Speaker ') ? s.split(' ')[1] : s,
        role: 'Other'
      }))
    };
  } catch (err: any) {
    console.error('Deepgram Error:', err);
    throw new Error('Speech-to-text conversion failed via Deepgram: ' + err.message);
  }
};

// Keeping Deepgram as a fallback or secondary option
const transcribeAudioSarvam = async (audioUrl: string) => {
  console.log(`Transcribing real audio from: ${audioUrl} using Deepgram Nova-3 Multilingual`);

  try {
    const client = new SarvamAIClient({
      apiSubscriptionKey: SARVAM_API_KEY
    });

    // Create batch job — change mode as needed
    const job = await client.speechToTextJob.createJob({
      model: "saaras:v3",
      // mode: "codemix",
      languageCode: "unknown",
      withDiarization: true,
      // numSpeakers: 2
    });

    // Upload and process files
    const audioPaths = [audioUrl];
    await job.uploadFiles(audioPaths);
    await job.start();

    // Wait for completion
    await job.waitUntilComplete();

    // Check file-level results
    const fileResults = await job.getFileResults();

    console.log(`\nSuccessful: ${fileResults.successful.length}`);
    for (const f of fileResults.successful) {
      console.log(`  ✓ ${f.file_name}`);
    }

    console.log(`\nFailed: ${fileResults.failed.length}`);
    for (const f of fileResults.failed) {
      console.log(`  ✗ ${f.file_name}: ${f.error_message}`);
    }

    // Download outputs for successful files
    if (fileResults.successful.length > 0) {
      await job.downloadOutputs("./output");
      console.log(`\nDownloaded ${fileResults.successful.length} file(s) to: ./output`);
    }

    return {
      transcript: "",
      speakers: []
    };
  } catch (err: any) {
    console.error('Deepgram Error:', err);
    throw new Error('Speech-to-text conversion failed via Deepgram: ' + err.message);
  }
};
