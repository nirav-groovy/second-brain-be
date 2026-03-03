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

export interface ErrorContext {
  userId?: string | undefined;
  source: 'API' | 'BACKGROUND_TASK' | 'SYSTEM';
  level?: 'ERROR' | 'WARN' | 'CRITICAL' | undefined;
  endpoint?: string | undefined;
  functionName?: string;
  method?: string | undefined;
  requestBody?: any;
  queryParams?: any;
  context?: any;
  ipAddress?: string | undefined;
}