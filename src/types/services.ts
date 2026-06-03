export interface ServiceStatus {
  service_name: string;
  is_healthy: boolean;
  last_seen: string;
  version: string | null;
  uptime_seconds: number | null;
  summary_metrics: Record<string, unknown>;
}

export interface MetricRecord {
  recorded_at: string;
  metrics: Record<string, unknown>;
  sample_count?: number;
  is_compact: boolean;
}

export interface MetricHistory {
  records: MetricRecord[];
  modules: string[];
}

export type MetricHistoryParams = {
  service: string;
  module: string;
  from?: string;
  to?: string;
  limit?: number;
};

export interface BandwidthStats {
  total_req_bytes: number;
  total_resp_bytes: number;
}

export type UptimeDayStatus = "operational" | "incident" | "no_data";

export interface UptimeDay {
  date: string;
  status: UptimeDayStatus;
}

export interface ServiceUptime {
  service_name: string;
  uptime_pct: number | null;
  days: UptimeDay[];
}
