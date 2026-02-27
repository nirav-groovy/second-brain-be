import fs from 'fs';
import dotenv from 'dotenv';
import { SarvamAIClient } from "sarvamai";
import { createClient } from '@deepgram/sdk';

dotenv.config();

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';

// Initialize Deepgram only if API key is present to prevent crashes in CI/Tests
const deepgram = DEEPGRAM_API_KEY ? createClient(DEEPGRAM_API_KEY) : null;

export const transcribeAudio = async (audioUrl: string | null) => {
  if (!audioUrl) throw new Error('Audio file path is required for STT');

  // We are now prioritizing Sarvam AI for Indian language support and diarization.
  return await transcribeAudioSarvam(audioUrl);
};

// Keeping Deepgram as a fallback or secondary option
const transcribeAudioDeepgram = async (audioUrl: string) => {
  if (!deepgram) {
    throw new Error('Deepgram API key is missing. Cannot transcribe.');
  }

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

const transcribeAudioSarvam = async (audioUrl: string) => {
  if (!SARVAM_API_KEY) {
    console.warn("Sarvam API key missing, attempting Deepgram fallback");
    return await transcribeAudioDeepgram(audioUrl);
  }

  try {
    const client = new SarvamAIClient({
      apiSubscriptionKey: SARVAM_API_KEY
    });

    // Create batch job
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

    // Download outputs for successful files
    if (fileResults.successful.length > 0) {
      await job.downloadOutputs("./output");

      const path = require('path');
      const originalFileName = path.basename(audioUrl);
      const outputFilePath = path.join(process.cwd(), 'output', `${originalFileName}.json`);
      if (fs.existsSync(outputFilePath)) {
        const fileContent = fs.readFileSync(outputFilePath, 'utf8');
        return JSON.parse(fileContent);
      }
    }

    return {
      transcript: "",
      speakers: []
    };
  } catch (err: any) {
    console.error('Sarvam Error:', err);
    // Fallback if Sarvam fails
    return await transcribeAudioDeepgram(audioUrl);
  }
};
