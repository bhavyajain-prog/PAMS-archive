# Team API Documentation

## Overview

The Team module provides endpoints for student teams to manage project documentation, submit weekly status reports, upload documents, and track project progress.

**Base Path:** `/team`

**Authentication Method:** JWT (JSON Web Token)

**Authorization:** Primarily `student` role, with some mentor-accessible endpoints

---

## Team Information

### 1. Get My Team

**Endpoint:** `GET /team/my-team`

**Description:** Retrieves complete information about the authenticated student's current team.

**Authorization:** `student`

**Response (200 OK):**

```json
{
  "team": {
    "_id": "string",
    "code": "string",
    "leader": { "student details with -password" },
    "members": [
      {
        "student": { "student details" },
        "joinedAt": "ISO8601 datetime"
      }
    ],
    "projectChoices": ["array of project objects"],
    "finalProject": { "project details" },
    "mentor": {
      "assigned": { "mentor details" },
      "preferences": ["array of mentor IDs"],
      "currentPreference": "number",
      "assignedAt": "ISO8601 datetime"
    },
    "status": "string (pending|approved|rejected)",
    "batch": "string",
    "department": "string",
    "feedback": [
      {
        "message": "string",
        "byUser": "ObjectId",
        "at": "ISO8601 datetime"
      }
    ],
    "createdAt": "ISO8601 datetime"
  }
}
```

**Response (404 Not Found):**

```json
{
  "message": "You are not part of any team"
}
```

---

## Project Abstract

### 2. Submit/Update Project Abstract

**Endpoint:** `PUT /team/project-abstract`

**Description:** Submits or updates project abstract with technical details.

**Authorization:** `student` (must be team member)

**Request Body:**

```json
{
  "projectTrack": "string (required)",
  "githubRepo": "string (required, URL)",
  "tools": ["array of strings, required"],
  "modules": [
    {
      "name": "string (required)",
      "functionality": "string (required)"
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "message": "Project abstract updated successfully",
  "projectAbstract": {
    "projectTrack": "string",
    "githubRepo": "string",
    "tools": [],
    "modules": [],
    "status": "draft",
    "submittedAt": "ISO8601 datetime",
    "submittedBy": "ObjectId"
  }
}
```

**Validation:**

- Student must be team member
- All fields required
- GitHub URL format validated
- At least one tool required
- At least one module required

**Status:** Sets to `draft` (not submitted for review)

---

### 3. Finalize Project Abstract

**Endpoint:** `PUT /team/project-abstract/finalize`

**Description:** Marks project abstract as submitted for mentor review.

**Authorization:** `student` (team member)

**Response (200 OK):**

```json
{
  "message": "Project abstract submitted for review",
  "projectAbstract": {
    "status": "submitted",
    "submittedAt": "ISO8601 datetime",
    "submittedBy": "ObjectId"
  }
}
```

**Validation:**

- Must have saved project abstract data
- Cannot finalize if already approved

---

## Role Specification

### 4. Get Project Modules

**Endpoint:** `GET /team/project-modules`

**Description:** Retrieves modules from project abstract for role assignment.

**Authorization:** `student` (team member)

**Response (200 OK):**

```json
{
  "modules": [
    {
      "name": "string",
      "functionality": "string"
    }
  ]
}
```

**Response (400 Bad Request):**

```json
{
  "message": "Project abstract not submitted yet"
}
```

---

### 5. Get Team Members

**Endpoint:** `GET /team/members`

**Description:** Retrieves team members for role specification assignment.

**Authorization:** `student` (team member)

**Response (200 OK):**

```json
{
  "members": [
    {
      "_id": "string",
      "name": "string",
      "email": "string",
      "studentData": {
        "rollNumber": "string"
      }
    }
  ]
}
```

---

### 6. Submit/Update Role Specification

**Endpoint:** `PUT /team/role-specification`

**Description:** Assigns modules to team members.

**Authorization:** `student` (team member)

**Request Body:**

