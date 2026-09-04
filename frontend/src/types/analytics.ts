export type TimeRange = '1h' | '24h' | '7d' | '30d';

export interface TrafficPoint {
  timestamp: string;
  requests: number;
  bandwidthBytes: number;
  status2xx: number;
  status3xx: number;
  status4xx: number;
  status5xx: number;
}

export interface TopRequestedUrl {
  path: string;
  count: number;
  bandwidthBytes: number;
  avgResponseMs: number;
}

export interface TopVisitorIp {
  ip: string;
  country: string;
  requests: number;
  bandwidthBytes: number;
}

export interface TopUserAgent {
  name: string;
  count: number;
  percentage: number;
}

export interface VisitorAnalyticsResponse {
  timeRange: TimeRange;
  domainName?: string;
  totalRequests: number;
  uniqueVisitors: number;
  totalBandwidthBytes: number;
  avgResponseTimeMs: number;
  statusDistribution: {
    status2xx: number;
    status3xx: number;
    status4xx: number;
    status5xx: number;
  };
  trafficTimeSeries: TrafficPoint[];
  topUrls: TopRequestedUrl[];
  topIps: TopVisitorIp[];
  topUserAgents: TopUserAgent[];
}

export interface EmailDeliveryHop {
  step: number;
  stage: 'queued' | 'mx_lookup' | 'handshake' | 'delivered' | 'bounced' | 'deferred';
  timestamp: string;
  server: string;
  message: string;
}

export interface EmailLogEntry {
  id: string;
  timestamp: string;
  sender: string;
  recipient: string;
  subject: string;
  status: 'delivered' | 'bounced' | 'deferred' | 'rejected' | 'spam';
  sizeBytes: number;
  clientIp: string;
  hops: EmailDeliveryHop[];
}

export interface EmailAnalyticsResponse {
  timeRange: TimeRange;
  totalSent: number;
  delivered: number;
  bounced: number;
  deferred: number;
  spam: number;
  successRate: number;
  bounceRate: number;
  timeSeries: {
    timestamp: string;
    delivered: number;
    bounced: number;
    deferred: number;
  }[];
  topSenders: { email: string; count: number }[];
  topRecipients: { domain: string; count: number }[];
  recentLogs: EmailLogEntry[];
}

export type LogLevel = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG';
export type LogSource = 'nginx_access' | 'nginx_error' | 'apache' | 'php_error' | 'mail' | 'syslog' | 'cron';

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  source: LogSource;
  level: LogLevel;
  domain?: string;
  message: string;
  clientIp?: string;
  requestPath?: string;
  stackTrace?: string;
  contextJson?: Record<string, unknown>;
}

export interface ErrorAnalyticsResponse {
  timeRange: TimeRange;
  totalErrors: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  levelDistribution: Record<LogLevel, number>;
  logs: ErrorLogEntry[];
}

export interface FolderDiskUsage {
  folder: string;
  path: string;
  sizeBytes: number;
  percentage: number;
}

export interface DiskBandwidthAnalyticsResponse {
  disk: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    percentageUsed: number;
    userQuotaMb: number;
    userUsedMb: number;
    breakdown: FolderDiskUsage[];
  };
  bandwidth: {
    monthlyLimitGb: number;
    usedGb: number;
    percentageUsed: number;
    projectedMonthEndGb: number;
    dailyUsage: { date: string; bytes: number }[];
  };
}

export interface LogAnalyticsAlert {
  id: string;
  userId: string;
  metricType: 'error_5xx' | 'disk_usage' | 'email_bounce' | 'bandwidth';
  thresholdValue: number;
  channel: 'email' | 'system_notification' | 'webhook';
  target?: string;
  isEnabled: boolean;
  createdAt: string;
}

export interface LogAnalyticsSettings {
  retentionDays: number;
  autoRotate: boolean;
  compressionEnabled: boolean;
  webLogPath: string;
  mailLogPath: string;
  errorLogPath: string;
}

export interface OverviewMetricsResponse {
  totalVisitorsToday: number;
  activeErrorAlerts: number;
  emailDeliveryRate: number;
  diskUsedPercentage: number;
  bandwidthUsedGb: number;
  recentCriticalLogs: ErrorLogEntry[];
}

// ─── Access Log ──────────────────────────────────────────────────────────────

export interface AccessLogEntry {
  id: string;
  timestamp: string;
  domain?: string;
  ip: string;
  method: string;
  path: string;
  status: number;
  bytes: number;
  userAgent: string;
  requestTimeMs: number | null;
  raw: string;
}

export interface AccessLogAnalyticsResponse {
  timeRange: TimeRange;
  domainName?: string;
  totalRequests: number;
  statusDistribution: {
    status2xx: number;
    status3xx: number;
    status4xx: number;
    status5xx: number;
  };
  entries: AccessLogEntry[];
}
