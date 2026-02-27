import mongoose from 'mongoose';
import { Response } from 'express';

import User from '@/models/User';
import Meeting from '@/models/Meeting';
import { transcribeAudio } from '@/services/sttService';
import { extractDealIntelligence, identifySpeakers } from '@/services/dealIntelligenceService';
import { scheduleFollowUp } from '@/services/calendarService';

export const createMeeting = async (req: any, res: Response) => {
  try {
    const { title, fromSample, usePrompt = 'nirav' } = req.body;
    const isSample = fromSample === 'yes';
    const audioUrl = req.file ? req.file.path : null;

    // Check Verification Status and Limits
    const user: any = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isVerified = user?.emailVerified || user?.phoneVerified || false;
    if (!isVerified) {
      const meetingCount = await Meeting.countDocuments({ brokerId: req.user.id });
      if (meetingCount >= 5) {
        return res.status(403).json({
          success: false,
          message: 'Meeting limit reached for unverified accounts. Please verify your email and phone to create more meetings.'
        });
      }
    }

    // Create meeting entry with initial status
    const newMeeting = new Meeting({
      brokerId: req.user.id,
      title,
      audioUrl: audioUrl || 'sample-audio-url',
      promptUsed: usePrompt,
      status: 'transcribe-generating'
    });
    const savedMeeting = await newMeeting.save();

    // Respond immediately so frontend can poll the new status
    res.status(201).json({ success: true, data: savedMeeting });

    // Background Processing
    (async () => {
      try {
        // 1. Convert Speech to Text (STT)
        const sttResult = await transcribeAudio(audioUrl, isSample);
        let mappedTranscript = sttResult?.diarized_transcript?.entries || [];

        savedMeeting.status = 'speakers-generating';
        await savedMeeting.save();

        // 2. Map Speaker Names if available from the transcript
        if (sttResult?.diarized_transcript && sttResult?.diarized_transcript.entries) {
          const updatedTranscript = await identifySpeakers(JSON.stringify(sttResult?.diarized_transcript.entries));
          if (typeof updatedTranscript === 'string') {
            mappedTranscript = updatedTranscript as any;
          } else if (updatedTranscript && Array.isArray(updatedTranscript)) {
            mappedTranscript = updatedTranscript;
          }
        }

        savedMeeting.status = 'intelligence-generating';
        await savedMeeting.save();

        // 3. Extract AI Understanding (Deal Intelligence)
        const finalTranscriptText = typeof mappedTranscript === 'string' ? mappedTranscript : JSON.stringify(mappedTranscript);
        const { ai_response, long_transcript } = await extractDealIntelligence(finalTranscriptText, usePrompt);

        // Update CRM Metadata
        if (usePrompt === 'nirav') {
          savedMeeting.conversationType = ai_response.conversationType || 'General';
          savedMeeting.dealProbabilityScore = ai_response.dealProbabilityScore || 0;

          // Map Client Info from speakers if available
          const client = ai_response.speakers?.find((s: any) => s.role === 'Buyer' || s.role === 'Seller');
          if (client) {
            savedMeeting.clientName = client.name !== 'Not mentioned' ? client.name : undefined;
          }
        } else {
          savedMeeting.conversationType = ai_response.purpose || 'General';
          savedMeeting.dealProbabilityScore = ai_response.deal_score || 0;
          savedMeeting.clientName = ai_response.client_name !== 'Under Evaluation' ? ai_response.client_name : undefined;
        }

        savedMeeting.transcript = finalTranscriptText;
        savedMeeting.ai_response = ai_response;
        savedMeeting.promptUsed = usePrompt;
        savedMeeting.long_transcript = long_transcript;
        savedMeeting.status = 'completed';
        await savedMeeting.save();

        // 4. Automatically Schedule Follow-up in Calendar if date is present
        await scheduleFollowUp(req.user.id, (savedMeeting._id as string), ai_response);
      } catch (bgError: any) {
        console.error('Background processing failed for meeting:', savedMeeting._id, bgError);
        savedMeeting.status = 'failed';
        await savedMeeting.save();
      }
    })();

    return;
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getMeetings = async (req: any, res: Response) => {
  try {
    const {
      search,
      status,
      type,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query: any = { brokerId: req.user.id };

    // Text Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { transcript: { $regex: search, $options: 'i' } }
      ];
    }

    // Status Filter
    if (status) {
      query.status = status;
    }

    // Type Filter (Buyer/Seller/General)
    if (type) {
      query.conversationType = type;
    }

    const sortOptions: any = {};
    sortOptions[sortBy as string] = order === 'desc' ? -1 : 1;

    const meetings = await Meeting.find(query).sort(sortOptions);

    return res.json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getCRMStats = async (req: any, res: Response) => {
  try {
    const stats = await Meeting.aggregate([
      { $match: { brokerId: new mongoose.Types.ObjectId(req.user.id), status: 'completed' } },
      {
        $group: {
          _id: null,
          totalDeals: { $sum: 1 },
          avgProbability: { $avg: '$dealProbabilityScore' },
          buyers: { $sum: { $cond: [{ $eq: ['$conversationType', 'Buyer'] }, 1, 0] } },
          sellers: { $sum: { $cond: [{ $eq: ['$conversationType', 'Seller'] }, 1, 0] } },
          highProbabilityDeals: { $sum: { $cond: [{ $gte: ['$dealProbabilityScore', 80] }, 1, 0] } }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalDeals: 0,
      avgProbability: 0,
      buyers: 0,
      sellers: 0,
      highProbabilityDeals: 0
    };

    return res.json({ success: true, data: result });
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
