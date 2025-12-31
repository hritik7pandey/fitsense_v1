// Default avatar URL
export const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=FitSense';

// App name
export const APP_NAME = 'FitSense Fitness Hub';

// Workout types
export const WORKOUT_TYPES = [
  'strength',
  'cardio', 
  'hiit',
  'yoga',
  'flexibility',
  'endurance',
  'full-body',
] as const;

// Diet types
export const DIET_TYPES = [
  'weight_loss',
  'muscle_gain',
  'maintenance',
  'keto',
  'vegan',
  'high_protein',
] as const;

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
] as const;

// Activity levels
export const ACTIVITY_LEVELS = [
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
  'extremely_active',
] as const;

// Gender options
export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
] as const;

// Membership statuses
export const MEMBERSHIP_STATUSES = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  BLOCKED: 'BLOCKED',
  CANCELLED: 'CANCELLED',
} as const;

// Role types
export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

// Notification types
export const NOTIFICATION_TYPES = [
  'WORKOUT',
  'DIET',
  'MEMBERSHIP',
  'GENERAL',
  'ALERT',
  'ANNOUNCEMENT',
] as const;

// IST Timezone
export const IST_TIMEZONE = 'Asia/Kolkata';

// Format date to IST
export const formatToIST = (
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    ...options,
  });
};

// Format date only to IST
export const formatDateIST = (
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
};

// Format time only to IST
export const formatTimeIST = (
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
};

// Format datetime to IST (full)
export const formatDateTimeIST = (
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
};
