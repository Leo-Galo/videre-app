
export type ClinicPlan = "Basic" | "Pro" | "Premium";
export type ClinicStatus = "Active" | "Suspended" | "Trialing" | "Expired" | "Cancelled";

export interface ClinicTenant {
  id: string;
  name: string;
  adminEmail: string;
  plan: ClinicPlan;
  status: ClinicStatus;
  users: number;
  branches: number;
  createdAt: string;
  nextBillingDate?: string;
  trialEndDate?: string;
}

export interface VidereSubscription {
  id: string;
  clinicId: string;
  clinicName: string;
  planName: ClinicPlan;
  status: "Active" | "Trialing" | "PastDue" | "Cancelled" | "PaymentFailed" | "Expired";
  amount: number;
  currency: "USD" | "CRC";
  billingCycle: "Monthly" | "Annually";
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
  trialEndDate?: string;
  paymentMethodDetails?: string;
  lastAttemptDate?: string;
  cancelDate?: string;
}

export type BackupStatus = 'Completed' | 'Failed' | 'InProgress';
export type BackupType = 'Manual' | 'Scheduled';

export interface BackupRecord {
  id: string;
  timestamp: string;
  status: BackupStatus;
  size: string;
  type: BackupType;
  initiatedBy?: string;
}

export type IssueStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed' | 'PendingClient';
export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface SupportIssue {
  id: string;
  title: string;
  description: string;
  reportedByClinicId?: string;
  reportedByClinicName?: string;
  reportedByUserEmail?: string;
  assignedTo?: string;
  status: IssueStatus;
  priority: IssuePriority;
  createdAt: string;
  updatedAt: string;
  resolutionNotes?: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  messageExcerpt: string;
  fullMessage: string;
  receivedAt: string;
  status: 'New' | 'InProgress' | 'Resolved' | 'Archived';
  clinicName?: string;
}

export interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  author: string;
  status: 'Published' | 'Draft' | 'Archived';
  createdAt: string;
  updatedAt: string;
  content?: string;
  image?: string;
  dataAiHint?: string;
  tags?: string[];
}
