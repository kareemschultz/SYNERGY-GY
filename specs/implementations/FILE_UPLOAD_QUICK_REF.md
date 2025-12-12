# File Upload - Quick Reference

## What Was Completed

1. **Upload directory created**: `/apps/server/data/uploads`
2. **Environment variable added**: `UPLOAD_DIR=./data/uploads` in `.env.example`
3. **Frontend upload flow fixed**: Now uses prepareUpload → upload → complete pattern
4. **Download functionality wired**: View/Download buttons now work
5. **Archive functionality added**: Soft-delete documents
6. **File size increased**: Changed from 10MB to 50MB limit
7. **Git ignore added**: Uploads directory excluded from version control
8. **CHANGELOG updated**: Marked as complete

## Server Endpoints (Already Working)

- `POST /api/upload/:documentId` - Upload file (multipart/form-data)
- `GET /api/download/:documentId` - Download file (streaming)

## Frontend Components Updated

- `/apps/web/src/routes/app/documents/upload.tsx` - Upload page
- `/apps/web/src/routes/app/documents/index.tsx` - Documents list

## How It Works

### Upload Process
1. User selects file(s) on upload page
2. Frontend calls `prepareUpload` API → creates PENDING document record
3. Frontend uploads file to `/api/upload/:documentId`
4. Server validates, stores file, updates document to ACTIVE
5. User redirected to documents list

### Download Process
1. User clicks Download/View button
2. Frontend calls `getDownloadUrl` API
3. Frontend opens `/api/download/:documentId` in new window
4. Server streams file with proper headers

### Security
- Session authentication required
- File type whitelist (PDF, DOC, DOCX, XLS, XLSX, images)
- 50MB size limit enforced
- Path sanitization prevents directory traversal

## Testing Checklist

Quick smoke test:
1. Navigate to `/app/documents/upload`
2. Upload a PDF file
3. Link to a client (optional)
4. Click "Upload"
5. Navigate to `/app/documents`
6. Click "Download" on uploaded document
7. Verify file downloads correctly

## File Structure

```
apps/server/data/uploads/
└── 2024/
    └── 12/
        ├── client-abc-123/
        │   └── doc-xyz-456_passport.pdf
        └── general/
            └── doc-789-def_template.docx
```

## Environment Setup

```bash
# In apps/server/.env
UPLOAD_DIR=./data/uploads
```

## Production Notes

- Backup `/apps/server/data/uploads` regularly
- Monitor disk space usage
- Consider S3/R2 sync for redundancy
- Set up virus scanning (optional)

## Status

✅ Complete - Ready for testing
