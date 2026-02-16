"""Google Drive Service for file upload."""

import io
from typing import Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.auth.transport.requests import Request

from app.config import settings


class DriveService:
    """Service for Google Drive operations."""

    # Folder name for reports
    REPORTS_FOLDER_NAME = "Kanban reports"

    def __init__(self, access_token: str, refresh_token: Optional[str] = None):
        """Initialize Drive service with OAuth credentials."""
        self.creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=["https://www.googleapis.com/auth/drive.file"],
        )

        # Refresh token if expired
        if self.creds.expired and self.creds.refresh_token:
            self.creds.refresh(Request())

        self.service = build("drive", "v3", credentials=self.creds)

    def get_or_create_folder(self) -> str:
        """Get or create 'Kanban reports' folder."""
        # Search for existing folder
        query = f"mimeType='application/vnd.google-apps.folder' and name='{self.REPORTS_FOLDER_NAME}' and trashed=false"
        results = (
            self.service.files()
            .list(q=query, spaces="drive", fields="files(id, name)", pageSize=1)
            .execute()
        )

        items = results.get("files", [])

        if items:
            return items[0]["id"]

        # Create new folder
        folder_metadata = {
            "name": self.REPORTS_FOLDER_NAME,
            "mimeType": "application/vnd.google-apps.folder",
        }

        folder = (
            self.service.files().create(body=folder_metadata, fields="id").execute()
        )

        return folder["id"]

    async def upload_markdown_report(
        self, filename: str, content: str, task_title: str = ""
    ) -> dict:
        """Upload markdown report to Google Drive."""
        # Get or create folder
        folder_id = self.get_or_create_folder()

        # Prepare file metadata
        file_metadata = {
            "name": filename,
            "mimeType": "text/markdown",
            "parents": [folder_id],
            "description": f"AI Analysis Report for task: {task_title}"
            if task_title
            else "AI Analysis Report",
        }

        # Upload file
        content_bytes = content.encode("utf-8")
        media = MediaIoBaseUpload(
            io.BytesIO(content_bytes), mimetype="text/markdown", resumable=True
        )

        file = (
            self.service.files()
            .create(
                body=file_metadata,
                media_body=media,
                fields="id, name, webViewLink, createdTime",
            )
            .execute()
        )

        return {
            "file_id": file["id"],
            "filename": file["name"],
            "view_url": file.get("webViewLink", ""),
            "created_at": file.get("createdTime", ""),
            "folder_name": self.REPORTS_FOLDER_NAME,
        }

    async def list_reports(self) -> list:
        """List all reports in the Kanban reports folder."""
        folder_id = self.get_or_create_folder()

        query = f"'{folder_id}' in parents and trashed=false"
        results = (
            self.service.files()
            .list(
                q=query,
                spaces="drive",
                fields="files(id, name, webViewLink, createdTime, modifiedTime)",
                orderBy="createdTime desc",
            )
            .execute()
        )

        return results.get("files", [])