```json
{
  "assignments": [
    {
      "member": "string (ObjectId, required)",
      "modules": ["array of module names, required"]
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "message": "Role specification updated successfully",
  "roleSpecification": {
    "assignments": [],
    "status": "draft",
    "submittedAt": "ISO8601 datetime",
    "submittedBy": "ObjectId"
  }
}
```

**Validation:**

- At least one assignment required
- Each assignment must have member and modules
- Modules must exist in project abstract
- Each module should be assigned to exactly one member (warning, not enforced)

---

### 7. Finalize Role Specification

**Endpoint:** `PUT /team/role-specification/finalize`

**Description:** Submits role specification for mentor review.

**Authorization:** `student` (team member)

**Response (200 OK):**

```json
{
  "message": "Role specification submitted for review"
}
```

**Validation:**

- Must have saved role specification
- Cannot finalize if already approved

---

## Weekly Status Reports

### 8. Submit Weekly Status

**Endpoint:** `POST /team/weekly-status`

**Description:** Submits weekly progress report with project file upload.

**Authorization:** `student` (team member)

**Request:**

- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `week` (number, required): Week number
  - `module` (string, required): Module name
  - `progress` (string, required): Progress percentage or description
  - `achievements` (string, required): Achievements this week
  - `challenges` (string, required): Challenges faced
  - `studentRemarks` (string, optional): Additional remarks
  - `projectFile` (file, required): ZIP file (max 50MB)

**Response (201 Created):**

```json
{
  "message": "Weekly status submitted successfully",
  "submission": {
    "_id": "string",
    "week": "number",
    "module": "string",
    "progress": "string",
    "achievements": "string",
    "challenges": "string",
    "projectFile": {
      "filename": "string",
      "originalName": "string",
      "path": "string",
      "size": "number",
      "uploadedAt": "ISO8601 datetime"
    },
    "status": "submitted",
    "submittedAt": "ISO8601 datetime",
    "submittedBy": "ObjectId"
  }
}
```

**File Upload Configuration:**

- **Allowed Format:** `.zip` only
- **Max Size:** 50 MB
- **Storage:** `backend/uploads/weekly-status/`
- **Filename:** `{teamCode}_week{week}_{timestamp}.zip`

**Duplicate Prevention:**

- Cannot submit multiple reports for same week + module combination
- Can submit multiple reports for same week with different modules

**Validation:**

- Week must be positive integer
- Module must be non-empty string
- All text fields required
- ZIP file required

---

### 9. Get Team Weekly Status

**Endpoint:** `GET /team/weekly-status`

**Description:** Retrieves all weekly status submissions for the team.

**Authorization:** `student` (team member)

**Response (200 OK):**

```json
{
  "weeklyStatus": [
    {
      "_id": "string",
      "week": "number",
      "module": "string",
      "progress": "string",
      "achievements": "string",
      "challenges": "string",
      "studentRemarks": "string",
      "projectFile": {
        "filename": "string",
        "originalName": "string",
        "size": "number",
        "uploadedAt": "ISO8601 datetime"
      },
      "status": "submitted | mentor_approved",
      "mentorScore": "number",
      "mentorComments": "string",
      "submittedAt": "ISO8601 datetime",
      "submittedBy": { "name": "string", "email": "string" },
      "scoredAt": "ISO8601 datetime"
    }
  ]
}
```

---

### 10. Update Weekly Status Score (Mentor)

**Endpoint:** `PUT /team/weekly-status/:submissionId`

**Description:** Mentor adds score and comments to weekly submission.

**Authorization:** `mentor` (must be assigned to team)

**Path Parameters:**

- `submissionId` - Weekly status submission ObjectId

**Request Body:**

```json
{
  "score": "number (0-100, required)",
  "comments": "string (optional)"
}
```

**Response (200 OK):**

```json
{
  "message": "Weekly status scored successfully",
  "weeklyStatus": {
    "_id": "string",
    "week": "number",
    "mentorScore": "number",
    "mentorComments": "string",
    "status": "mentor_approved",
    "scoredAt": "ISO8601 datetime"
  }
}
```

**Validation:**

- Score must be between 0 and 100
- Mentor must be assigned to team

---

### 11. Approve Weekly Status (Mentor)

