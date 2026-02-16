const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface AIAnalysisRequest {
  title: string;
  description: string;
  priority: string;
  status: string;
  tags: string[];
  due_date?: string;
  estimated_hours?: number;
}

export interface AIAnalysisResponse {
  analysis: string;
  success: boolean;
}

export interface AIReportResponse {
  report: string;
  filename: string;
  success: boolean;
}

export const aiService = {
  async analyzeTask(data: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to analyze task');
    }

    return response.json();
  },

  async generateReport(data: AIAnalysisRequest): Promise<AIReportResponse> {
    const response = await fetch(`${API_BASE_URL}/ai/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate report');
    }

    return response.json();
  },
};
