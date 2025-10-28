# Common API Documentation

## Overview

The Common module provides shared endpoints accessible by multiple roles (students, mentors) for team management, project proposals, and document reviews.

**Base Path:** `/common`

**Authentication Method:** JWT (JSON Web Token)

**Authorization:** Role-specific (specified per endpoint)

---

## Student Endpoints

### 1. Get Project Bank

**Endpoint:** `GET /common/project-bank`

**Description:** Retrieves all approved and available projects for team selection.

**Authorization:** All authenticated users

**Response (200 OK):**

```json
[
  {
    "_id": "string",
    "title": "string",
    "description": "string",
    "category": "string",
    "maxTeams": "number",
    "assignedTeams": ["array of team IDs"],
    "isAvailable": "boolean (virtual: assignedTeams.length < maxTeams)",
    "proposedBy": { "user object" }
  }
]
```

**Filtering:** Only shows `isApproved: true` and `rejectedAt: null` projects.

---

### 2. Get My Proposed Projects

**Endpoint:** `GET /common/my-proposed-projects`

**Description:** Retrieves all projects proposed by the authenticated student.

**Authorization:** `student`

**Response (200 OK):**

```json
[
  {
    "_id": "string",
    "title": "string",
    "description": "string",
    "category": "string",
    "isApproved": "boolean",
    "rejectedAt": "ISO8601 datetime",
    "feedback": [
      {
        "message": "string",
        "byUser": { "name": "string" },
        "at": "ISO8601 datetime"
      }
    ],
    "createdAt": "ISO8601 datetime"
  }
]
```

---

### 3. Create Team

**Endpoint:** `POST /common/create-team`

**Description:** Creates a new team with the student as leader.

**Authorization:** `student`

**Request Body:**

```json
{
  "projectChoices": ["array of project ObjectIds, required"],
  "mentorChoices": ["array of mentor ObjectIds, required"]
}
```

**Response (201 Created):**

```json
{
  "message": "Team created successfully.",
  "team": {
    "_id": "string",
    "code": "string (6 uppercase alphanumeric)",
    "leader": "ObjectId",
    "projectChoices": [],
    "mentor": {
      "preferences": [],
      "currentPreference": 0
    }
  }
}
```

**Side Effects:**

- Auto-generates unique 6-character team code
- Sets user's `studentData.currentTeam` to new team
- Batch and department copied from leader's profile

---

### 4. Join Team

**Endpoint:** `POST /common/join-team`

**Description:** Allows student to join an existing team using team code.

**Authorization:** `student`

**Request Body:**

```json
{
  "code": "string (6 uppercase alphanumeric, required)"
}
```

**Response (200 OK):**

```json
{
  "message": "You have joined the team successfully."
}
```

**Validation:**

- Team must exist
- Team cannot be full (max 3 members + leader = 4 total)
- Student must not already be in a team
- Student's batch must match team's batch
- Student's department must match team's department

---

### 5. Leave Team

**Endpoint:** `POST /common/leave-team`

**Description:** Removes student from their current team.

**Authorization:** `student`

**Response (200 OK - Member Leaves):**

```json
{
  "message": "You have left the team."
}
```

**Response (200 OK - Leader Leaves):**

```json
{
  "message": "You have left the team. Leadership transferred to the next member."
}
```

**Response (200 OK - Last Member):**

```json
{
  "message": "Team has been deleted as no members remain."
}
```

**Logic:**

- **Member:** Removed from `members` array, `currentTeam` cleared
- **Leader (with members):** Leadership transferred to first member
- **Leader (no members):** Team deleted, project and mentor references cleared

---

### 6. Propose Project

**Endpoint:** `POST /common/propose-project`

**Description:** Submits a new project proposal for admin review.

**Authorization:** `student`

