import CalendarEvent from '@/models/CalendarEvent';

export const scheduleFollowUp = async (brokerId: string, meetingId: string, aiResponse: any) => {
  try {
    let followUpDateStr = aiResponse.follow_up_date;

    // If using 'pankaj' prompt, follow_up_date is explicitly provided
    // If using 'nirav' prompt, we might look for follow-up in suggestedAction or metadata
    if (!followUpDateStr || followUpDateStr === "Under Evaluation" || followUpDateStr === "Not mentioned") {
      console.log('No specific follow-up date found to schedule.');
      return null;
    }

    // Parse DD-MMM-YYYY (Day) format
    // Example: 01-Mar-2026 (Sunday)
    const datePart = followUpDateStr.split(' ')[0]; // 01-Mar-2026
    const eventDate = new Date(datePart);

    if (isNaN(eventDate.getTime())) {
      console.warn('Invalid follow-up date format:', followUpDateStr);
      return null;
    }

    const title = `Follow-up: ${aiResponse.summary?.slice(0, 50) || 'Meeting Follow-up'}`;
    const description = `Automated follow-up scheduled from meeting intelligence. 
Purpose: ${aiResponse.purpose || 'General Follow-up'}
Next Steps: ${Array.isArray(aiResponse.action_points) ? aiResponse.action_points.join(', ') : aiResponse.suggestedAction || 'N/A'}`;

    const newEvent = new CalendarEvent({
      brokerId,
      meetingId,
      title,
      description,
      eventDate,
    });

    await newEvent.save();
    console.log('Successfully scheduled follow-up event for:', eventDate);
    return newEvent;
  } catch (error) {
    console.error('Error scheduling follow-up:', error);
    return null;
  }
};
