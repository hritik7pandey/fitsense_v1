// Database types matching the existing Prisma schema

export type Role = 'ADMIN' | 'MEMBER';
export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'BLOCKED';
export type PlanSource = 'ADMIN' | 'MEMBER' | 'AI';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  role: Role;
  isBlocked: boolean;
  avatarUrl: string | null;
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
  gender: string | null;
  bmi: number | null;
  bmr: number | null;
  createdAt: Date;
  updatedAt: Date;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
}

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description: string | null;
  features: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Membership {
  id: string;
  userId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  id: string;
  userId: string;
  date: Date;
  checkIn: Date;
  checkOut: Date | null;
  createdAt: Date;
}

export interface Workout {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  source: PlanSource;
  content: any;
  isAssigned: boolean;
  assignedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Diet {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  source: PlanSource;
  content: any;
  isAssigned: boolean;
  assignedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: string;
  error: string | null;
  sentAt: Date;
}

// Extended types for API responses
export interface UserWithMembership extends Omit<User, 'password'> {
  membership?: MembershipWithPlan | null;
}

export interface MembershipWithPlan extends Membership {
  plan: Plan;
}

export interface MembershipWithUser extends Membership {
  user: Pick<User, 'id' | 'name' | 'email'>;
  plan: Plan;
}

export interface WorkoutWithUser extends Workout {
  user: Pick<User, 'id' | 'name' | 'email'>;
}

export interface DietWithUser extends Diet {
  user: Pick<User, 'id' | 'name' | 'email'>;
}

export interface AttendanceWithUser extends Attendance {
  user: Pick<User, 'id' | 'name' | 'email'>;
}

// Pagination type
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// JWT payload type
export interface JWTPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}