**Request Body:**

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "category": "string (required)"
}
```

**Response (201 Created):**

```json
{
  "message": "Project proposed. Please wait for admin to respond.",
  "project": {
    "_id": "string",
    "title": "string",
    "description": "string",
    "category": "string"
  }
}
```

**Validation:**

- Case-insensitive duplicate title check
- All fields trimmed before saving
- `isApproved` defaults to false

---

### 7. Update Proposed Project

**Endpoint:** `PUT /common/update-proposed-project/:id`

**Description:** Edits a pending project proposal.

**Authorization:** `student`

**Path Parameters:**

- `id` - Project ObjectId

**Request Body:**

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "category": "string (required)"
}
```

**Response (200 OK):**

```json
{
  "message": "Project updated successfully.",
  "project": { "project details" }
}
```

**Validation:**

- Must be the proposer
- Project must not be approved
- Case-insensitive duplicate title check (excluding current project)

---

### 8. Withdraw Project

**Endpoint:** `POST /common/withdraw-project/:id`

**Description:** Deletes a pending project proposal.

**Authorization:** `student`

**Response (200 OK):**

```json
{
  "message": "Project withdrawn successfully."
}
```

**Validation:**

- Must be the proposer
- Project must not be approved

---

## Mentor Endpoints

### 9. Get Mentors List

**Endpoint:** `GET /common/mentors`

**Description:** Retrieves list of all mentors (for team creation).

**Authorization:** All authenticated users

**Response (200 OK):**

```json
[
  {
    "_id": "string",
    "name": "string",
    "email": "string"
  }
]
```

---

### 10. Get Teams for Approval

**Endpoint:** `GET /common/teams`

**Description:** Retrieves teams awaiting approval from the authenticated mentor (based on current preference).

**Authorization:** `mentor`

**Response (200 OK):**

```json
[
  {
    "_id": "string",
    "code": "string",
    "leader": { "user object" },
    "members": ["array of student objects"],
    "projectChoices": ["array of project objects"]
  }
]
```

**Filtering Logic:**

- Team has mentor in `mentor.preferences`
- Team status is `approved`
- Team has no assigned mentor yet
- Current preference index points to this mentor

---

### 11. Accept Team

**Endpoint:** `POST /common/accept-team`

**Description:** Mentor accepts team assignment and selects final project.

**Authorization:** `mentor`

**Request Body:**

```json
{
  "teamId": "string (required, ObjectId)",
  "finalProject": "string (required, ObjectId)",
  "feedback": "string (optional)"
}
```

**Response (200 OK):**

```json
{
  "message": "Team accepted successfully."
}
```

**Validation:**

- Team must exist and be approved
- Team must not have assigned mentor
- Mentor must be current preference
- Final project must be in team's `projectChoices`
- Project must be approved
- Project must have available slots (`assignedTeams.length < maxTeams`)

**Side Effects (Atomic Transaction):**

- Sets `team.mentor.assigned` to mentor ID
- Sets `team.mentor.assignedAt` to current timestamp
- Sets `team.finalProject` to selected project
- Adds team to `project.assignedTeams`
- Adds team to `mentor.mentorData.assignedTeams`
- Adds optional feedback

---

### 12. Reject Team

**Endpoint:** `POST /common/reject-team`

**Description:** Mentor rejects team assignment, moves to next mentor preference.

**Authorization:** `mentor`

**Request Body:**

```json
{
  "teamId": "string (required, ObjectId)",
  "feedback": "string (optional)"
}
```

**Response (200 OK):**

```json
{
  "message": "Team rejected. Moved to next mentor preference."
}
```

**Logic:**

- Validates mentor is current preference
- Adds optional feedback
- Increments `team.mentor.currentPreference`
- Sets to `-1` if no more mentors available

---

### 13. Get Document Review Status

**Endpoint:** `GET /common/mentor/document-review-status`

**Description:** Comprehensive document submission status for mentor's assigned teams.

**Authorization:** `mentor`

**Response (200 OK):**

