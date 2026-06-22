export type PrijavaStatus = "pending" | "accepted" | "rejected";

export type PrijavaType = "volonter" | "medij" | "sponzor" | "ostalo";

export interface Prijava {
  id: string;
  name: string;
  email: string;
  type: PrijavaType;
  message: string;
  status: PrijavaStatus;
  /** Reason shown when a prijava is rejected. */
  reason?: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Visitor metrics ──────────────────────────────────────────────────────────

export interface MetricsDay {
  /** YYYY-MM-DD (UTC) */
  date: string;
  views: number;
  visitors: number;
}

export interface MetricsResponse {
  totalViews: number;
  uniqueVisitors: number;
  days: MetricsDay[];
  referrers: { source: string; count: number }[];
  devices: { mobile: number; desktop: number };
  retentionDays: number;
}
