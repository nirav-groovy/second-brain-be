import mongoose from 'mongoose';
import { Response } from 'express';

import User from '@/models/User';
import Meeting from '@/models/Meeting';
import Project from '@/models/Project';
import { transcribeAudio } from '@/services/sttService';
import { UserStatus, MeetingStatus } from '@/types/enums';
import { getPaginationMetadata } from '@/utils/pagination';
import { scheduleFollowUp } from '@/services/calendarService';
import { extractDealIntelligence, identifySpeakers } from '@/services/dealIntelligenceService';

export const createMeeting = async (req: any, res: Response) => {
  try {
    const { title, projectId } = req.body;
    const audioUrl = req.file ? req.file.path : null;

    let effectiveProjectId = projectId;

    if (projectId) {
      // Verify project exists and belongs to user
      const project = await Project.findOne({ _id: projectId, ownerId: req.user.id });
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    } else {
      // Create or find an "Unnamed Project"
      let unnamedProject = await Project.findOne({ name: 'Unnamed Project', ownerId: req.user.id });
      if (!unnamedProject) {
        unnamedProject = new Project({
          name: 'Unnamed Project',
          description: 'Default project for meetings without a specified project.',
          ownerId: req.user.id
        });
        await unnamedProject.save();
      }
      effectiveProjectId = unnamedProject._id;
    }

    // Check Verification Status and Limits
    const user: any = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: 'Your profile is incomplete. Please complete your profile by selecting a category before creating meetings.'
      });
    }

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
      projectId: effectiveProjectId,
      title,
      audioUrl: audioUrl,
      status: MeetingStatus.TRANSCRIBE_GENERATING
    });
    const savedMeeting = await newMeeting.save();

    // Respond immediately so frontend can poll the new status
    res.status(201).json({ success: true, data: savedMeeting });

    // Background Processing
    (async () => {
      try {
        // 1. Convert Speech to Text (STT)
        const sttResult = await transcribeAudio(audioUrl);
        let mappedTranscript = sttResult?.diarized_transcript?.entries || [];

        savedMeeting.status = MeetingStatus.SPEAKERS_GENERATING;
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

        savedMeeting.status = MeetingStatus.INTELLIGENCE_GENERATING;
        await savedMeeting.save();

        // 3. Extract AI Understanding (Deal Intelligence)
        const finalTranscriptText = typeof mappedTranscript === 'string' ? mappedTranscript : JSON.stringify(mappedTranscript);
        const result = await extractDealIntelligence(finalTranscriptText);

        if (!result || !result.ai_response) {
          throw new Error('AI Intelligence extraction failed to return valid response');
        }

        const { ai_response, long_transcript } = result;

        // Update CRM Metadata
        savedMeeting.conversationType = ai_response.conversationType || 'General';
        savedMeeting.dealProbabilityScore = ai_response.dealProbabilityScore || 0;

        // Map Client Info from speakers or specific client_name field
        const client = ai_response.speakers?.find((s: any) => s.role === 'Buyer' || s.role === 'Seller');
        if (ai_response.client_name && ai_response.client_name !== 'Not mentioned') {
          savedMeeting.clientName = ai_response.client_name;
        } else if (client) {
          savedMeeting.clientName = client.name !== 'Not mentioned' ? client.name : undefined;
        }

        savedMeeting.transcript = finalTranscriptText;
        savedMeeting.ai_response = ai_response;
        savedMeeting.long_transcript = long_transcript;
        savedMeeting.status = MeetingStatus.COMPLETED;
        await savedMeeting.save();

        // 4. Automatically Schedule Follow-up in Calendar if date is present
        await scheduleFollowUp(req.user.id, (savedMeeting._id as string), ai_response);
      } catch (bgError: any) {
        console.error('Background processing failed for meeting:', savedMeeting._id, bgError);
        savedMeeting.status = MeetingStatus.FAILED;
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
      projectId,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const query: any = { brokerId: req.user.id };

    if (projectId) {
      query.projectId = projectId;
    }

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

    // Get total count for pagination
    const totalCount = await Meeting.countDocuments(query);

    // Fetch paginated data
    const meetings = await Meeting.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    // Get pagination metadata
    const pagination = await getPaginationMetadata(totalCount, currentPage, pageSize);

    return res.json({
      success: true,
      data: {
        data: meetings,
        pagination
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getCRMStats = async (req: any, res: Response) => {
  try {
    const stats = await Meeting.aggregate([
      { $match: { brokerId: new mongoose.Types.ObjectId(req.user.id), status: MeetingStatus.COMPLETED } },
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
