export interface RawWindowMetrics {
  windowStart: string
  blinkCount: number
  fixationEvents: number
  pupilRadiusSamples: number[]
  trackingQuality: 'good' | 'degraded' | 'lost'
}

export interface FocusWindow {
  user_id: string
  ts: string
  blink_rate: number
  fixation_count: number
  pupil_diameter_variance: number
  strain_score: number
  session_duration_min: number
  tracking_quality: 'good' | 'degraded'
}

export interface NudgeRequest {
  focusWindow: FocusWindow
  triggerType: 'acute' | 'chronic'
}

export interface NudgeResponse {
  nudge_text: string
  nudge_type: 'mild' | 'moderate' | 'urgent'
  window_id?: string
}

export interface IngestWindowBody {
  ts: string
  blink_rate: number
  fixation_count: number
  pupil_diameter_variance: number
  strain_score: number
  session_duration_min: number
  tracking_quality: 'good' | 'degraded'
  trigger_type: 'acute' | 'chronic' | null
  session_id?: string | null
}

// A tracking run. Aggregates are computed client-side on stop and persisted here.
export interface Session {
  id: string
  name: string
  started_at: string
  ended_at: string | null
  window_count: number
  avg_score: number | null
  peak_score: number | null
  duration_min: number
}

export interface EndSessionBody {
  id: string
  name: string
  started_at: string
  ended_at: string
  window_count: number
  avg_score: number
  peak_score: number
  duration_min: number
}

export interface SessionRow extends Session {
  user_id: string
  created_at: string
}

export interface DashboardSummary {
  avg_score: number
  peak_score: number
  min_score: number
  total_windows: number
  nudge_count: number
  total_time_min: number
}

export interface FocusWindowRow extends FocusWindow {
  id: string
  nudge_triggered: boolean
  created_at: string
  session_id?: string | null
}
