import { Response } from 'express';
import Meeting from '@/models/Meeting';
import { transcribeAudio } from '@/services/sttService';
import { extractDealIntelligence } from '@/services/dealIntelligenceService';

export const createMeeting = async (req: any, res: Response) => {
  try {
    const { title, fromSample, usePrompt = 'nirav' } = req.body;
    const isSample = fromSample === 'yes';
    const audioUrl = req.file ? req.file.path : null;

    // 1. Convert Speech to Text (STT) - Now returns { transcript, speakers }
    const sttResult = await transcribeAudio(audioUrl, isSample);
    console.log(`🚀 ~ meetingController.ts:14 ~ sttResult:`, sttResult);
    const transcript = sttResult?.transcript;
    const speakers = sttResult?.speakers;

    // 2. Extract AI Understanding (Deal Intelligence)
    const { ai_response, promptUsed } = await extractDealIntelligence(transcript ?? "", usePrompt);
    console.log(`🚀 ~ meetingController.ts:19 ~ ai_response:`, ai_response);

    const newMeeting = new Meeting({
      brokerId: req.user.id,
      title,
      audioUrl: audioUrl || 'sample-audio-url',
      transcript,
      speakers,
      ai_response,
      promptUsed,
    });

    const savedMeeting = await newMeeting.save();
    return res.status(201).json({ success: true, data: savedMeeting });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getMeetings = async (req: any, res: Response) => {
  try {
    const meetings = await Meeting.find({ brokerId: req.user.id });
    return res.json({ success: true, data: meetings });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getMeetingDetail = async (req: any, res: Response) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, brokerId: req.user.id });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    return res.json({ success: true, data: meeting });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
