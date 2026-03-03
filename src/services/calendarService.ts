import { logError } from '@/utils/logger';
import CalendarEvent from '@/models/CalendarEvent';

export const scheduleFollowUp = async (brokerId: string, meetingId: string, aiResponse: any) => {
  try {
    const actionItems = aiResponse.actionItems || [];

    if (actionItems.length === 0) {
      console.log('No action items found to schedule.');
      return [];
    }

    const createdEvents = [];

    for (const item of actionItems) {
      const { date: dateStr, task, performedBy } = item;

      if (!dateStr || dateStr === "Under Evaluation" || dateStr === "Not mentioned") {
        console.log(`Skipping action item without specific date: ${task}`);
        continue;
      }

      // Parse DD-MMM-YYYY (Day) format
      // Example: 04-Mar-2026 (Wednesday)
      const datePart = dateStr.split(' ')[0]; // 04-Mar-2026
      const eventDate = new Date(datePart);

      if (isNaN(eventDate.getTime())) {
        console.warn('Invalid follow-up date format:', dateStr);
        continue;
      }

      const title = `Task: ${task || 'Meeting Follow-up'}`;
      const description = `Automated task scheduled from meeting intelligence.
Task: ${task}
Performed By: ${performedBy || 'N/A'}
Meeting Summary: ${aiResponse.summary?.slice(0, 200) || 'N/A'}`;

      const newEvent = new CalendarEvent({
        brokerId,
        meetingId,
        title,
        description,
        eventDate,
      });

      await newEvent.save();
      console.log(`Successfully scheduled event: "${title}" for ${eventDate}`);
      createdEvents.push(newEvent);
    }

    return createdEvents;
  } catch (error) {
    // Log to error database
    await logError(error, {
      userId: brokerId,
      source: 'BACKGROUND_TASK',
      context: { meetingId, step: 'Calendar Scheduling' }
    });
    return null;
  }
};
