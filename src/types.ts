export interface CaptureInput {
  text: string;
  source?: string;
}

export interface CaptureResult {
  id: number;
  type: string;
  topics: string[];
  people: string[];
  action_items: string[];
  created_at: string;
}
