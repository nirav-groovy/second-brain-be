import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';

import User from '@/models/User';
import Meeting from '@/models/Meeting';
import Project from '@/models/Project';
import { logError } from '@/utils/logger';
import { transcribeAudio } from '@/services/sttService';
import { UserStatus, MeetingStatus } from '@/types/enums';
import { getPaginationMetadata } from '@/utils/pagination';
import { scheduleFollowUp } from '@/services/calendarService';
import { extractDealIntelligence, identifySpeakers } from '@/services/dealIntelligenceService';

export const createMeeting = async (req: any, res: Response, next: NextFunction) => {
  const FUNCTION_NAME = 'createMeeting';
  try {
    const { title, projectId } = req.body;
    const audioUrl = req.file ? req.file.path : null;
    console.log(`[Meeting] Creating new meeting: "${title}" for project: ${projectId}`);

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
        console.log(`[Meeting ${savedMeeting._id}] Starting background processing...`);

        // 1. Convert Speech to Text (STT)
        console.log(`[Meeting ${savedMeeting._id}] Step 1: Transcribing audio from ${audioUrl}`);
        const sttResult = await transcribeAudio(audioUrl, effectiveProjectId.toString());
        let mappedTranscript = sttResult?.diarized_transcript?.entries || [];
        console.log(`[Meeting ${savedMeeting._id}] STT Result entries count: ${mappedTranscript.length}`);

        savedMeeting.sttService = sttResult.sttService || 'Unknown';
        savedMeeting.originalTranscript = JSON.stringify(mappedTranscript);
        savedMeeting.status = MeetingStatus.SPEAKERS_GENERATING;
        await savedMeeting.save();

        // 2. Map Speaker Names if available from the transcript
        if (sttResult?.diarized_transcript && sttResult?.diarized_transcript.entries) {
          console.log(`[Meeting ${savedMeeting._id}] Step 2: Identifying speakers and roles...`);
          const updatedTranscript = await identifySpeakers(JSON.stringify(sttResult?.diarized_transcript.entries));
          console.log(`[Meeting ${savedMeeting._id}] Speaker Identification finished.`);
          if (typeof updatedTranscript === 'string') {
            mappedTranscript = updatedTranscript as any;
          } else if (updatedTranscript && Array.isArray(updatedTranscript)) {
            mappedTranscript = updatedTranscript;
          }
        }

        savedMeeting.status = MeetingStatus.INTELLIGENCE_GENERATING;
        await savedMeeting.save();

        // 3. Extract AI Understanding (Deal Intelligence)
        console.log(`[Meeting ${savedMeeting._id}] Step 3: Extracting AI Intelligence...`);
        const finalTranscriptText = typeof mappedTranscript === 'string' ? mappedTranscript : JSON.stringify(mappedTranscript);
        const result = await extractDealIntelligence(finalTranscriptText);

        if (!result || !result.ai_response) {
          throw new Error('AI Intelligence extraction failed to return valid response');
        }

        const { ai_response, long_transcript } = result;
        console.log(`[Meeting ${savedMeeting._id}] AI Intelligence extracted successfully.`);

        // Direct Storage Mapping
        savedMeeting.detectedContext = ai_response.detectedContext;
        savedMeeting.conversationType = ai_response.conversationType || 'General';
        savedMeeting.priorityScore = ai_response.priorityScore || 0;
        savedMeeting.summary = ai_response.summary;
        savedMeeting.keyTakeaway = ai_response.keyTakeaway;
        savedMeeting.mainKeyPoints = ai_response.mainKeyPoints || [];
        savedMeeting.participantProfiles = ai_response.participantProfiles || [];
        savedMeeting.actionItems = ai_response.actionItems || [];
        savedMeeting.suggestedAction = ai_response.suggestedAction;
        savedMeeting.metadata = ai_response.metadata;

        // Map Client Info
        const client = ai_response.participantProfiles?.find((s: any) => s.role === 'Buyer' || s.role === 'Seller');
        if (ai_response.client_name && ai_response.client_name !== 'Not mentioned') {
          savedMeeting.clientName = ai_response.client_name;
        } else if (client) {
          savedMeeting.clientName = client.name !== 'Not mentioned' ? client.name : undefined;
        }

        savedMeeting.transcript = finalTranscriptText;
        savedMeeting.long_transcript = long_transcript;
        savedMeeting.status = MeetingStatus.COMPLETED;
        await savedMeeting.save();

        // 4. Automatically Schedule Follow-up in Calendar
        console.log(`[Meeting ${savedMeeting._id}] Step 4: Checking for follow-up scheduling...`);
        await scheduleFollowUp(req.user.id, (savedMeeting._id as string), ai_response);

        console.log(`[Meeting ${savedMeeting._id}] Background processing COMPLETED.`);
      } catch (bgError: any) {
        console.error(`[Meeting ${savedMeeting._id}] Background processing FAILED:`, bgError);

        // Log background error to database
        await logError(bgError, {
          userId: req.user.id,
          source: 'BACKGROUND_TASK',
          functionName: 'createMeeting_background',
          context: { meetingId: savedMeeting._id, step: 'Background Processing' }
        });

        savedMeeting.status = MeetingStatus.FAILED;
        await savedMeeting.save();
      }
    })();

    return;
  } catch (error: any) {
    console.error(`[Meeting] ${FUNCTION_NAME} error:`, error);
    return next(error);
  }
};

