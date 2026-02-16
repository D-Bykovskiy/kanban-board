"""Google Drive routes."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from app.services.drive_service import DriveService

router = APIRouter(prefix="/drive", tags=["drive"])


class UploadReportRequest(BaseModel):
    """Request for uploading report to Google Drive."""

    filename: str
    content: str
    task_title: str = ""


class UploadReportResponse(BaseModel):
    """Response after uploading report."""

    success: bool
    file_id: str
    filename: str
    view_url: str
    folder_name: str
    message: str


class DriveAuthRequest(BaseModel):
    """Request for Drive authentication status."""

    access_token: str


@router.post("/upload", response_model=UploadReportResponse)
async def upload_report(
    request: UploadReportRequest, authorization: Optional[str] = Header(None)
):
    """Upload markdown report to Google Drive."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    # Extract access token
    if authorization.startswith("Bearer "):
        access_token = authorization[7:]
    else:
        access_token = authorization

    try:
        drive_service = DriveService(access_token)
        result = await drive_service.upload_markdown_report(
            filename=request.filename,
            content=request.content,
            task_title=request.task_title,
        )

        return UploadReportResponse(
            success=True,
            file_id=result["file_id"],
            filename=result["filename"],
            view_url=result["view_url"],
            folder_name=result["folder_name"],
            message=f"Report uploaded successfully to '{result['folder_name']}' folder",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/reports")
async def list_reports(authorization: Optional[str] = Header(None)):
    """List all reports in Kanban reports folder."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    if authorization.startswith("Bearer "):
        access_token = authorization[7:]
    else:
        access_token = authorization

    try:
        drive_service = DriveService(access_token)
        reports = await drive_service.list_reports()
        return {"reports": reports, "count": len(reports)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list reports: {str(e)}")
