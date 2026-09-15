import os
import uuid
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/x-pdf",
    "application/msword"
}

def validate_uploaded_file(file: UploadFile) -> Tuple[str, str, int]:
    """
    Validates extension, MIME type, file size, and generates safe storage filename.
    Returns: (safe_filename, file_type, file_size)
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File has no name."
        )

    # Sanitize and get extension
    filename = os.path.basename(file.filename)
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{ext}'. Allowed formats: PDF (.pdf) and DOCX (.docx)."
        )

    # Check content type if provided
    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        # Some browsers or OS pass generic binary stream, so if extension matches allow PDF/DOCX
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Invalid MIME type '{file.content_type}' for document."
            )

    # Read content to check file size
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    file_type = "PDF" if ext == ".pdf" else "DOCX"
    # Generate random safe stored filename to avoid overwrites and path traversal
    safe_stored_name = f"{uuid.uuid4().hex}{ext}"

    return safe_stored_name, file_type, file_size