export const getMeetings = async (req: any, res: Response, next: NextFunction) => {
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

    const response: any = [];
    for (const meeting of meetings) {
      response.push({
        id: meeting._id,
        title: meeting.title,
        status: meeting.status,
        audioUrl: meeting.audioUrl,
        createdAt: meeting.createdAt,
        sttService: meeting.sttService,
        project_name: meeting.projectId,
        client_name: meeting.clientName,
        long_transcript: meeting.long_transcript,
        ai_response: {
          summary: meeting.summary,
          metadata: meeting.metadata,
          transcript: meeting.transcript,
          actionItems: meeting.actionItems,
          keyTakeaway: meeting.keyTakeaway,
          mainKeyPoints: meeting.mainKeyPoints,
          priorityScore: meeting.priorityScore,
          suggestedAction: meeting.suggestedAction,
          detectedContext: meeting.detectedContext,
          conversationType: meeting.conversationType,
          originalTranscript: meeting.originalTranscript,
          participantProfiles: meeting.participantProfiles,
        }
      });
    }

    // Get pagination metadata
    const pagination = await getPaginationMetadata(totalCount, currentPage, pageSize);

    return res.json({
      success: true,
      data: response,
      pagination
    });
  } catch (error: any) {
    return next(error);
  }
};

export const getCRMStats = async (req: any, res: Response, next: NextFunction) => {
  try {
    const stats = await Meeting.aggregate([
      { $match: { brokerId: new mongoose.Types.ObjectId(req.user.id), status: MeetingStatus.COMPLETED } },
      {
        $group: {
          _id: null,
          totalMeetings: { $sum: 1 },
          avgPriority: { $avg: '$priorityScore' },
          highPriorityMeetings: { $sum: { $cond: [{ $gte: ['$priorityScore', 80] }, 1, 0] } },
          // Count by industry (takes first from array)
          industries: { $push: { $arrayElemAt: ['$detectedContext.industry', 0] } },
          natures: { $push: { $arrayElemAt: ['$detectedContext.nature', 0] } }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          totalMeetings: 0,
          avgPriority: 0,
          highPriorityMeetings: 0,
          industryBreakdown: {},
          natureBreakdown: {}
        }
      });
    }

    const result = stats[0];

    // Helper to count frequencies
    const getFrequency = (arr: string[]) => arr.reduce((acc: any, val: string) => {
      if (val) acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      success: true,
      data: {
        totalMeetings: result.totalMeetings,
        avgPriority: Math.round(result.avgPriority || 0),
        highPriorityMeetings: result.highPriorityMeetings,
        industryBreakdown: getFrequency(result.industries),
        natureBreakdown: getFrequency(result.natures)
      }
    });
  } catch (error: any) {
    return next(error);
  }
};

export const getMeetingDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, brokerId: req.user.id });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    const response = {
      id: meeting._id,
      title: meeting.title,
      status: meeting.status,
      audioUrl: meeting.audioUrl,
      createdAt: meeting.createdAt,
      sttService: meeting.sttService,
      project_name: meeting.projectId,
      client_name: meeting.clientName,
      long_transcript: meeting.long_transcript,
      ai_response: {
        summary: meeting.summary,
        metadata: meeting.metadata,
        transcript: meeting.transcript,
        actionItems: meeting.actionItems,
        keyTakeaway: meeting.keyTakeaway,
        mainKeyPoints: meeting.mainKeyPoints,
        priorityScore: meeting.priorityScore,
        suggestedAction: meeting.suggestedAction,
        detectedContext: meeting.detectedContext,
        conversationType: meeting.conversationType,
        originalTranscript: meeting.originalTranscript,
        participantProfiles: meeting.participantProfiles,
      }
    }

    return res.json({ success: true, data: response });
  } catch (error: any) {
    return next(error);
  }
};

