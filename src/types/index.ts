export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
}

export interface HistoryItem {
  id: string;
  category: string;
  description: string;
  prompt: string;
  timestamp: number;
}

export interface GenerateRequest {
  category: string;
  description: string;
}

export interface GenerateResponse {
  prompt: string;
}
