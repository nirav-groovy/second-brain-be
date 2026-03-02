export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROFILE_PENDING = 'profile-pending',
}

export enum MeetingStatus {
  TRANSCRIBE_GENERATING = 'transcribe-generating',
  SPEAKERS_GENERATING = 'speakers-generating',
  INTELLIGENCE_GENERATING = 'intelligence-generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