**Endpoint:** `PUT /team/weekly-status/:submissionId/approve`

**Description:** Mentor approves weekly submission without scoring.

**Authorization:** `mentor` (assigned to team)

**Response (200 OK):**

```json
{
  "message": "Weekly status approved successfully",
  "weeklyStatus": {
    "_id": "string",
    "status": "mentor_approved"
  }
}
```

---

### 12. Reject Weekly Status (Mentor)

**Endpoint:** `PUT /team/weekly-status/:submissionId/reject`

**Description:** Mentor rejects weekly submission with feedback.

**Authorization:** `mentor` (assigned to team)

**Request Body:**

```json
{
  "feedback": "string (required)"
}
```

**Response (200 OK):**

```json
{
  "message": "Weekly status rejected",
  "weeklyStatus": {
    "_id": "string",
    "status": "rejected",
    "mentorComments": "string"
  }
}
```

---

### 13. Download Weekly Status File

**Endpoint:** `GET /team/weekly-status/:submissionId/download`

**Description:** Downloads the ZIP file for a weekly submission.

**Authorization:** `student` (team member) or `mentor` (assigned)

**Response (200 OK):** ZIP file stream

**Response Headers:**

- `Content-Type: application/zip`
- `Content-Disposition: attachment; filename="{originalName}"`

**Validation:**

- Student must be team member OR mentor must be assigned
- File must exist on filesystem

---

## PDF Document Upload

### 14. Get Document Configuration

**Endpoint:** `GET /team/document-types`

**Description:** Retrieves list of enabled PDF document types for upload.

**Authorization:** `student` (team member)

**Response (200 OK):**

```json
{
  "documentTypes": [
    {
      "key": "string",
      "name": "string",
      "description": "string",
      "enabled": true,
      "requiredForApproval": "boolean",
      "category": "pdf-document"
    }
  ]
}
```

---

### 15. Upload PDF Document

**Endpoint:** `POST /team/upload-document/:documentType`

**Description:** Uploads a PDF document for team.

**Authorization:** `student` (team member)

**Path Parameters:**

- `documentType` - Document type key from configuration

**Request:**

- **Content-Type:** `multipart/form-data`
- **Field:** `document` (PDF file, max 10MB)

**Response (200 OK):**

```json
{
  "message": "Document uploaded successfully",
  "document": {
    "type": "string",
    "originalName": "string",
    "filename": "string",
    "path": "string",
    "size": "number",
    "status": "submitted",
    "uploadedAt": "ISO8601 datetime",
    "uploadedBy": "ObjectId"
  }
}
```

**File Configuration:**

- **Format:** `.pdf` only
- **Max Size:** 10 MB
- **Storage:** `backend/uploads/{documentType}/`
- **Filename:** `{teamCode}_{documentType}_{timestamp}.pdf`

**Validation:**

- Document type must be enabled in configuration
- Replaces existing document of same type
- Cannot upload if admin-approved

---

### 16. Delete PDF Document

**Endpoint:** `DELETE /team/document/:documentType`

**Description:** Deletes uploaded PDF document (allows re-upload).

**Authorization:** `student` (team member)

**Response (200 OK):**

```json
{
  "message": "Document deleted successfully. You can now upload a new one."
}
```

**Validation:**

- Cannot delete admin-approved documents
- File removed from filesystem

---

## Project Timeline

### 17. Get Project Timeline

**Endpoint:** `GET /team/project-timeline`

**Description:** Retrieves project timeline with milestones.

**Authorization:** `student` (team member)

**Response (200 OK):**

```json
{
  "timeline": {
    "startDate": "ISO8601 datetime",
    "endDate": "ISO8601 datetime",
    "milestones": [
      {
        "name": "string",
        "description": "string",
        "dueDate": "ISO8601 datetime",
        "status": "pending | in-progress | completed",
        "completedAt": "ISO8601 datetime"
      }
    ],
    "createdAt": "ISO8601 datetime",
    "updatedAt": "ISO8601 datetime"
  }
}
```

**Response (404 Not Found):**

```json
{
  "message": "No timeline found"
}
```

---

