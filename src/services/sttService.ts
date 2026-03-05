import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { SarvamAIClient } from "sarvamai";
import { logError } from '@/utils/logger';
import { createClient } from '@deepgram/sdk';

dotenv.config();

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';

// Initialize Deepgram only if API key is present to prevent crashes in CI/Tests
const deepgram = DEEPGRAM_API_KEY ? createClient(DEEPGRAM_API_KEY) : null;

/**
 * Detects the language of an audio file using a small sample (approx 512KB).
 * To avoid bias from initial greetings (which are often in English), it takes 
 * a random chunk from the file while preserving the initial header.
 * @returns Detected language code (e.g., 'en', 'hi')
 */
const detectLanguage = async (audioUrl: string): Promise<string> => {
  if (!deepgram) return 'unknown';

  try {
    const stats = fs.statSync(audioUrl);
    const maxSampleSize = 512 * 1024;

    let buffer: Buffer;

    // If file is small, just read the whole thing
    if (stats.size <= maxSampleSize) {
      buffer = fs.readFileSync(audioUrl);
    } else {
      // 1. Preserve the first 8KB (header) so Deepgram can identify the audio format/codec
      const headerSize = 8192; 
      const remainingSampleSize = maxSampleSize - headerSize;

      const fd = fs.openSync(audioUrl, 'r');
      const headerBuffer = Buffer.alloc(headerSize);
      fs.readSync(fd, headerBuffer, 0, headerSize, 0);

      // 2. Pick a random offset for the rest of the sample to avoid initial greetings (bias towards English)
      // We start the random range after the header to ensure we don't overlap
      const maxOffset = stats.size - remainingSampleSize;
      const position = headerSize + Math.floor(Math.random() * (maxOffset - headerSize));

      const chunkBuffer = Buffer.alloc(remainingSampleSize);
      fs.readSync(fd, chunkBuffer, 0, remainingSampleSize, position);
      fs.closeSync(fd);

      // 3. Combine header and random chunk into a single buffer for processing
      buffer = Buffer.concat([headerBuffer, chunkBuffer]);
      console.log(`[STT] Language detection sample: header(0-8KB) + random chunk from offset ${position}`);
    }

    const { result, error } = (await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-2',
        detect_language: true,
      }
    )) as any;

    if (error) return 'unknown';
    return result?.results?.channels?.[0]?.detected_language || 'unknown';
  } catch (err) {
    console.warn('[STT] Language detection failed, defaulting to unknown:', err);
    return 'unknown';
  }
};
export const transcribeAudio = async (audioUrl: string | null, projectId: string = 'unnamed') => {
  if (!audioUrl) throw new Error('Audio file path is required for STT');

  try {
    console.log(`[STT] Processing audio for project: ${projectId}`);

    // Cost Optimization: Detect language first
    const detectedLang = await detectLanguage(audioUrl);
    console.log(`[STT] Detected language: ${detectedLang}`);

    let result;
    if (detectedLang === 'en') {
      console.log(`[STT] English detected. Using Deepgram for cost optimization (~35% savings).`);
      result = await transcribeAudioDeepgram(audioUrl);
    } else {
      console.log(`[STT] Non-English or unknown language detected (${detectedLang}). Using Sarvam AI for superior Indian language support.`);
      result = await transcribeAudioSarvam(audioUrl, projectId);
    }

    return { ...result, language: detectedLang };
  } catch (error) {
    // Log to error database before throwing further
    await logError(error, {
      source: 'BACKGROUND_TASK',
      context: { audioUrl, projectId, service: 'STT_MASTER' }
    });
    throw error;
  }
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
      sttService: 'Deepgram',
      transcript: diarizedTranscript.trim(),
      speakers: Array.from(uniqueSpeakers).map(s => ({
        id: s.startsWith('Speaker ') ? s.split(' ')[1] : s,
        role: 'Other'
      }))
    };
  } catch (err: any) {
    // Log internal deepgram error
    await logError(err, {
      source: 'BACKGROUND_TASK',
      context: { audioUrl, service: 'Deepgram' }
    });
    throw new Error('Speech-to-text conversion failed via Deepgram: ' + err.message);
  }
};

const transcribeAudioSarvam = async (audioUrl: string, projectId: string) => {
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
      // Create project-specific output directory
      const outputDir = path.join(process.cwd(), 'uploads', 'outputs', projectId);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      await job.downloadOutputs(outputDir);

      const originalFileName = path.basename(audioUrl);
      const outputFilePath = path.join(outputDir, `${originalFileName}.json`);
      if (fs.existsSync(outputFilePath)) {
        const fileContent = fs.readFileSync(outputFilePath, 'utf8');
        return {
          sttService: 'Sarvam',
          ...JSON.parse(fileContent)
        };
      }
    }

    return {
      sttService: 'Sarvam',
      transcript: "",
      speakers: []
    };
  } catch (err: any) {
    // Log Sarvam error
    await logError(err, {
      source: 'BACKGROUND_TASK',
      context: { audioUrl, projectId, service: 'Sarvam' }
    });
    // Fallback if Sarvam fails
    return await transcribeAudioDeepgram(audioUrl);
  }
};
