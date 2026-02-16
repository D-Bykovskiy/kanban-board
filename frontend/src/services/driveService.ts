const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface UploadReportRequest {
  filename: string;
  content: string;
  task_title: string;
}

export interface UploadReportResponse {
  success: boolean;
  file_id: string;
  filename: string;
  view_url: string;
  folder_name: string;
  message: string;
}

export const driveService = {
  async uploadReport(
    data: UploadReportRequest,
    accessToken: string
  ): Promise<UploadReportResponse> {
    const response = await fetch(`${API_BASE_URL}/drive/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload to Google Drive');
    }

    return response.json();
  },

  async listReports(accessToken: string) {
    const response = await fetch(`${API_BASE_URL}/drive/reports`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to list reports');
    }

    return response.json();
  },
};