```json
{
  "teams": [
    {
      "_id": "string",
      "code": "string",
      "teamSize": "number",
      "status": "string",
      "leader": { "student details" },
      "members": ["student details"],
      "finalProject": { "project details" },
      "documents": {
        "projectAbstract": {
          "name": "string",
          "status": "string",
          "submitted": "boolean",
          "mentorApproved": "boolean",
          "data": { "full form data" }
        },
        "roleSpecification": { "similar structure" },
        "weeklyStatus": {
          "totalReports": "number",
          "approvedReports": "number",
          "reports": []
        }
      },
      "completionSummary": {
        "totalDocuments": "number",
        "submittedDocuments": "number",
        "approvedDocuments": "number"
      }
    }
  ],
  "documentTypes": ["array of enabled document types"],
  "statistics": {
    "totalTeams": "number",
    "pendingReviewCount": "number"
  }
}
```

**Document Types:**

- `projectAbstract`: Includes full form data with project details
- `roleSpecification`: Includes assignments with populated member details
- `weeklyStatus`: Array of weekly reports with scoring
- PDF documents (dynamically configured)

---

### 14. Download Team Document

**Endpoint:** `GET /common/mentor/team/:teamId/document/:documentType`

**Description:** Downloads PDF document from mentor's assigned team.

**Authorization:** `mentor`

**Response (200 OK):** PDF file stream

**Validation:**

- Team must be assigned to mentor
- Document must exist and have file

---

### 15. Get Teams Progress

**Endpoint:** `GET /common/mentor/teams-progress`

**Description:** Retrieves weekly status submissions for all assigned teams.

**Authorization:** `mentor`

**Response (200 OK):**

```json
{
  "teams": [
    {
      "_id": "string",
      "code": "string",
      "leader": {},
      "members": [],
      "finalProject": {},
      "weeklyStatus": [
        {
          "_id": "string",
          "week": "number",
          "module": "string",
          "progress": "string",
          "achievements": "string",
          "challenges": "string",
          "projectFile": {
            "originalName": "string",
            "size": "number"
          },
          "status": "string",
          "mentorScore": "number",
          "mentorComments": "string",
          "submittedAt": "ISO8601 datetime"
        }
      ]
    }
  ]
}
```

---

### 16. Approve PDF Document

**Endpoint:** `PUT /common/mentor/team/:teamId/document/:documentType/approve`

**Description:** Mentor approves a team's submitted PDF document.

**Authorization:** `mentor`

**Response (200 OK):**

```json
{
  "message": "Document approved successfully",
  "document": {
    "type": "string",
    "status": "mentor_approved",
    "mentorApproval": true,
    "mentorApprovedAt": "ISO8601 datetime"
  }
}
```

**Validation:**

- Mentor must be assigned to team
- Document must be uploaded
- Cannot approve admin-approved documents

---

### 17. Reject PDF Document

**Endpoint:** `PUT /common/mentor/team/:teamId/document/:documentType/reject`

**Description:** Mentor rejects a team's submitted PDF document with reason.

**Authorization:** `mentor`

**Request Body:**

```json
{
  "reason": "string (optional)"
}
```

**Response (200 OK):**

```json
{
  "message": "Document rejected successfully",
  "document": {
    "type": "string",
    "status": "rejected",
    "rejectionReason": "string"
  }
}
```

**Validation:**

- Mentor must be assigned to team
- Document must be uploaded
- Cannot reject admin-approved documents

---

## Error Responses

**Common Error Status Codes:**

- `400 Bad Request` - Missing fields, validation failure
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Not the owner or insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Environment Variables

None specific to this module. Uses shared JWT and database configuration.

---

## Security Considerations

1. **Team Operations:**

   - Validate batch and department matching
   - Enforce team size limits
   - Prevent duplicate team membership

2. **Project Proposals:**

   - Case-insensitive duplicate prevention
   - Ownership verification for edits/withdrawals
   - Cannot modify approved projects

3. **Mentor Operations:**

   - Validate mentor assignment before operations
   - Atomic transactions for team acceptance
   - Prevent duplicate mentor assignments

4. **Document Operations:**
   - Verify mentor-team relationship
   - Respect document approval hierarchy
   - Protect file system paths

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-28  
**API Version:** 1.0