### 18. Create/Update Project Timeline

**Endpoint:** `POST /team/project-timeline`

**Description:** Creates or updates project timeline.

**Authorization:** `student` (team member)

**Request Body:**

```json
{
  "startDate": "ISO8601 datetime (required)",
  "endDate": "ISO8601 datetime (required)",
  "milestones": [
    {
      "name": "string (required)",
      "description": "string (optional)",
      "dueDate": "ISO8601 datetime (required)",
      "status": "string (pending|in-progress|completed, default: pending)"
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "message": "Project timeline saved successfully",
  "timeline": { "timeline object" }
}
```

**Validation:**

- Start date must be before end date
- At least one milestone required
- Milestone due dates should be between start and end dates

---

## Document Review Status

### 19. Get Document Status

**Endpoint:** `GET /team/document-status`

**Description:** Retrieves submission and approval status of all team documents.

**Authorization:** `student` (team member)

**Response (200 OK):**

```json
{
  "documents": {
    "projectAbstract": {
      "status": "not_submitted | draft | submitted | mentor_approved | admin_approved",
      "submittedAt": "ISO8601 datetime",
      "mentorApproval": "boolean",
      "adminApproval": "boolean"
    },
    "roleSpecification": { "similar structure" },
    "weeklyStatus": {
      "totalSubmissions": "number",
      "approvedSubmissions": "number",
      "latestSubmission": "ISO8601 datetime"
    },
    "{pdfDocumentType}": {
      "status": "string",
      "uploadedAt": "ISO8601 datetime",
      "originalName": "string",
      "size": "number",
      "mentorApproval": "boolean",
      "adminApproval": "boolean"
    }
  },
  "overallProgress": {
    "totalDocuments": "number",
    "submittedDocuments": "number",
    "approvedDocuments": "number",
    "completionPercentage": "number"
  }
}
```

---

## Error Responses

**Common Status Codes:**

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation failure, missing fields
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Not team member or insufficient permissions
- `404 Not Found` - Team or resource not found
- `413 Payload Too Large` - File exceeds size limit
- `500 Internal Server Error` - Server error

**Common Error Messages:**

```json
{ "message": "You are not part of any team" }
{ "message": "You are not a member of this team" }
{ "message": "File size exceeds limit" }
{ "message": "Only PDF files are allowed" }
{ "message": "Only ZIP files are allowed" }
{ "message": "Cannot edit approved documents" }
{ "message": "Duplicate submission for this week and module" }
```

---

## File Upload Limits

| Document Type | Max Size | Format | Storage Path              |
| ------------- | -------- | ------ | ------------------------- |
| Weekly Status | 50 MB    | .zip   | `uploads/weekly-status/`  |
| PDF Documents | 10 MB    | .pdf   | `uploads/{documentType}/` |

---

## Security Considerations

1. **Team Membership Validation:**

   - All endpoints verify student is team member
   - Mentor endpoints verify mentor assignment

2. **File Upload Security:**

   - File type validation (MIME type and extension)
   - File size limits enforced
   - Unique filenames prevent overwrites
   - Files stored outside web root

3. **Document Approval Workflow:**

   - Students cannot modify mentor/admin-approved documents
   - Approval hierarchy enforced (draft → submitted → mentor_approved → admin_approved)

4. **Duplicate Prevention:**

   - Weekly status: Same week + module blocked
   - PDF documents: Replaces existing (not duplicates)

5. **Data Integrity:**
   - Module validation against project abstract
   - Member validation in role specification
   - Score range validation (0-100)

---

## Best Practices

1. **Weekly Status Submission:**

   - Submit regularly (weekly)
   - Use descriptive module names
   - Include comprehensive achievements and challenges
   - Compress files efficiently for upload

2. **Document Management:**

   - Finalize documents only when ready for review
   - Review mentor feedback before resubmission
   - Keep backup copies of uploaded files

3. **Project Timeline:**
   - Set realistic milestone dates
   - Update milestone status regularly
   - Align milestones with weekly submissions

---

## Environment Variables

```env
# None specific, uses shared configuration
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-28  
**API Version:** 1.0