export const regenerateMeetingIntelligence = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    console.log(`[Meeting ${id}] Requested regeneration of intelligence...`);
    const meeting = await Meeting.findOne({ _id: id, brokerId: req.user.id });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    if (!meeting.transcript) {
      return res.status(400).json({ success: false, message: 'No transcript available for regeneration' });
    }

    meeting.status = MeetingStatus.INTELLIGENCE_GENERATING;
    await meeting.save();

    // Respond immediately
    res.json({ success: true, message: 'Regeneration started', data: meeting });

    // Background Processing
    (async () => {
      try {
        console.log(`[Meeting ${meeting._id}] Starting regeneration background process...`);
        const finalTranscriptText = typeof meeting.transcript === 'string' ? meeting.transcript : JSON.stringify(meeting.transcript);

        console.log(`[Meeting ${meeting._id}] Extracting AI Intelligence (Regenerate)...`);
        const result = await extractDealIntelligence(finalTranscriptText);

        if (!result || !result.ai_response) {
          throw new Error('AI Intelligence extraction failed to return valid response');
        }

        const { ai_response, long_transcript } = result;
        console.log(`[Meeting ${meeting._id}] AI Intelligence extracted successfully (Regenerate).`);

        // Direct Storage Mapping
        meeting.detectedContext = ai_response.detectedContext;
        meeting.conversationType = ai_response.conversationType || 'General';
        meeting.priorityScore = ai_response.priorityScore || 0;
        meeting.summary = ai_response.summary;
        meeting.keyTakeaway = ai_response.keyTakeaway;
        meeting.mainKeyPoints = ai_response.mainKeyPoints || [];
        meeting.participantProfiles = ai_response.participantProfiles || [];
        meeting.actionItems = ai_response.actionItems || [];
        meeting.suggestedAction = ai_response.suggestedAction;
        meeting.metadata = ai_response.metadata;

        // Map Client Info
        const client = ai_response.participantProfiles?.find((s: any) => s.role === 'Buyer' || s.role === 'Seller');
        if (ai_response.client_name && ai_response.client_name !== 'Not mentioned') {
          meeting.clientName = ai_response.client_name;
        } else if (client) {
          meeting.clientName = client.name !== 'Not mentioned' ? client.name : undefined;
        }

        meeting.long_transcript = long_transcript;
        meeting.status = MeetingStatus.COMPLETED;
        await meeting.save();

        // Re-schedule follow-up if needed
        console.log(`[Meeting ${meeting._id}] Checking follow-up (Regenerate)...`);
        await scheduleFollowUp(req.user.id, (meeting._id as string), ai_response);

        console.log(`[Meeting ${meeting._id}] Regeneration background process COMPLETED.`);
      } catch (bgError: any) {
        console.error(`[Meeting ${meeting._id}] Regeneration background process FAILED:`, bgError);

        // Log background error to database
        await logError(bgError, {
          userId: req.user.id,
          source: 'BACKGROUND_TASK',
          functionName: 'regenerateMeetingIntelligence_background',
          context: { meetingId: meeting._id, step: 'Regeneration' }
        });

        meeting.status = MeetingStatus.FAILED;
        await meeting.save();
      }
    })();

    return;
  } catch (error: any) {
    console.error(`[Meeting] Regeneration error:`, error);
    return next(error);
  }
};

export const deleteMeeting = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    console.log(`[Meeting] Requested deletion for meeting: ${id}`);

    const meeting = await Meeting.findOne({ _id: id, brokerId: req.user.id });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Remove files if they exist
    if (meeting.audioUrl && typeof meeting.audioUrl === 'string') {
      const audioUrl = meeting.audioUrl as string;
      const filePath = path.isAbsolute(audioUrl) ? audioUrl : path.join(process.cwd(), audioUrl);
      if (fs.existsSync(filePath)) {
        console.log(`[Meeting] Deleting file: ${filePath}`);
        fs.unlinkSync(filePath);
      }
    }

    // Delete from database
    await Meeting.deleteOne({ _id: id });
    console.log(`[Meeting] Deleted meeting ${id} from database.`);

    return res.json({ success: true, message: 'Meeting and associated files deleted successfully' });
  } catch (error: any) {
    console.error(`[Meeting] Delete error:`, error);
    return next(error);
  }
};
