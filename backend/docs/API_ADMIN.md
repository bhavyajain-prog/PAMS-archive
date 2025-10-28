# Admin API Documentation

## Overview
The Admin module provides comprehensive management capabilities for the PAMS system, including user management, team oversight, project bank administration, document review, and bulk data operations.

**Base Path:** `/admin`

**Authentication Method:** JWT (JSON Web Token)

**Authorization:** `admin` or `sub-admin` roles (specific endpoints may require `admin` only)

---

## Table of Contents
1. [User Management](#user-management)
2. [Team Management](#team-management)
3. [Project Bank Management](#project-bank-management)
4. [Bulk Upload Operations](#bulk-upload-operations)
5. [Team Approval & Allocation](#team-approval--allocation)
6. [Document Review](#document-review)
7. [System Maintenance](#system-maintenance)

---

## User Management

### 1. Get All Students

**Endpoint:** `GET /admin/students`

**Description:** Retrieves all registered students with their profile and team information.

**Authentication:** Required

**Authorization:** `admin`, `sub-admin`

**Response Status Codes:**
- `200 OK` - Students retrieved successfully
- `401 Unauthorized` - Invalid or missing authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - No students found

**Response Body (200 OK):**
```json
{
  "students": [
    {
      "_id": "string",
      "name": "string",
      "username": "string",
      "email": "string",
      "phone": "string",
      "role": "student",
      "firstLogin": "boolean",
      "createdAt": "ISO8601 datetime",
      "studentData": {
        "rollNumber": "string",
        "batch": "string",
        "department": "string",
        "currentTeam": {
          "_id": "string",
          "code": "string",
          "leader": "ObjectId",
          "status": "string"
        }
      }
    }
  ]
}
```

**Notes:**
- Password field excluded from response
- Includes populated `currentTeam` data
- Returns empty array with 404 if no students exist

---

### 2. Get All Mentors

**Endpoint:** `GET /admin/mentors`

**Description:** Retrieves all mentors and sub-admins with their assigned teams.

**Authentication:** Required

**Authorization:** `admin`, `sub-admin`

**Response Status Codes:**
- `200 OK` - Mentors retrieved successfully
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - No mentors found

**Response Body (200 OK):**
```json
{
  "mentors": [
    {
      "_id": "string",
      "name": "string",
      "username": "string",
      "email": "string",
      "phone": "string",
      "role": "mentor | sub-admin",
      "createdAt": "ISO8601 datetime",
      "mentorData": {
        "empNo": "string",
        "department": "string",
        "designation": "string",
        "maxTeams": "number",
        "assignedTeams": [
          {
            "_id": "string",
            "code": "string",
            "leader": "ObjectId"
          }
        ]
      }
    }
  ]
}
```

**Notes:**
- Returns both `mentor` and `sub-admin` roles
- Password excluded from response
- Populated `assignedTeams` array

---

### 3. Register New User

**Endpoint:** `POST /admin/register`

**Description:** Creates a new user account with specified role and role-specific data.

**Authentication:** Required

**Authorization:** `admin` only

**Request Body:**
```json
{
  "name": "string (required)",
  "username": "string (required)",
  "email": "string (required, valid email format)",
  "phone": "string (required)",
  "role": "string (required: student|mentor|admin|sub-admin)",
  "studentData": {
    "rollNumber": "string",
    "batch": "string",
    "department": "string"
  },
  "mentorData": {
    "empNo": "string",
    "department": "string",
    "designation": "string",
    "maxTeams": "number (default: 3)"
  },
  "adminData": {
    "isSubAdmin": "boolean",
    "permissions": "array",
    "empNo": "string",
    "department": "string"
  }
}
```

**Response Status Codes:**
- `201 Created` - User registered successfully
- `400 Bad Request` - Missing required fields or user already exists
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions

**Response Body (201 Created):**
```json
{
  "message": "User registered successfully",
  "userId": "string (MongoDB ObjectId)"
}
```

**Response Body (400 Bad Request - Duplicate):**
```json
{
  "message": "User already exists (username, email, or phone)"
}
```

**Password Handling:**
- Default password: `process.env.DEFAULT_PASS` or `"password123"`
- Hashed with bcrypt (salt rounds: 10)
- User must change on first login

**Validation Rules:**
- `email`: Must be valid email format
- `phone`: Must be unique
- `username`: Must be unique
- `role`: Must be one of the allowed values

**Notes:**
- Creates role-specific subdocuments based on role
- `firstLogin` flag set to true by default
- Sub-admins get both `mentorData` and `adminData`

---

### 4. Update User

**Endpoint:** `PUT /admin/user/:id`

**Description:** Updates an existing user's profile and role-specific information.

**Authentication:** Required

**Authorization:** `admin` only

**Path Parameters:**
- `id` (string, required) - User MongoDB ObjectId

**Request Body:**
```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "username": "string (optional)",
  "role": "string (optional: student|mentor|sub-admin)",
  "studentData": {
    "rollNumber": "string",
    "batch": "string",
    "department": "string"
  },
  "mentorData": {
    "empNo": "string",
    "department": "string",
    "designation": "string",
    "maxTeams": "number"
  }
}
```

**Response Status Codes:**
- `200 OK` - User updated successfully
- `400 Bad Request` - Invalid data or duplicate email/phone/username
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - User not found

**Response Body (200 OK):**
```json
{
  "message": "User updated successfully",
  "user": {
    "_id": "string",
    "name": "string",
    "username": "string",
    "email": "string",
    "phone": "string",
    "role": "string",
    "studentData": {},
    "mentorData": {}
  }
}
```

**Role Change Handling:**
- **Mentor → Sub-Admin:** Requires `empNo` and `department` in `mentorData`
- **Sub-Admin → Mentor:** Clears `adminData.isSubAdmin` flag
- **Cannot promote to Admin:** Use dedicated admin creation process
- Validation enforced for role-specific required fields

**Uniqueness Validation:**
- Email, phone, and username checked against other users
- Excludes current user from uniqueness check
- Returns specific error message for conflicts

**Notes:**
- Only updates provided fields (partial updates supported)
- Password field excluded from response
- Populates related fields (`currentTeam`, `assignedTeams`)
- `maxTeams` field automatically converted to Number

---

### 5. Delete User

**Endpoint:** `DELETE /admin/user/:id`

**Description:** Permanently deletes a user account from the system.

**Authentication:** Required

**Authorization:** `admin` only

**Path Parameters:**
- `id` (string, required) - User MongoDB ObjectId

**Response Status Codes:**
- `200 OK` - User deleted successfully
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - User not found

**Response Body (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

**Side Effects:**
- Students: Team membership references remain (consider cleanup)
- Mentors: Team assignments remain (consider reassignment)
- Does not cascade delete related entities

**Security Considerations:**
- Cannot delete own account
- Consider implementing soft delete for audit trails
- Verify no active dependencies before deletion

---

### 6. Get Available Mentors

**Endpoint:** `GET /admin/remaining-mentors`

**Description:** Retrieves mentors who have capacity to accept more team assignments.

**Authentication:** Required

**Authorization:** `admin`, `sub-admin`

**Response Status Codes:**
- `200 OK` - Available mentors retrieved
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions

**Response Body (200 OK):**
```json
{
  "mentors": [
    {
      "_id": "string",
      "name": "string",
      "email": "string"
    }
  ]
}
```

**Query Logic:**
- Filters mentors where `assignedTeams.length < maxTeams`
- Uses MongoDB aggregation expression
- Returns minimal mentor information

**Notes:**
- Useful for team allocation workflows
- Empty array if all mentors at capacity
- Does not include sub-admins with mentor data

---

## Team Management

### 7. Get All Teams

**Endpoint:** `GET /admin/teams`

**Description:** Retrieves all teams with complete membership, mentor, and project information.

**Authentication:** Required

**Authorization:** `admin`, `sub-admin`

**Response Status Codes:**
- `200 OK` - Teams retrieved successfully
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - No teams found

**Response Body (200 OK):**
```json
{
  "teams": [
    {
      "_id": "string",
      "code": "string (6 uppercase alphanumeric)",
      "name": "string",
      "teamSize": "number (virtual field)",
      "leader": {
        "_id": "string",
        "name": "string",
        "email": "string",
        "studentData": {}
      },
      "members": [
        {
          "student": {
            "_id": "string",
            "name": "string",
            "email": "string"
          },
          "joinedAt": "ISO8601 datetime"
        }
      ],
      "projectChoices": [
        {
          "_id": "string",
          "title": "string",
          "description": "string",
          "category": "string"
        }
      ],
      "finalProject": {
        "_id": "string",
        "title": "string",
        "description": "string",
        "category": "string"
      },
      "mentor": {
        "assigned": {
          "_id": "string",
          "name": "string",
          "email": "string"
        },
        "preferences": [],
        "currentPreference": "number"
      },
      "status": "string (pending|approved|rejected)",
      "feedback": [
        {
          "message": "string",
          "byUser": "ObjectId",
          "at": "ISO8601 datetime"
        }
      ]
    }
  ]
}
```

**Filtering:**
- Only returns teams with at least one member
- Excludes empty or incomplete teams

**Populated Fields:**
- `members.student`: Full student profile (excluding password)
- `leader`: Full leader profile
- `mentor.assigned`: Assigned mentor details
- `mentor.preferences`: Mentor preference list
- `projectChoices`: Full project details
- `finalProject`: Allocated project details

**Notes:**
- Response includes virtual field `teamSize`
- Returns 404 with empty message if no teams exist
- Useful for comprehensive team dashboard

---

### 8. Approve Team

**Endpoint:** `POST /admin/approve/:id`

**Description:** Approves a pending team for project allocation and mentor assignment.

**Authentication:** Required

**Authorization:** `admin`, `sub-admin`

**Path Parameters:**
- `id` (string, required) - Team MongoDB ObjectId

**Request Body:**
```json
{
  "feedback": "string (optional)"
}
```

**Response Status Codes:**
- `200 OK` - Team approved successfully
- `400 Bad Request` - Team already approved or project not approved
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Team not found

**Response Body (200 OK):**
```json
{
  "message": "Team approved successfully"
}
```

**Response Body (400 Bad Request - Already Approved):**
```json
{
  "message": "Team already approved"
}
```

**Response Body (400 Bad Request - Project Not Approved):**
```json
{
  "message": "Either of the project is not approved yet"
}
```

**Validation Rules:**
- Team must be in `pending` status
- All `projectChoices` must have `isApproved: true`
- Cannot approve already approved teams

**Side Effects:**
- Sets `team.status = "approved"`
- Adds feedback to `team.feedback` array
- Team becomes eligible for mentor allocation

**Approval Workflow:**
1. Validate team status
2. Check all project choices approved
3. Update team status
4. Record feedback with admin ID and timestamp

---

### 9. Reject Team

**Endpoint:** `POST /admin/reject/:id`

**Description:** Rejects a team application with mandatory feedback.

**Authentication:** Required

**Authorization:** `admin`, `sub-admin`

**Path Parameters:**
- `id` (string, required) - Team MongoDB ObjectId

**Request Body:**
```json
{
  "feedback": "string (optional, recommended)"
}
```

**Response Status Codes:**
- `200 OK` - Team rejected successfully
- `400 Bad Request` - Team already rejected
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Team not found

**Response Body (200 OK):**
```json
{
  "message": "Team rejected successfully"
}
```

**Side Effects:**
- Sets `team.status = "rejected"`
- Adds feedback to `team.feedback` array
- Team cannot proceed to mentor allocation

**Notes:**
- Feedback strongly recommended for student transparency
- Rejected teams may need to reform or adjust project choices
- Does not delete team data (preserves audit trail)

---

### 10. Allocate Mentor to Team

**Endpoint:** `POST /admin/allocate/:team_id/:mentor_id`

**Description:** Assigns a mentor to an approved team and optionally sets their final project.

**Authentication:** Required

**Authorization:** `admin`, `sub-admin`

**Path Parameters:**
- `team_id` (string, required) - Team MongoDB ObjectId
- `mentor_id` (string, required) - Mentor User ObjectId

**Request Body:**
```json
{
  "finalProject": "string (optional, project ObjectId)"
}
```

**Response Status Codes:**
- `200 OK` - Mentor allocated successfully
- `400 Bad Request` - Validation failure (see error messages)
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Team or mentor not found

**Response Body (200 OK):**
```json
{
  "message": "Mentor allocated successfully"
}
```

**Response Body (400 Bad Request - Various Scenarios):**
```json
{
  "message": "Team is not approved"
}
```
```json
{
  "message": "Team already has a mentor"
}
```
```json
{
  "message": "Mentor has already been assigned to {maxTeams} teams"
}
```
```json
{
  "message": "Final project is not approved or does not exist"
}
```
```json
{
  "message": "Final project must be one of the team's project choices"
}
```

**Validation Rules:**
1. **Team Status:** Must be `approved`
2. **Team Mentor:** Must not already have a mentor assigned
3. **Mentor Role:** User must have role `mentor`
4. **Mentor Capacity:** `assignedTeams.length < maxTeams`
5. **Final Project (if provided):**
   - Must exist and be approved
   - Must be in team's `projectChoices` array

**Side Effects:**
- Sets `team.mentor.assigned = mentor_id`
- Adds team to `mentor.mentorData.assignedTeams`
- Sets `team.finalProject` if provided
- Saves both team and mentor documents

**Allocation Workflow:**
1. Validate team eligibility
2. Validate mentor availability
3. Validate final project (if provided)
4. Update team mentor assignment
5. Update mentor's assigned teams list

**Notes:**
- Cannot reassign mentor once allocated (delete allocation first)
- Mentor capacity enforced to prevent overload
- Final project selection from team's choices only

---

## Project Bank Management

### 11. Get All Projects

**Endpoint:** `GET /admin/projects`

**Description:** Retrieves all projects from the project bank with proposer, approver, and assignment details.

**Authentication:** Required

**Authorization:** `admin`, `sub-admin`

**Response Status Codes:**
- `200 OK` - Projects retrieved successfully
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - No projects found

**Response Body (200 OK):**
```json
{
  "projects": [
    {
      "_id": "string",
      "title": "string",
      "description": "string",
      "category": "string",
      "maxTeams": "number",
      "assignedTeams": [
        {
          "_id": "string",
          "code": "string",
          "leader": "ObjectId",
          "members": []
        }
      ],
      "isApproved": "boolean",
      "isAvailable": "boolean (virtual field)",
      "proposedBy": {
        "_id": "string",
        "name": "string",
        "email": "string",
        "role": "string"
      },
      "approvedBy": {
        "_id": "string",
        "name": "string",
        "email": "string",
        "role": "string"
      },
      "feedback": [
        {
          "message": "string",
          "byUser": "ObjectId",
          "at": "ISO8601 datetime"
        }
      ],
      "rejectedAt": "ISO8601 datetime (null if not rejected)"
    }
  ]
}
```

**Populated Fields:**
- `proposedBy`: User who proposed the project
- `approvedBy`: Admin who approved the project
- `assignedTeams`: Teams currently assigned to the project

**Virtual Fields:**
- `isAvailable`: Computed as `isApproved && assignedTeams.length < maxTeams`

**Notes:**
- Includes both approved and unapproved projects
- TTL index auto-deletes rejected projects after 2 days
- Returns 404 with empty message if no projects exist

---

### 12. Create Project

**Endpoint:** `POST /admin/projects`

**Description:** Adds a new project to the project bank, pre-approved by admin.

**Authentication:** Required

**Authorization:** `admin` only

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "category": "string (required)",
  "maxTeams": "number (optional, default: 1)"
}
```

**Response Status Codes:**
- `201 Created` - Project added successfully
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions

**Response Body (201 Created):**
```json
{
  "message": "Project added successfully.",
  "project": {
    "_id": "string",
    "title": "string",
    "description": "string",
    "category": "string",
    "maxTeams": "number",
    "proposedBy": "string (admin ObjectId)",
    "approvedBy": "string (admin ObjectId)",
    "isApproved": true
  }
}
```

**Default Values:**
- `maxTeams`: 1 if not provided
- `isApproved`: true (admin-created projects auto-approved)
- `proposedBy`: Current admin's user ID
- `approvedBy`: Current admin's user ID

**Notes:**
- Admin-created projects skip approval workflow
- Immediately available for team selection

---

### 13. Update Project

**Endpoint:** `PUT /admin/projects/:id`

**Description:** Updates an existing project's details.

**Authentication:** Required

**Authorization:** `admin` only

**Path Parameters:**
- `id` (string, required) - Project MongoDB ObjectId

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "category": "string (required)",
  "maxTeams": "number (optional)"
}
```

**Response Status Codes:**
- `200 OK` - Project updated successfully
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Project not found

**Response Body (200 OK):**
```json
{
  "message": "Project updated successfully.",
  "project": {
    "_id": "string",
    "title": "string",
    "description": "string",
    "category": "string",
    "maxTeams": "number"
  }
}
```

**Update Rules:**
- All fields except `maxTeams` are required
- `maxTeams` retains existing value if not provided
- Cannot change `proposedBy`, `approvedBy`, or `isApproved` via this route

**Notes:**
- Updates do not affect existing team assignments
- Consider notifying assigned teams of changes

---

### 14. Delete Project

**Endpoint:** `DELETE /admin/projects/:id`

**Description:** Permanently deletes a project from the project bank.

**Authentication:** Required

**Authorization:** `admin` only

**Path Parameters:**
- `id` (string, required) - Project MongoDB ObjectId

**Response Status Codes:**
- `200 OK` - Project deleted successfully
- `400 Bad Request` - Project assigned to active teams
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Project not found

**Response Body (200 OK):**
```json
{
  "message": "Project deleted successfully."
}
```

**Response Body (400 Bad Request):**
```json
{
  "message": "Cannot delete project assigned to active teams. Please unassign teams first."
}
```

**Deletion Protection:**
- Cannot delete projects with `assignedTeams.length > 0`
- Must manually unassign all teams before deletion

**Notes:**
- Permanent deletion (no soft delete)
- Consider archiving instead of deleting for audit trails

---

### 15. Approve Proposed Project

**Endpoint:** `POST /admin/approve-project/:id`

**Description:** Approves a student or mentor-proposed project and sends email notification.

**Authentication:** Required

**Authorization:** `admin` only

**Path Parameters:**
- `id` (string, required) - Project MongoDB ObjectId

**Request Body:**
```json
{
  "feedback": "string (optional)"
}
```

**Response Status Codes:**
- `200 OK` - Project approved successfully
- `400 Bad Request` - Project already approved
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Project not found

**Response Body (200 OK):**
```json
{
  "message": "Project approved successfully."
}
```

**Side Effects:**
- Sets `project.isApproved = true`
- Sets `project.approvedBy = admin._id`
- Adds feedback to `project.feedback` array
- Sends email notification to proposer

**Email Notification:**
- **To:** Proposer's email
- **Subject:** "Project Approved: {project.title}"
- **Content:** Generic approval message with project title
- **Service:** Gmail SMTP

**Notes:**
- Cannot approve already approved projects
- Default feedback: "Project approved." if not provided
- Email sent asynchronously (errors logged but don't block response)

---

### 16. Reject Proposed Project

**Endpoint:** `POST /admin/reject-project/:id`

**Description:** Rejects a proposed project with mandatory feedback and sends email notification.

**Authentication:** Required

**Authorization:** `admin` only

**Path Parameters:**
- `id` (string, required) - Project MongoDB ObjectId

**Request Body:**
```json
{
  "feedback": "string (required)"
}
```

**Response Status Codes:**
- `200 OK` - Project marked as rejected
- `400 Bad Request` - Missing feedback or project already approved
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Project not found

**Response Body (200 OK):**
```json
{
  "message": "Project marked as rejected."
}
```

**Response Body (400 Bad Request - Missing Feedback):**
```json
{
  "message": "Feedback is required for rejection."
}
```

**Response Body (400 Bad Request - Already Approved):**
```json
{
  "message": "Cannot reject an already approved project. Consider unapproving or deleting."
}
```

**Side Effects:**
- Sets `project.isApproved = false`
- Sets `project.rejectedAt = current timestamp`
- Adds feedback to `project.feedback` array
- Sends email notification to proposer
- TTL index auto-deletes after 2 days

**Email Notification:**
- **To:** Proposer's email
- **Subject:** "Project Rejected: {project.title}" (Note: Subject says "Approved" in code - likely a bug)
- **Content:** Rejection message with project title

**TTL Behavior:**
- Rejected projects automatically deleted 2 days after `rejectedAt`
- Uses MongoDB TTL index on `rejectedAt` field

**Notes:**
- Feedback mandatory (improves proposer understanding)
- Cannot reject already approved projects
- Consider implementing unapproval workflow for approved projects

---

### 17. Schedule Project Discussion

**Endpoint:** `POST /admin/schedule-project-discussion`

**Description:** Schedules a discussion meeting for a proposed project and notifies the proposer.

**Authentication:** Required

**Authorization:** `admin` only

**Request Body:**
```json
{
  "projectId": "string (required, MongoDB ObjectId)",
  "dateTime": "string (required, ISO8601 datetime or parseable date string)"
}
```

**Response Status Codes:**
- `200 OK` - Discussion scheduled successfully
- `400 Bad Request` - Missing required fields or invalid date format
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Project not found

**Response Body (200 OK):**
```json
{
  "message": "Meeting for project '{title}' scheduled for {formattedDateTime}."
}
```

**Response Body (400 Bad Request - Missing Fields):**
```json
{
  "message": "Project ID and date/time are required."
}
```

**Response Body (400 Bad Request - Invalid Date):**
```json
{
  "message": "Invalid date/time format."
}
```

**Side Effects:**
- Adds feedback entry with scheduled date/time
- Sends email notification to proposer

**Email Notification:**
- **To:** Proposer's email
- **Subject:** "Project Discussion Scheduled: {project.title}"
- **Content:** Meeting details with localized date/time string

**Date Handling:**
- Accepts ISO8601 format or parseable date strings
- Validates date before scheduling
- Returns localized date/time in response and email

**Notes:**
- Does not integrate with calendar systems
- Manual tracking required
- Consider adding calendar invite attachments

---

### 18. Get TTL Status & Statistics

**Endpoint:** `GET /admin/ttl-status`

**Description:** Monitors TTL index status, expired projects, and project statistics for system health.

**Authentication:** Required

**Authorization:** `admin`, `sub-admin`

**Response Status Codes:**
- `200 OK` - TTL status retrieved successfully
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Database error

**Response Body (200 OK):**
```json
{
  "ttlIndex": {
    "exists": "boolean",
    "name": "string (index name)",
    "expireAfterSeconds": "number",
    "expireAfterDays": "number"
  },
  "expiredProjects": {
    "count": "number",
    "projects": [
      {
        "title": "string",
        "rejectedAt": "ISO8601 datetime",
        "daysAgo": "number"
      }
    ]
  },
  "statistics": {
    "total": "number",
    "approved": "number",
    "rejected": "number",
    "pending": "number"
  },
  "recentRejections": [
    {
      "title": "string",
      "rejectedAt": "ISO8601 datetime",
      "daysAgo": "number"
    }
  ]
}
```

**Monitoring Data:**
1. **TTL Index Health:**
   - Confirms TTL index exists on `rejectedAt` field
   - Shows expiration time in seconds and days

2. **Expired Projects:**
   - Lists projects rejected >2 days ago (should be auto-deleted)
   - Indicates TTL execution lag if count > 0

3. **Statistics:**
   - Total project count
   - Approved projects
   - Rejected projects (with `rejectedAt`)
   - Pending projects (unapproved, not rejected)

4. **Recent Rejections:**
   - Projects rejected in last 7 days
   - Sorted by rejection date (newest first)

**Use Cases:**
- Monitor TTL index functionality
- Identify stale rejected projects
- System health dashboard
- Audit project approval workflow

**Notes:**
- TTL index runs every 60 seconds by default (MongoDB behavior)
- Expired projects may persist briefly before deletion
- Empty `expiredProjects` indicates healthy TTL operation

---

## Bulk Upload Operations

### 19. Bulk Upload Users/Projects

**Endpoint:** `POST /admin/upload/:type`

**Description:** Batch imports students, mentors, or projects from XLSX or CSV files.

**Authentication:** Required

**Authorization:** `admin` only

**Path Parameters:**
- `type` (string, required) - One of: `students`, `mentors`, `projects`

**Request:**
- **Content-Type:** `multipart/form-data`
- **Field Name:** `file`
- **Accepted Formats:** `.xlsx`, `.csv`
- **Max File Size:** 5 MB

**Response Status Codes:**
- `200 OK` - Data processed successfully
- `400 Bad Request` - Invalid file, format, or data
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions

**Response Body (200 OK - Students/Mentors):**
```json
{
  "message": "{type} uploaded and processed successfully",
  "count": "number (records created/updated)",
  "total": "number (total rows in file)",
  "skipped": "number (rows with invalid data)"
}
```

**Response Body (200 OK - Projects):**
```json
{
  "message": "Projects uploaded and processed successfully",
  "count": "number (projects created/updated)"
}
```

**Response Body (400 Bad Request - Various Scenarios):**
```json
{ "message": "No file uploaded" }
```
```json
{ "message": "Only .xlsx or .csv files are allowed" }
```
```json
{ "message": "File too large (max 5MB)" }
```
```json
{ "message": "Invalid type" }
```
```json
{
  "message": "No valid data found in the file. Please check the file format and content."
}
```
```json
{
  "message": "No valid student records found. Please ensure the file contains columns: email, name, rollNumber, batch, department",
  "total": "number",
  "processed": 0
}
```

---

### Students Upload Format

**Required Columns:**
- `email` (required, must include @)
- `name` (required)
- `rollNumber` (required)
- `batch` (optional)
- `department` (optional)
- `phone` (optional)
- `username` (optional, defaults to email prefix)

**Processing Logic:**
- Upserts based on email (updates existing, creates new)
- Auto-generates username from email if not provided
- Sets default password from `process.env.DEFAULT_PASS`
- Role automatically set to `student`
- Filters out rows with missing required fields
- Returns skipped count for invalid rows

**Example CSV:**
```csv
email,name,rollNumber,batch,department,phone,username
student1@example.com,John Doe,2021001,2021,CSE,1234567890,john.doe
student2@example.com,Jane Smith,2021002,2021,ECE,0987654321,jane.smith
```

---

### Mentors Upload Format

**Required Columns:**
- `email` (required, must include @)
- `name` (required)
- `empNo` (optional)
- `department` (optional)
- `designation` (optional)
- `phone` (optional)
- `username` (optional, defaults to email prefix)
- `maxTeams` (optional, default: 3)

**Processing Logic:**
- Upserts based on email
- Auto-generates username from email if not provided
- Sets default password
- Role automatically set to `mentor`
- Converts `maxTeams` to integer
- Filters out rows with missing required fields

**Example CSV:**
```csv
email,name,empNo,department,designation,phone,maxTeams
mentor1@example.com,Dr. Brown,EMP001,CSE,Professor,1234567890,5
mentor2@example.com,Dr. White,EMP002,ECE,Associate Professor,0987654321,3
```

---

### Projects Upload Format

**Special Handling:** Projects use XLSX with multiple sheets (categories).

**XLSX Structure:**
- Each sheet represents a project category
- Sheet name becomes project category
- Supports two column formats:
  1. Single column (`__EMPTY`): Title and description combined
  2. Two columns (`__EMPTY`, `__EMPTY_1`): Separate title and description

**Single Column Format:**
- Delimiter detection: `:-`, `:`, or `-`
- Text before delimiter = Title
- Text after delimiter = Description

**Required Columns (CSV):**
- `__EMPTY` (project title or combined)
- `__EMPTY_1` (description, optional if combined in `__EMPTY`)
- Sheet name automatically extracted as category

**Filtering:**
- Excludes rows with header text: "Project Name", "Problem Statements", "Problem Statement"
- Processes all other rows

**Processing Logic:**
- Upserts based on title
- Auto-approved with admin as proposer and approver
- Category extracted from sheet name
- Default `maxTeams`: Not explicitly set (model default applies)

**Example XLSX:**
- **Sheet: "Web Development"**
  - Row 1: E-commerce Platform:- Build a full-stack online store
  - Row 2: Social Media Dashboard:- Analytics tool for social platforms

- **Sheet: "Machine Learning"**
  - Row 1: Image Classification | Train CNN for medical imaging
  - Row 2: Sentiment Analysis - NLP model for customer reviews

---

### Common Upload Features

**File Handling:**
- Temporary upload to `uploads/` directory
- Automatic deletion after processing
- Memory-efficient stream processing for large files

**Error Handling:**
- Parse errors return detailed message
- Invalid rows logged and skipped (not blocking)
- Returns summary with total, processed, and skipped counts

**Security:**
- File size validation (5 MB limit)
- Extension whitelist (.xlsx, .csv)
- Automatic file cleanup on error

**Performance:**
- Bulk write operations for efficiency
- Upsert strategy prevents duplicates
- Processes all valid rows in single database operation

**Notes:**
- Uses `xlsx` library for XLSX parsing
- Uses `csv-parse` for CSV parsing
- Consider adding progress tracking for large imports
- Implement dry-run mode for validation before import

---

## Document Review

### 20. Get Document Review Status

**Endpoint:** `GET /admin/document-review-status`

**Description:** Comprehensive overview of all teams' document submission and approval status.

**Authentication:** Required

**Authorization:** `admin`, `sub-admin`

**Response Status Codes:**
- `200 OK` - Document review status retrieved
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Database error

**Response Body (200 OK):**
```json
{
  "teams": [
    {
      "_id": "string",
      "code": "string",
      "teamSize": "number",
      "status": "string",
      "batch": "string",
      "department": "string",
      "createdAt": "ISO8601 datetime",
      "leader": {
        "_id": "string",
        "name": "string",
        "email": "string",
        "rollNumber": "string"
      },
      "members": [
        {
          "_id": "string",
          "name": "string",
          "email": "string",
          "rollNumber": "string",
          "joinedAt": "ISO8601 datetime"
        }
      ],
      "mentor": {
        "_id": "string",
        "name": "string",
        "email": "string"
      },
      "finalProject": {
        "_id": "string",
        "title": "string",
        "category": "string"
      },
      "documents": {
        "projectAbstract": {
          "name": "string",
          "description": "string",
          "status": "string (not_submitted|draft|submitted|mentor_approved|admin_approved)",
          "submitted": "boolean",
          "submittedAt": "ISO8601 datetime",
          "submittedBy": "ObjectId",
          "mentorApproved": "boolean",
          "adminApproved": "boolean",
          "hasData": "boolean",
          "requiredForApproval": "boolean"
        },
        "roleSpecification": {
          "name": "string",
          "description": "string",
          "status": "string",
          "submitted": "boolean",
          "submittedAt": "ISO8601 datetime",
          "mentorApproved": "boolean",
          "adminApproved": "boolean",
          "hasData": "boolean",
          "requiredForApproval": "boolean"
        },
        "weeklyStatus": {
          "name": "string",
          "description": "string",
          "totalReports": "number",
          "submittedReports": "number",
          "approvedReports": "number",
          "reportsWithFiles": "number",
          "latestSubmission": "ISO8601 datetime",
          "requiredForApproval": "boolean",
          "reports": [
            {
              "week": "number",
              "status": "string",
              "submittedAt": "ISO8601 datetime",
              "hasFile": "boolean",
              "fileName": "string",
              "mentorScore": "number",
              "mentorComments": "string"
            }
          ]
        },
        "{pdfDocumentType}": {
          "name": "string",
          "description": "string",
          "status": "string",
          "submitted": "boolean",
          "uploadedAt": "ISO8601 datetime",
          "uploadedBy": "ObjectId",
          "originalName": "string",
          "filename": "string",
          "size": "number (bytes)",
          "mentorApproved": "boolean",
          "adminApproved": "boolean",
          "requiredForApproval": "boolean",
          "hasData": "boolean"
        }
      },
      "completionSummary": {
        "totalDocuments": "number",
        "submittedDocuments": "number",
        "approvedDocuments": "number"
      }
    }
  ],
  "documentTypes": [
    {
      "key": "string",
      "name": "string",
      "description": "string",
      "category": "string",
      "enabled": "boolean",
      "requiredForApproval": "boolean"
    }
  ],
  "statistics": {
    "totalTeams": "number",
    "teamsWithDocuments": "number",
    "fullyApprovedTeams": "number",
    "pendingReviewCount": "number",
    "documentTypeStats": [
      {
        "name": "string",
        "key": "string",
        "submitted": "number",
        "mentorApproved": "number",
        "adminApproved": "number",
        "pending": "number",
        "enabled": "boolean",
        "requiredForApproval": "boolean"
      }
    ]
  },
  "configuration": {
    "totalDocumentTypes": "number",
    "enabledDocumentTypes": "number",
    "requiredForApproval": "number",
    "lastUpdated": "ISO8601 datetime"
  }
}
```

**Document Types Tracked:**
1. **Project Abstract:** Project track, GitHub repo, tools, modules
2. **Role Specification:** Team member role assignments
3. **Weekly Status:** Weekly progress reports with file uploads
4. **PDF Documents:** Dynamically configured document types

**Document Status Values:**
- `not_submitted`: No data entered
- `draft`: Data entered but not submitted
- `submitted`: Submitted, pending mentor review
- `mentor_approved`: Approved by mentor, pending admin
- `admin_approved`: Fully approved

**Completion Summary:**
- Counts only documents with `requiredForApproval: true`
- `submittedDocuments`: Count of documents with submissions
- `approvedDocuments`: Count of admin-approved documents
- Used for team progress tracking

**Statistics:**
- **Overall:** Team counts, approval rates, pending reviews
- **Per Document Type:** Submission and approval counts
- **Configuration:** Dynamic document type configuration

**Dynamic Configuration:**
- Reads from `DocumentTypesConfig.getEnabled()`
- Only includes enabled document types
- Respects `requiredForApproval` flag

**Use Cases:**
- Admin dashboard overview
- Document review workflow
- Progress tracking
- Identification of blocked teams

**Notes:**
- Weekly status counts reports, not weeks
- PDF documents dynamically included based on config
- `hasData` indicates actual content exists (not just metadata)

---

### 21. Download Team Document

**Endpoint:** `GET /admin/team/:teamId/document/:documentType`

**Description:** Downloads a specific PDF document submitted by a team.

**Authentication:** Required

**Authorization:** `admin`, `sub-admin`

**Path Parameters:**
- `teamId` (string, required) - Team MongoDB ObjectId
- `documentType` (string, required) - Document type key from `DocumentTypesConfig`

**Response Status Codes:**
- `200 OK` - File sent successfully
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Team, document, or file not found
- `500 Internal Server Error` - File system error

**Response Headers (200 OK):**
- `Content-Type: application/pdf`
- `Content-Disposition: inline; filename="{originalName}"`

**Response Body (200 OK):**
- Raw PDF file data

**Response Body (404 Not Found - Various Scenarios):**
```json
{ "message": "Team not found" }
```
```json
{ "message": "Document not found" }
```
```json
{ "message": "Document file not found on server" }
```

**Document Lookup:**
- Searches `team.pdfDocuments[documentType]`
- Validates document path exists
- Checks file exists on filesystem

**File Delivery:**
- Uses `res.sendFile()` for efficient streaming
- Inline disposition (opens in browser)
- Preserves original filename

**Notes:**
- Only works for PDF documents
- File path resolved to absolute path
- Consider implementing download logging for audit

---

### 22. Delete Team Document

**Endpoint:** `DELETE /admin/team/:teamId/document/:documentType`

**Description:** Deletes a team's submitted PDF document and resets status to draft (allows re-upload).

**Authentication:** Required

**Authorization:** `admin`, `sub-admin`

**Path Parameters:**
- `teamId` (string, required) - Team MongoDB ObjectId
- `documentType` (string, required) - PDF document type key

**Response Status Codes:**
- `200 OK` - Document deleted successfully
- `400 Bad Request` - Invalid document type
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Team or document not found
- `500 Internal Server Error` - File system or database error

**Response Body (200 OK):**
```json
{
  "message": "Document deleted successfully. Team can now re-upload."
}
```

**Response Body (400 Bad Request):**
```json
{
  "message": "Invalid document type"
}
```

**Validation:**
- Document type must exist in `DocumentTypesConfig`
- Document category must be `pdf-document`
- Document must exist in team's `pdfDocuments`

**Deletion Process:**
1. Validate document type configuration
2. Locate team and document
3. Delete file from filesystem (if exists)
4. Reset document metadata to draft state
5. Save team document

**Reset State:**
```json
{
  "status": "draft",
  "mentorApproval": false,
  "adminApproval": false
}
```

**Side Effects:**
- Physical file deleted from `uploads/` directory
- Document metadata reset (not removed)
- Team can re-upload same document type
- Approval history lost

**Use Cases:**
- Incorrect document uploaded
- Request for document revision
- Quality control rejections

**Notes:**
- Does not delete document entry, only resets it
- File deletion silent if file doesn't exist
- Consider adding reason/feedback parameter

---

## System Maintenance

### 23. Flush All Data

**Endpoint:** `DELETE /admin/flush-all`

**Description:** **DANGEROUS** - Deletes all teams, projects, and non-admin/dev users. Resets system to initial state.

**Authentication:** Required

**Authorization:** `admin` only

**Response Status Codes:**
- `200 OK` - All collections deleted successfully
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions

**Response Body (200 OK):**
```json
{
  "message": "All collections deleted successfully."
}
```

**Deletion Scope:**
1. **Teams:** All team documents deleted
2. **Projects:** All project bank entries deleted
3. **Users:** All users except `role: admin` and `role: dev`
4. **Fixed Users:** Re-creates admin and dev accounts

**Preserved Data:**
- Admin users
- Dev users
- System configuration

**Process Flow:**
1. Delete all teams
2. Delete all projects
3. Delete students, mentors, sub-admins
4. Call `insertUsers()` to recreate fixed admin/dev accounts

**Security Warnings:**
- No confirmation prompt
- No backup created
- Irreversible operation
- Should require additional authentication factor
- Consider implementing soft delete or backup

**Use Cases:**
- Development environment reset
- Testing scenarios
- Demo preparation
- System migration preparation

**Recommendations:**
1. Implement confirmation parameter (e.g., `?confirm=YES_DELETE_ALL`)
2. Add dry-run mode
3. Create automatic backup before flush
4. Log flush operations with admin ID and timestamp
5. Restrict to development environment only

**Notes:**
- Intended for development/testing only
- Should be disabled or heavily restricted in production
- Consider replacing with targeted cleanup endpoints

---

### 24. Selective Flush

**Endpoint:** `DELETE /admin/flush/:type`

**Description:** Deletes specific data categories with cascading cleanup of related references.

**Authentication:** Required

**Authorization:** `admin` only

**Path Parameters:**
- `type` (string, required) - One of: `teams`, `projects`, `students`, `mentors`

**Response Status Codes:**
- `200 OK` - Data deleted successfully
- `400 Bad Request` - Invalid type
- `401 Unauthorized` - Invalid authentication
- `403 Forbidden` - Insufficient permissions

**Response Body (200 OK):**
```json
{
  "message": "{Type} deleted successfully",
  "deleted": {
    "main": "number (primary entities deleted)",
    "related": "number (related entities deleted)"
  },
  "updated": {
    "projects": "number (projects updated)",
    "teams": "number (teams updated)",
    "students": "number (students updated)",
    "mentors": "number (mentors updated)"
  }
}
```

---

### Flush Teams

**Type:** `teams`

**Primary Deletion:**
- All team documents

**Cascading Updates:**
1. **Projects:** Remove deleted team IDs from `assignedTeams` arrays
2. **Students:** Clear `studentData.currentTeam` references
3. **Mentors:** Remove deleted team IDs from `mentorData.assignedTeams` arrays

**Cleanup Logic:**
```javascript
- Delete all teams
- Update projects: $pull assignedTeams
- Update students: $set currentTeam = null
- Update mentors: $pull assignedTeams
```

**Response Example:**
```json
{
  "message": "Teams deleted successfully",
  "deleted": {
    "main": 45,
    "related": 0
  },
  "updated": {
    "projects": 12,
    "students": 180,
    "mentors": 15,
    "teams": 0
  }
}
```

---

### Flush Projects

**Type:** `projects`

**Primary Deletion:**
- All project bank entries

**Cascading Updates:**
1. **Teams:** Remove project IDs from `projectChoices` arrays
2. **Teams:** Clear `finalProject` references

**Cleanup Logic:**
```javascript
- Delete all projects
- Update teams: $pull projectChoices, $unset finalProject
```

**Response Example:**
```json
{
  "message": "Projects deleted successfully",
  "deleted": {
    "main": 87,
    "related": 0
  },
  "updated": {
    "teams": 45,
    "projects": 0,
    "students": 0,
    "mentors": 0
  }
}
```

---

### Flush Mentors

**Type:** `mentors`

**Primary Deletion:**
- All users with `role: mentor`

**Cascading Updates:**
1. **Teams:** Clear `mentor.assigned` references
2. **Teams:** Remove mentor IDs from `mentor.preferences` arrays
3. **Teams:** Reset `mentor.currentPreference` to 0

**Cleanup Logic:**
```javascript
- Delete all mentors
- Update teams: $unset mentor.assigned, $pull mentor.preferences, $set currentPreference = 0
```

**Response Example:**
```json
{
  "message": "Mentors deleted successfully",
  "deleted": {
    "main": 15,
    "related": 0
  },
  "updated": {
    "teams": 45,
    "projects": 0,
    "students": 0,
    "mentors": 0
  }
}
```

**Notes:**
- Sub-admins with mentor data are NOT deleted (role must be exactly `mentor`)
- Teams become unassigned and require mentor reallocation

---

### Flush Students

**Type:** `students`

**Primary Deletion:**
- All users with `role: student`

**Cascading Deletions:**
1. **Teams:** All team documents (teams invalid without students)
2. **Projects:** Student-proposed projects

**Cascading Updates:**
1. **Projects:** Clear all `assignedTeams` arrays
2. **Mentors:** Clear all `mentorData.assignedTeams` arrays

**Cleanup Logic:**
```javascript
- Delete all students
- Delete all teams (no students = no teams)
- Delete student-proposed projects
- Update remaining projects: $set assignedTeams = []
- Update mentors: $set assignedTeams = []
```

**Response Example:**
```json
{
  "message": "Students deleted successfully",
  "deleted": {
    "main": 180,
    "related": 45,
    "relatedProjects": 12
  },
  "updated": {
    "projects": 75,
    "mentors": 15,
    "teams": 0,
    "students": 0
  }
}
```

**Impact:**
- Most destructive flush operation
- Cascades to teams and student-proposed projects
- Essentially resets entire project allocation system

---

### Flush Type Summary

| Type | Deletes | Cascades To | Updates |
|------|---------|-------------|---------|
| **teams** | Teams | None | Projects, Students, Mentors |
| **projects** | Projects | None | Teams |
| **mentors** | Mentors | None | Teams |
| **students** | Students | Teams, Student Projects | Projects, Mentors |

**Common Features:**
- Tracks deletion and update counts
- Returns detailed operation summary
- Preserves referential integrity
- Prevents orphaned references

**Security Recommendations:**
- Add confirmation parameter
- Implement audit logging
- Restrict to development environments
- Consider soft delete alternative

---

## Error Responses

All endpoints follow consistent error response format:

```json
{
  "message": "string (human-readable error description)",
  "error": "string (technical details, development only)"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Request succeeded
- `201 Created` - Resource created
- `400 Bad Request` - Validation failure or invalid input
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions for operation
- `404 Not Found` - Resource does not exist
- `500 Internal Server Error` - Unexpected server error

**Authentication Errors:**
```json
{ "message": "Authentication required" }
```

**Authorization Errors:**
```json
{ "message": "Access denied. Admin or sub-admin role required." }
```

**Validation Errors:**
```json
{ "message": "Name, username, email, phone, and role are required" }
```

**Conflict Errors:**
```json
{ "message": "User already exists (username, email, or phone)" }
```

---

## Authentication & Authorization

**Authentication Method:**
- JWT token in HTTP-only cookie or `Authorization: Bearer <token>` header
- Token validated by `authenticate` middleware
- Invalid/expired tokens return `401 Unauthorized`

**Authorization Levels:**
- **Admin Only:** User registration, project CRUD, approval/rejection, bulk uploads, system flush
- **Admin & Sub-Admin:** View users/teams/projects, team approval, mentor allocation, document review, TTL monitoring

**Role Hierarchy:**
```
dev > admin > sub-admin > mentor > student
```

**Middleware Chain:**
```javascript
router.{method}(
  authenticate,           // Verify JWT token
  authorizeRoles(...),    // Check user role
  asyncHandler(async (req, res) => { ... })
);
```

---

## Rate Limiting Recommendations

Implement rate limiting on:
- **Bulk uploads:** 5 requests per hour per admin
- **Team approval:** 60 requests per minute
- **User registration:** 30 requests per minute
- **System flush:** 1 request per day (or disable in production)

---

## Logging Recommendations

Log the following events:
- All bulk upload operations (admin ID, type, count, timestamp)
- Project approvals/rejections (admin ID, project ID, timestamp)
- Team approvals/rejections (admin ID, team ID, timestamp)
- Mentor allocations (admin ID, team ID, mentor ID, timestamp)
- User CRUD operations (admin ID, user ID, operation, timestamp)
- System flush operations (admin ID, type, timestamp)
- Failed authorization attempts (user ID, endpoint, timestamp)

---

## Security Considerations

1. **Bulk Operations:**
   - Validate file integrity before processing
   - Scan uploaded files for malicious content
   - Limit file size and row count

2. **Email Notifications:**
   - Validate recipient email addresses
   - Rate limit email sending
   - Use email templates to prevent injection

3. **Data Deletion:**
   - Implement soft delete for audit trails
   - Require confirmation for destructive operations
   - Create automatic backups before flush

4. **Access Control:**
   - Enforce role-based permissions strictly
   - Log all admin actions
   - Implement session timeout

5. **File Operations:**
   - Validate file paths to prevent directory traversal
   - Store files outside web root
   - Implement virus scanning

---

## Environment Variables Required

```env
DEFAULT_PASS=<default-password-for-new-users>
EMAIL_USER=<gmail-account>
EMAIL_PASS=<gmail-app-password>
JWT_SECRET=<secret-key>
NODE_ENV=<development|production>
```

---

## Performance Optimization

1. **Database Queries:**
   - Use `.lean()` for read-only operations
   - Populate only necessary fields
   - Implement pagination for large datasets

2. **Bulk Operations:**
   - Use `bulkWrite()` for batch inserts/updates
   - Process files in streams for large uploads
   - Implement background job queue for heavy operations

3. **Caching:**
   - Cache frequently accessed data (document types config)
   - Implement Redis for session management
   - Use CDN for static file downloads

---

## Testing Checklist

**User Management:**
- [ ] Register student/mentor/admin
- [ ] Update user with role change
- [ ] Delete user
- [ ] Uniqueness validation (email, phone, username)

**Team Management:**
- [ ] Approve team with valid project choices
- [ ] Reject team with feedback
- [ ] Allocate mentor within capacity
- [ ] Prevent duplicate mentor allocation

**Project Bank:**
- [ ] Create project
- [ ] Update project details
- [ ] Delete unassigned project
- [ ] Approve proposed project
- [ ] Reject proposed project with feedback
- [ ] Schedule discussion
- [ ] Verify TTL deletion after 2 days

**Bulk Uploads:**
- [ ] Upload valid student CSV
- [ ] Upload valid mentor XLSX
- [ ] Upload valid project XLSX
- [ ] Handle invalid file format
- [ ] Handle oversized files
- [ ] Verify upsert behavior

**Document Review:**
- [ ] Fetch all team documents
- [ ] Download PDF document
- [ ] Delete document and verify reset

**System Maintenance:**
- [ ] Flush teams and verify cascades
- [ ] Flush projects and verify team updates
- [ ] Flush students and verify related deletions
- [ ] Flush mentors and verify team updates

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-28  
**API Version:** 1.0
