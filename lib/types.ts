// Shared shapes for the dashboard data. The API routes return ApiResult<T> so
// the client can distinguish "not configured yet" from "real error" from "ok".

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; needsSetup?: boolean };

export interface EmailItem {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string | null;
}

export interface InboxData {
  unreadCount: number;
  messages: EmailItem[];
}

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  modifiedBy: string | null;
  webViewLink: string | null;
}

export interface DriveData {
  files: DriveItem[];
}

export interface TaskItem {
  id: string;
  name: string;
  status: string;
  due: string | null;
  url: string;
}

export interface TasksData {
  open: TaskItem[];
  doneCount: number;
}

export interface ComplaintItem {
  id: string;
  complaintId: string;
  complainant: string;
  doctor: string;
  status: string;
  categories: string[];
  receivedDate: string | null;
  inquiryDate: string | null;
  url: string;
}

export interface ComplaintsData {
  total: number;
  byStatus: Record<string, number>;
  byBucket: { todo: number; inProgress: number; done: number };
  upcomingInquiries: ComplaintItem[];
  recent: ComplaintItem[];
}

export interface BriefingData {
  briefing: string;
  generatedAt: string;
}
