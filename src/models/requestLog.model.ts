export interface RequestLog {
  timestamp: Date;
  method: string;
  url: string;
  status: number;
  responseTimeMs: number;
  contentLength: number;
  ip: string;
  userAgent: string | null;
  referrer: string | null;
  userId: string | null;
  requestBody: unknown;
  responseBody: unknown;
}
