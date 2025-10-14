# PAMS Backend API Documentation

## Overview

This is the backend server for PAMS (Project Allocation and Management System). It provides a RESTful API built with Node.js, Express.js, and MongoDB.

## Base URL

```
Development: http://localhost:5000
Production: [Your production URL]
```

## Authentication

Most endpoints require authentication using JWT tokens stored in httpOnly cookies.

### Headers Required
```
Cookie: token=<JWT_TOKEN>
Content-Type: application/json
```

## API Routes

The API is organized into four main route groups:

1. **Authentication Routes** (`/auth`) - User authentication and password management
2. **Admin Routes** (`/admin`) - Administrative operations
3. **Common Routes** (`/common`) - Shared operations for mentors and students
4. **Team Routes** (`/team`) - Team-specific operations

---

## 📝 Authentication Routes (`/auth`)

### 1. Get User Profile

**GET** `/auth/user`

Get the authenticated user's profile information.

**Authentication:** Required

**Request Body:** None

**Response:**
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "role": "student",
  "phone": "1234567890",
  "studentData": {
    "rollNumber": "2021001",
    "batch": "2021-2025",
    "department": "Computer Science",
    "currentTeam": "team_id"
  }
}
```

**Possible Errors:**
- `401 Unauthorized` - No token provided or invalid token
- `404 Not Found` - User not found

---

### 2. Login

**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Authentication:** Not required

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "isFirstLogin": false
  }
}
```

**Possible Errors:**
- `400 Bad Request` - Username or password missing
- `401 Unauthorized` - Invalid credentials
- `500 Internal Server Error` - Server error

---

### 3. Logout

**POST** `/auth/logout`

Clear the authentication token.

**Authentication:** Not required

**Request Body:** None

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Possible Errors:** None

---

### 4. Change Password

**PUT** `/auth/change-password`

Change the user's password (typically on first login).

**Authentication:** Required

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

**Possible Errors:**
- `400 Bad Request` - Current or new password missing
- `401 Unauthorized` - Current password incorrect
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

---

### 5. Forgot Password

**POST** `/auth/forgot-password`

Request a password reset code via email.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset code sent to your email"
}
```

**Possible Errors:**
- `400 Bad Request` - Email missing
- `404 Not Found` - User not found
- `500 Internal Server Error` - Failed to send email

---

### 6. Reset Password

**POST** `/auth/reset-password`

Reset password using the code received via email.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "john@example.com",
  "code": "123456",
  "newPassword": "newPassword789"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

**Possible Errors:**
- `400 Bad Request` - Email, code, or new password missing
- `400 Bad Request` - Invalid or expired reset code
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

---

## 👥 Admin Routes (`/admin`)

### 1. Get All Students

**GET** `/admin/students`

Retrieve all students in the system.

**Authentication:** Required (Admin, Sub-Admin)

**Request Body:** None

**Response:**
```json
{
  "students": [
    {
      "_id": "student_id",
      "name": "John Doe",
      "email": "john@example.com",
      "username": "johndoe",
      "phone": "1234567890",
      "role": "student",
      "studentData": {
        "rollNumber": "2021001",
        "batch": "2021-2025",
        "department": "Computer Science",
        "currentTeam": "team_id"
      }
    }
  ]
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - No students found

---

### 2. Get All Mentors

**GET** `/admin/mentors`

Retrieve all mentors and sub-admins.

**Authentication:** Required (Admin, Sub-Admin)

**Request Body:** None

**Response:**
```json
{
  "mentors": [
    {
      "_id": "mentor_id",
      "name": "Dr. Smith",
      "email": "smith@example.com",
      "username": "drsmith",
      "phone": "9876543210",
      "role": "mentor",
      "mentorData": {
        "empNo": "EMP001",
        "department": "Computer Science",
        "designation": "Professor",
        "maxTeams": 3,
        "assignedTeams": ["team_id_1", "team_id_2"]
      }
    }
  ]
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - No mentors found

---

### 3. Get All Teams

**GET** `/admin/teams`

Retrieve all teams with complete information.

**Authentication:** Required (Admin, Sub-Admin)

**Request Body:** None

**Response:**
```json
{
  "teams": [
    {
      "_id": "team_id",
      "code": "ABC123",
      "leader": { /* populated user object */ },
      "members": [
        {
          "student": { /* populated user object */ },
          "joinedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "batch": "2021-2025",
      "department": "Computer Science",
      "projectChoices": [ /* populated project objects */ ],
      "finalProject": { /* populated project object */ },
      "mentor": {
        "assigned": { /* populated mentor object */ },
        "preferences": [ /* populated mentor objects */ ],
        "currentPreference": 0
      },
      "status": "approved",
      "feedback": []
    }
  ]
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - No teams found

---

### 4. Get All Projects

**GET** `/admin/projects`

Retrieve all projects in the project bank.

**Authentication:** Required (Admin, Sub-Admin)

**Request Body:** None

**Response:**
```json
{
  "projects": [
    {
      "_id": "project_id",
      "title": "AI Chatbot",
      "description": "Build an intelligent chatbot",
      "category": "R&D",
      "maxTeams": 2,
      "assignedTeams": ["team_id"],
      "isApproved": true,
      "proposedBy": { /* populated user object */ },
      "approvedBy": { /* populated user object */ },
      "feedback": [],
      "isAvailable": true,
      "rejectedAt": null
    }
  ]
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - No projects found

---

### 5. Create Project

**POST** `/admin/projects`

Create a new project in the project bank.

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "title": "AI Chatbot",
  "description": "Build an intelligent chatbot using NLP",
  "category": "R&D",
  "maxTeams": 2
}
```

**Response:**
```json
{
  "message": "Project added successfully.",
  "project": {
    "_id": "project_id",
    "title": "AI Chatbot",
    "description": "Build an intelligent chatbot using NLP",
    "category": "R&D",
    "maxTeams": 2,
    "isApproved": true,
    "proposedBy": "admin_id",
    "approvedBy": "admin_id"
  }
}
```

**Possible Errors:**
- `400 Bad Request` - Title, description, or category missing
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin

---

### 6. Update Project

**PUT** `/admin/projects/:id`

Update an existing project.

**Authentication:** Required (Admin)

**URL Parameters:**
- `id` - Project ID

**Request Body:**
```json
{
  "title": "Updated AI Chatbot",
  "description": "Enhanced description",
  "category": "R&D",
  "maxTeams": 3
}
```

**Response:**
```json
{
  "message": "Project updated successfully.",
  "project": { /* updated project object */ }
}
```

**Possible Errors:**
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin
- `404 Not Found` - Project not found

---

### 7. Delete Project

**DELETE** `/admin/projects/:id`

Delete a project from the project bank.

**Authentication:** Required (Admin)

**URL Parameters:**
- `id` - Project ID

**Request Body:** None

**Response:**
```json
{
  "message": "Project deleted successfully."
}
```

**Possible Errors:**
- `400 Bad Request` - Project assigned to active teams
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin
- `404 Not Found` - Project not found

---

### 8. Approve Project

**POST** `/admin/approve-project/:id`

Approve a proposed project.

**Authentication:** Required (Admin)

**URL Parameters:**
- `id` - Project ID

**Request Body:**
```json
{
  "feedback": "Excellent project idea!"
}
```

**Response:**
```json
{
  "message": "Project approved successfully."
}
```

**Possible Errors:**
- `400 Bad Request` - Project already approved
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin
- `404 Not Found` - Project not found

---

### 9. Reject Project

**POST** `/admin/reject-project/:id`

Reject a proposed project.

**Authentication:** Required (Admin)

**URL Parameters:**
- `id` - Project ID

**Request Body:**
```json
{
  "feedback": "Project scope is too broad"
}
```

**Response:**
```json
{
  "message": "Project marked as rejected."
}
```

**Possible Errors:**
- `400 Bad Request` - Project already approved or feedback missing
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin
- `404 Not Found` - Project not found

---

### 10. Schedule Project Discussion

**POST** `/admin/schedule-project-discussion`

Schedule a meeting for project discussion.

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "projectId": "project_id",
  "dateTime": "2024-01-20T14:00:00.000Z"
}
```

**Response:**
```json
{
  "message": "Meeting for project 'AI Chatbot' scheduled for [date]."
}
```

**Possible Errors:**
- `400 Bad Request` - Project ID or dateTime missing, invalid date format
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin
- `404 Not Found` - Project not found

---

### 11. Register User

**POST** `/admin/register`

Register a new user (student, mentor, or sub-admin).

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "1234567890",
  "role": "student",
  "studentData": {
    "rollNumber": "2021001",
    "batch": "2021-2025",
    "department": "Computer Science"
  }
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": "user_id"
}
```

**Possible Errors:**
- `400 Bad Request` - Required fields missing or user already exists
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin

---

### 12. Delete User

**DELETE** `/admin/user/:id`

Delete a user from the system.

**Authentication:** Required (Admin)

**URL Parameters:**
- `id` - User ID

**Request Body:** None

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin
- `404 Not Found` - User not found

---

### 13. Update User

**PUT** `/admin/user/:id`

Update user information and role.

**Authentication:** Required (Admin)

**URL Parameters:**
- `id` - User ID

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "newemail@example.com",
  "role": "mentor",
  "phone": "9876543210",
  "mentorData": {
    "empNo": "EMP001",
    "department": "Computer Science",
    "designation": "Professor",
    "maxTeams": 3
  }
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "user": { /* updated user object */ }
}
```

**Possible Errors:**
- `400 Bad Request` - Email/username/phone already in use, required fields for role missing
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin
- `404 Not Found` - User not found

---

### 14. Bulk Upload Users/Projects

**POST** `/admin/upload/:type`

Upload users (students/mentors) or projects in bulk via Excel/CSV file.

**Authentication:** Required (Admin)

**URL Parameters:**
- `type` - "students", "mentors", or "projects"

**Request Body:** `multipart/form-data`
- `file` - Excel (.xlsx) or CSV file

**File Format for Students:**
```csv
name, email, username, phone, rollNumber, batch, department
John Doe, john@example.com, johndoe, 1234567890, 2021001, 2021-2025, Computer Science
```

**File Format for Mentors:**
```csv
name, email, username, phone, empNo, department, designation, maxTeams
Dr. Smith, smith@example.com, drsmith, 9876543210, EMP001, Computer Science, Professor, 3
```

**Response:**
```json
{
  "message": "Students uploaded and processed successfully",
  "count": 25,
  "total": 27,
  "skipped": 2
}
```

**Possible Errors:**
- `400 Bad Request` - No file uploaded, invalid file type, invalid data format
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin

---

### 15. Approve Team

**POST** `/admin/approve/:id`

Approve a team formation.

**Authentication:** Required (Admin, Sub-Admin)

**URL Parameters:**
- `id` - Team ID

**Request Body:**
```json
{
  "feedback": "Good team composition"
}
```

**Response:**
```json
{
  "message": "Team approved successfully"
}
```

**Possible Errors:**
- `400 Bad Request` - Team already approved, project not approved
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Team not found

---

### 16. Reject Team

**POST** `/admin/reject/:id`

Reject a team formation.

**Authentication:** Required (Admin, Sub-Admin)

**URL Parameters:**
- `id` - Team ID

**Request Body:**
```json
{
  "feedback": "Team composition needs improvement"
}
```

**Response:**
```json
{
  "message": "Team rejected successfully"
}
```

**Possible Errors:**
- `400 Bad Request` - Team already rejected
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Team not found

---

### 17. Get Remaining Mentors

**GET** `/admin/remaining-mentors`

Get mentors who have capacity for more teams.

**Authentication:** Required (Admin, Sub-Admin)

**Request Body:** None

**Response:**
```json
{
  "mentors": [
    {
      "_id": "mentor_id",
      "name": "Dr. Smith",
      "email": "smith@example.com"
    }
  ]
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions

---

### 18. Allocate Mentor to Team

**POST** `/admin/allocate/:team_id/:mentor_id`

Allocate a mentor and final project to a team.

**Authentication:** Required (Admin, Sub-Admin)

**URL Parameters:**
- `team_id` - Team ID
- `mentor_id` - Mentor ID

**Request Body:**
```json
{
  "finalProject": "project_id"
}
```

**Response:**
```json
{
  "message": "Mentor allocated successfully"
}
```

**Possible Errors:**
- `400 Bad Request` - Team not approved, team already has mentor, mentor at capacity, final project not in team's choices
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Team, mentor, or project not found

---

### 19. Flush All Data

**DELETE** `/admin/flush-all`

Delete all non-admin users, teams, and projects. Reinitialize fixed users.

**Authentication:** Required (Admin)

**Request Body:** None

**Response:**
```json
{
  "message": "All collections deleted successfully."
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin

---

### 20. Flush Data by Type

**DELETE** `/admin/flush/:type`

Delete specific data type with cascading updates.

**Authentication:** Required (Admin)

**URL Parameters:**
- `type` - "students", "mentors", "projects", or "teams"

**Request Body:** None

**Response:**
```json
{
  "message": "Students deleted successfully",
  "deleted": {
    "main": 25,
    "related": 10,
    "relatedProjects": 5
  },
  "updated": {
    "projects": 8,
    "teams": 0,
    "students": 0,
    "mentors": 5
  }
}
```

**Possible Errors:**
- `400 Bad Request` - Invalid type
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin

---

### 21. Get TTL Status

**GET** `/admin/ttl-status`

Get Time-To-Live status for rejected projects.

**Authentication:** Required (Admin, Sub-Admin)

**Request Body:** None

**Response:**
```json
{
  "ttlIndex": {
    "exists": true,
    "name": "rejectedAt_1",
    "expireAfterSeconds": 172800,
    "expireAfterDays": 2
  },
  "expiredProjects": {
    "count": 3,
    "projects": [
      {
        "title": "Old Project",
        "rejectedAt": "2024-01-01T00:00:00.000Z",
        "daysAgo": 15
      }
    ]
  },
  "statistics": {
    "total": 50,
    "approved": 35,
    "rejected": 10,
    "pending": 5
  },
  "recentRejections": []
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Database error

---

### 22. Get Document Review Status (Admin)

**GET** `/admin/document-review-status`

Get comprehensive document review status for all teams.

**Authentication:** Required (Admin, Sub-Admin)

**Request Body:** None

**Response:**
```json
{
  "teams": [
    {
      "_id": "team_id",
      "code": "ABC123",
      "leader": { /* user object */ },
      "members": [ /* member objects */ ],
      "mentor": { /* mentor object */ },
      "finalProject": { /* project object */ },
      "documents": {
        "projectAbstract": {
          "name": "Project Abstract",
          "status": "mentor_approved",
          "submitted": true,
          "submittedAt": "2024-01-15T10:30:00.000Z",
          "mentorApproved": true,
          "adminApproved": false
        },
        "roleSpecification": { /* similar structure */ },
        "weeklyStatus": {
          "totalReports": 5,
          "submittedReports": 5,
          "approvedReports": 3
        }
      },
      "completionSummary": {
        "totalDocuments": 3,
        "submittedDocuments": 2,
        "approvedDocuments": 1
      }
    }
  ],
  "documentTypes": [ /* enabled document types */ ],
  "statistics": {
    "totalTeams": 15,
    "teamsWithDocuments": 12,
    "fullyApprovedTeams": 5,
    "pendingReviewCount": 8
  }
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server error

---

### 23. Download Team Document (Admin)

**GET** `/admin/team/:teamId/document/:documentType`

Download a team's PDF document.

**Authentication:** Required (Admin, Sub-Admin)

**URL Parameters:**
- `teamId` - Team ID
- `documentType` - Document type key

**Request Body:** None

**Response:** PDF file download

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Team or document not found
- `500 Internal Server Error` - Server error

---

### 24. Delete Team Document (Admin)

**DELETE** `/admin/team/:teamId/document/:documentType`

Delete a team's document to allow re-upload.

**Authentication:** Required (Admin, Sub-Admin)

**URL Parameters:**
- `teamId` - Team ID
- `documentType` - Document type key

**Request Body:** None

**Response:**
```json
{
  "message": "Document deleted successfully. Team can now re-upload."
}
```

**Possible Errors:**
- `400 Bad Request` - Invalid document type
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Team or document not found

---

## 🤝 Common Routes (`/common`)

These routes are accessible to both mentors and students.

### 1. Get Project Bank

**GET** `/common/project-bank`

Get all available approved projects.

**Authentication:** Required

**Request Body:** None

**Response:**
```json
[
  {
    "_id": "project_id",
    "title": "AI Chatbot",
    "description": "Build an intelligent chatbot",
    "category": "R&D",
    "maxTeams": 2,
    "assignedTeams": ["team_id"],
    "isAvailable": true,
    "proposedBy": { /* user object */ }
  }
]
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated

---

### 2. Get Mentors List

**GET** `/common/mentors`

Get list of all mentors.

**Authentication:** Required

**Request Body:** None

**Response:**
```json
[
  {
    "_id": "mentor_id",
    "name": "Dr. Smith",
    "email": "smith@example.com"
  }
]
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated

---

### 3. Get Teams for Mentor Approval

**GET** `/common/teams`

Get teams pending approval from current mentor (based on preferences).

**Authentication:** Required (Mentor)

**Request Body:** None

**Response:**
```json
[
  {
    "_id": "team_id",
    "code": "ABC123",
    "leader": { /* user object */ },
    "members": [ /* user objects */ ],
    "projectChoices": [ /* project objects */ ]
  }
]
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a mentor
- `404 Not Found` - No teams to approve

---

### 4. Create Team

**POST** `/common/create-team`

Create a new team (student leader).

**Authentication:** Required (Student)

**Request Body:**
```json
{
  "projectChoices": ["project_id_1", "project_id_2", "project_id_3"],
  "mentorChoices": ["mentor_id_1", "mentor_id_2", "mentor_id_3"]
}
```

**Response:**
```json
{
  "message": "Team created successfully.",
  "team": {
    "_id": "team_id",
    "code": "ABC123",
    "leader": "student_id",
    "batch": "2021-2025",
    "department": "Computer Science"
  }
}
```

**Possible Errors:**
- `400 Bad Request` - Missing fields, user already in team, batch/department mismatch
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a student

---

### 5. Join Team

**POST** `/common/join-team`

Join an existing team using team code.

**Authentication:** Required (Student)

**Request Body:**
```json
{
  "code": "ABC123"
}
```

**Response:**
```json
{
  "message": "You have successfully joined the team!",
  "team": { /* team object */ }
}
```

**Possible Errors:**
- `400 Bad Request` - Code missing, team full, already in team, batch/department mismatch
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a student
- `404 Not Found` - Team not found

---

### 6. Propose Project

**POST** `/common/propose-project`

Propose a new project as a student.

**Authentication:** Required (Student)

**Request Body:**
```json
{
  "title": "Student Project",
  "description": "Innovative project idea",
  "category": "Startup"
}
```

**Response:**
```json
{
  "message": "Project proposed successfully. Awaiting admin approval.",
  "project": { /* project object */ }
}
```

**Possible Errors:**
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a student

---

### 7. Leave Team

**PUT** `/common/leave-team`

Leave current team (only members, not leader).

**Authentication:** Required (Student)

**Request Body:** None

**Response:**
```json
{
  "message": "You have successfully left the team."
}
```

**Possible Errors:**
- `400 Bad Request` - Not part of any team, leader cannot leave
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a student
- `404 Not Found` - Team not found

---

### 8. Approve Team (Mentor)

**POST** `/common/approve-team/:id`

Approve a team as mentor during selection phase.

**Authentication:** Required (Mentor)

**URL Parameters:**
- `id` - Team ID

**Request Body:** None

**Response:**
```json
{
  "message": "Team approved successfully."
}
```

**Possible Errors:**
- `400 Bad Request` - Not in mentor's preference list or not current preference
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a mentor
- `404 Not Found` - Team not found

---

### 9. Reject Team (Mentor)

**POST** `/common/reject-team/:id`

Reject a team and move to next mentor preference.

**Authentication:** Required (Mentor)

**URL Parameters:**
- `id` - Team ID

**Request Body:** None

**Response:**
```json
{
  "message": "Team rejected. Moved to next mentor preference."
}
```

**Possible Errors:**
- `400 Bad Request` - Not in mentor's preference list, no more preferences
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a mentor
- `404 Not Found` - Team or next mentor not found

---

### 10. Approve Form (Mentor)

**POST** `/common/approve-form/:teamId/:formType`

Approve a team's submitted form (mentor).

**Authentication:** Required (Mentor)

**URL Parameters:**
- `teamId` - Team ID
- `formType` - "projectAbstract" or "roleSpecification"

**Request Body:**
```json
{
  "customMessage": "Great work!"
}
```

**Response:**
```json
{
  "message": "Project Abstract approved successfully.",
  "updatedStatus": "mentor_approved"
}
```

**Possible Errors:**
- `400 Bad Request` - Invalid form type, form not submitted
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not assigned to this team
- `404 Not Found` - Team or form not found

---

### 11. Reject Form (Mentor)

**POST** `/common/reject-form/:teamId/:formType`

Reject a team's submitted form (mentor).

**Authentication:** Required (Mentor)

**URL Parameters:**
- `teamId` - Team ID
- `formType` - "projectAbstract" or "roleSpecification"

**Request Body:**
```json
{
  "customMessage": "Needs more detail"
}
```

**Response:**
```json
{
  "message": "Project Abstract rejected. Team can resubmit.",
  "updatedStatus": "rejected"
}
```

**Possible Errors:**
- `400 Bad Request` - Invalid form type, form not submitted, message required
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not assigned to this team
- `404 Not Found` - Team or form not found

---

### 12. Get Document Review Status (Mentor)

**GET** `/common/mentor/document-review-status`

Get document review status for mentor's assigned teams.

**Authentication:** Required (Mentor)

**Request Body:** None

**Response:**
```json
{
  "teams": [ /* similar to admin endpoint but only assigned teams */ ],
  "documentTypes": [ /* enabled document types */ ],
  "statistics": {
    "totalTeams": 3,
    "teamsWithDocuments": 2,
    "fullyApprovedTeams": 1,
    "pendingReviewCount": 2
  }
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a mentor
- `500 Internal Server Error` - Server error

---

### 13. Download Team Document (Mentor)

**GET** `/common/mentor/team/:teamId/document/:documentType`

Download a team's document (only for assigned teams).

**Authentication:** Required (Mentor)

**URL Parameters:**
- `teamId` - Team ID
- `documentType` - Document type key

**Request Body:** None

**Response:** PDF file download

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not assigned to this team
- `404 Not Found` - Team or document not found

---

## 👨‍👩‍👦 Team Routes (`/team`)

### 1. Get Team Details

**GET** `/team/details`

Get current user's team details.

**Authentication:** Required (Student)

**Request Body:** None

**Response:**
```json
{
  "team": {
    "_id": "team_id",
    "code": "ABC123",
    "leader": { /* populated user */ },
    "members": [ /* populated members */ ],
    "projectChoices": [ /* populated projects */ ],
    "finalProject": { /* populated project */ },
    "mentor": {
      "assigned": { /* populated mentor */ },
      "preferences": [ /* populated mentors */ ]
    },
    "status": "approved",
    "feedback": [],
    "projectAbstract": { /* form data */ },
    "roleSpecification": { /* form data */ },
    "evaluation": {
      "weeklyStatus": [ /* weekly reports */ ]
    }
  }
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a student
- `404 Not Found` - No team found

---

### 2. Update Project Abstract

**PUT** `/team/project-abstract`

Submit or update project abstract (Form 1).

**Authentication:** Required (Student)

**Request Body:**
```json
{
  "projectTrack": "R&D",
  "githubRepo": "https://github.com/user/repo",
  "tools": [
    {
      "name": "React",
      "version": "18.0",
      "type": "Frontend",
      "purpose": "UI Development"
    }
  ],
  "modules": [
    {
      "name": "Authentication",
      "functionality": "User login and registration"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Project Abstract submitted successfully.",
  "status": "submitted"
}
```

**Possible Errors:**
- `400 Bad Request` - Missing fields, invalid GitHub URL, already submitted
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not team leader/member
- `404 Not Found` - No team found

---

### 3. Update Role Specification

**PUT** `/team/role-specification`

Submit or update role specification (Form 2).

**Authentication:** Required (Student)

**Request Body:**
```json
{
  "assignments": [
    {
      "member": "user_id",
      "role": "Frontend Developer",
      "tasks": ["UI Design", "Component Development"]
    }
  ]
}
```

**Response:**
```json
{
  "message": "Role Specification submitted successfully.",
  "status": "submitted"
}
```

**Possible Errors:**
- `400 Bad Request` - Missing fields, member not in team, already submitted
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not team leader/member
- `404 Not Found` - No team found

---

### 4. Get Project Abstract

**GET** `/team/project-abstract`

Get team's project abstract.

**Authentication:** Required (Student)

**Request Body:** None

**Response:**
```json
{
  "projectAbstract": {
    "projectTrack": "R&D",
    "githubRepo": "https://github.com/user/repo",
    "tools": [ /* tools array */ ],
    "modules": [ /* modules array */ ],
    "status": "mentor_approved",
    "submittedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a student
- `404 Not Found` - No team or abstract found

---

### 5. Get Role Specification

**GET** `/team/role-specification`

Get team's role specification.

**Authentication:** Required (Student)

**Request Body:** None

**Response:**
```json
{
  "roleSpecification": {
    "assignments": [ /* assignments array */ ],
    "status": "submitted",
    "submittedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a student
- `404 Not Found` - No team or role specification found

---

### 6. Get Current Week

**GET** `/team/current-week`

Get current week number based on project timeline.

**Authentication:** Required (Student)

**Request Body:** None

**Response:**
```json
{
  "currentWeek": 5,
  "startDate": "2024-01-01T00:00:00.000Z",
  "weekDateRange": {
    "from": "2024-01-29T00:00:00.000Z",
    "to": "2024-02-04T23:59:59.999Z"
  },
  "hasAccess": true
}
```

**Possible Errors:**
- `400 Bad Request` - Project timeline not set
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a student
- `404 Not Found` - No team found

---

### 7. Get Weekly Status for Week

**GET** `/team/weekly-status/:week`

Get weekly status report for specific week.

**Authentication:** Required (Student)

**URL Parameters:**
- `week` - Week number

**Request Body:** None

**Response:**
```json
{
  "weeklyStatus": {
    "week": 5,
    "dateRange": {
      "from": "2024-01-29T00:00:00.000Z",
      "to": "2024-02-04T23:59:59.999Z"
    },
    "module": "Authentication Module",
    "progress": 75,
    "achievements": "Implemented login and registration",
    "challenges": "Faced issues with JWT validation",
    "studentRemarks": "Need mentor guidance",
    "projectFile": {
      "filename": "week5.zip",
      "originalName": "week5_submission.zip",
      "size": 1024000
    },
    "status": "mentor_approved",
    "mentorScore": 8,
    "mentorComments": "Good progress",
    "submittedAt": "2024-02-04T18:00:00.000Z"
  }
}
```

**Possible Errors:**
- `400 Bad Request` - Invalid week number, project timeline not set
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a student
- `404 Not Found` - No team or weekly status found

---

### 8. Submit Weekly Status

**POST** `/team/weekly-status/:week`

Submit weekly status report with file upload.

**Authentication:** Required (Student)

**URL Parameters:**
- `week` - Week number

**Request Body:** `multipart/form-data`
```
module: "Authentication Module"
progress: "75"
achievements: "Implemented login"
challenges: "JWT issues"
studentRemarks: "Need help"
projectFile: [ZIP file]
```

**Response:**
```json
{
  "message": "Weekly status for Week 5 submitted successfully.",
  "weeklyStatus": { /* weekly status object */ }
}
```

**Possible Errors:**
- `400 Bad Request` - Missing fields, invalid week, invalid file type, file too large, already submitted
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not team leader/member, timeline not set
- `404 Not Found` - No team found

---

### 9. Update Weekly Status

**PUT** `/team/weekly-status/:week`

Update existing weekly status (if not approved).

**Authentication:** Required (Student)

**URL Parameters:**
- `week` - Week number

**Request Body:** `multipart/form-data`
```
module: "Updated module"
progress: "80"
achievements: "Updated achievements"
challenges: "Updated challenges"
studentRemarks: "Updated remarks"
projectFile: [ZIP file - optional]
```

**Response:**
```json
{
  "message": "Weekly status updated successfully.",
  "weeklyStatus": { /* updated weekly status */ }
}
```

**Possible Errors:**
- `400 Bad Request` - Invalid week, already approved, invalid file
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not team leader/member
- `404 Not Found` - No team or weekly status found

---

### 10. Get All Weekly Status

**GET** `/team/all-weekly-status`

Get all weekly status submissions for team.

**Authentication:** Required (Student)

**Request Body:** None

**Response:**
```json
{
  "weeklyStatuses": [
    {
      "week": 1,
      "status": "mentor_approved",
      "mentorScore": 9,
      "submittedAt": "2024-01-07T18:00:00.000Z"
    }
  ],
  "currentWeek": 5,
  "totalSubmissions": 4
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a student
- `404 Not Found` - No team found

---

### 11. Download Weekly Status File

**GET** `/team/weekly-status/:week/download`

Download project file for specific week.

**Authentication:** Required (Student)

**URL Parameters:**
- `week` - Week number

**Request Body:** None

**Response:** ZIP file download

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a student
- `404 Not Found` - No team, weekly status, or file found

---

### 12. Delete Weekly Status

**DELETE** `/team/weekly-status/:week`

Delete weekly status submission (if not approved).

**Authentication:** Required (Student)

**URL Parameters:**
- `week` - Week number

**Request Body:** None

**Response:**
```json
{
  "message": "Weekly status deleted successfully"
}
```

**Possible Errors:**
- `400 Bad Request` - Cannot delete approved submission
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not team leader/member
- `404 Not Found` - No team or weekly status found

---

### 13. Get Timeline Information

**GET** `/team/timeline-info`

Get project timeline details.

**Authentication:** Required (Student)

**Request Body:** None

**Response:**
```json
{
  "hasTimeline": true,
  "startDate": "2024-01-01T00:00:00.000Z",
  "duration": 12,
  "currentWeek": 5
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a student
- `404 Not Found` - No team found

---

### 14. Get Teams for Form Approval (Mentor)

**GET** `/team/mentor/forms-pending`

Get teams with forms pending mentor approval.

**Authentication:** Required (Mentor)

**Request Body:** None

**Response:**
```json
{
  "teams": [
    {
      "_id": "team_id",
      "code": "ABC123",
      "leader": { /* user */ },
      "pendingFormsCount": 2,
      "forms": {
        "projectAbstract": {
          "status": "submitted",
          "submittedAt": "2024-01-15T10:30:00.000Z"
        },
        "roleSpecification": {
          "status": "draft"
        }
      }
    }
  ],
  "totalPendingForms": 5
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a mentor
- `500 Internal Server Error` - Server error

---

### 15. Approve/Reject Form (Admin)

**POST** `/team/admin/approve-form`

Approve or reject a team's form (admin final approval).

**Authentication:** Required (Admin, Sub-Admin)

**Request Body:**
```json
{
  "teamId": "team_id",
  "formType": "projectAbstract",
  "action": "approve",
  "customMessage": "Excellent work!"
}
```

**Response:**
```json
{
  "message": "Form approved successfully",
  "updatedStatus": "admin_approved"
}
```

**Possible Errors:**
- `400 Bad Request` - Missing fields, invalid action/form type, form not mentor approved
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Team or form not found

---

### 16. Approve/Reject Form (Mentor)

**POST** `/team/mentor/approve-form`

Approve or reject a team's form (mentor approval).

**Authentication:** Required (Mentor, Sub-Admin)

**Request Body:**
```json
{
  "teamId": "team_id",
  "formType": "projectAbstract",
  "action": "approve",
  "customMessage": "Good start!"
}
```

**Response:**
```json
{
  "message": "Form approved successfully",
  "updatedStatus": "mentor_approved"
}
```

**Possible Errors:**
- `400 Bad Request` - Missing fields, invalid action/form type, form not submitted
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not assigned to this team
- `404 Not Found` - Team or form not found

---

### 17. Get Admin Weekly Submissions

**GET** `/team/admin/weekly-submissions`

Get all weekly submissions across teams (admin view).

**Authentication:** Required (Admin, Sub-Admin)

**Query Parameters:**
- `teamId` (optional) - Filter by team
- `status` (optional) - Filter by status

**Request Body:** None

**Response:**
```json
{
  "weeklySubmissions": [
    {
      "_id": "submission_id",
      "teamId": "team_id",
      "teamCode": "ABC123",
      "mentorName": "Dr. Smith",
      "week": 5,
      "status": "submitted",
      "mentorScore": null,
      "submittedAt": "2024-02-04T18:00:00.000Z"
    }
  ],
  "totalTeams": 15,
  "totalSubmissions": 45
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions

---

### 18. Download Project File (Admin)

**GET** `/team/admin/download/:teamId/:week`

Download team's weekly project file (admin).

**Authentication:** Required (Admin, Sub-Admin)

**URL Parameters:**
- `teamId` - Team ID
- `week` - Week number

**Request Body:** None

**Response:** ZIP file download

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Team, submission, or file not found

---

### 19. Get Mentor Weekly Submissions

**GET** `/team/mentor/weekly-submissions`

Get weekly submissions for mentor's assigned teams.

**Authentication:** Required (Mentor)

**Request Body:** None

**Response:**
```json
{
  "weeklySubmissions": [
    {
      "_id": "submission_id",
      "teamId": "team_id",
      "teamCode": "ABC123",
      "week": 5,
      "status": "submitted",
      "mentorScore": 8,
      "submittedAt": "2024-02-04T18:00:00.000Z"
    }
  ],
  "totalTeams": 3,
  "totalSubmissions": 15
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a mentor

---

### 20. Download Project File (Mentor)

**GET** `/team/mentor/download/:teamId/:week`

Download team's weekly project file (mentor).

**Authentication:** Required (Mentor)

**URL Parameters:**
- `teamId` - Team ID
- `week` - Week number

**Request Body:** None

**Response:** ZIP file download

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not assigned to this team
- `404 Not Found` - Team, submission, or file not found

---

### 21. Score Weekly Submission (Mentor)

**PUT** `/team/mentor/score-submission/:teamId/:week`

Score and comment on team's weekly submission.

**Authentication:** Required (Mentor)

**URL Parameters:**
- `teamId` - Team ID
- `week` - Week number

**Request Body:**
```json
{
  "mentorScore": 8,
  "mentorComments": "Good progress this week. Keep it up!"
}
```

**Response:**
```json
{
  "message": "Weekly submission scored successfully",
  "weeklyStatus": { /* updated weekly status */ }
}
```

**Possible Errors:**
- `400 Bad Request` - Score out of range (0-10), submission not submitted
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not assigned to this team
- `404 Not Found` - Team or submission not found

---

### 22. Get Team Dashboard (Mentor)

**GET** `/team/mentor/dashboard`

Get mentor's dashboard with team statistics.

**Authentication:** Required (Mentor)

**Request Body:** None

**Response:**
```json
{
  "teams": [
    {
      "_id": "team_id",
      "code": "ABC123",
      "totalSubmissions": 5,
      "averageScore": 8.2,
      "pendingReviews": 1
    }
  ],
  "statistics": {
    "totalTeams": 3,
    "totalSubmissions": 15,
    "averageScore": 7.8,
    "pendingReviews": 3
  }
}
```

**Possible Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a mentor

---

### 23. Upload PDF Document

**POST** `/team/upload-pdf/:documentType`

Upload a PDF document for team.

**Authentication:** Required (Student)

**URL Parameters:**
- `documentType` - Document type key

**Request Body:** `multipart/form-data`
- `document` - PDF file

**Response:**
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "status": "submitted",
    "originalName": "document.pdf",
    "size": 1024000,
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Possible Errors:**
- `400 Bad Request` - Invalid document type, no file, invalid file type, file too large, already uploaded
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not team leader/member, document type disabled
- `404 Not Found` - No team found

---

### 24. Get Team Document

**GET** `/team/document/:documentType`

Get team's document information.

**Authentication:** Required (Student)

**URL Parameters:**
- `documentType` - Document type key

**Request Body:** None

**Response:**
```json
{
  "document": {
    "status": "mentor_approved",
    "originalName": "document.pdf",
    "size": 1024000,
    "uploadedAt": "2024-01-15T10:30:00.000Z",
    "mentorApproval": true,
    "adminApproval": false
  }
}
```

**Possible Errors:**
- `400 Bad Request` - Invalid document type
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not a student
- `404 Not Found` - No team or document found

---

### 25. Delete PDF Document

**DELETE** `/team/document/:documentType`

Delete team's PDF document (if not approved).

**Authentication:** Required (Student)

**URL Parameters:**
- `documentType` - Document type key

**Request Body:** None

**Response:**
```json
{
  "message": "Document deleted successfully"
}
```

**Possible Errors:**
- `400 Bad Request` - Invalid document type, cannot delete approved document
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not team leader/member
- `404 Not Found` - No team or document found

---

## Error Response Format

All error responses follow this structure:

```json
{
  "message": "Error description"
}
```

## HTTP Status Codes

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request creating a resource
- `400 Bad Request` - Invalid input or business logic error
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/pams

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Default Password
DEFAULT_PASS=password123

# Email Configuration (for Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# CORS
CLIENT_URL=http://localhost:5173
```

## Running the Backend

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **cookie-parser** - Parse cookies
- **cors** - CORS middleware
- **dotenv** - Environment variables
- **multer** - File upload handling
- **nodemailer** - Email sending
- **xlsx** - Excel file parsing
- **csv-parse** - CSV file parsing
- **express-async-handler** - Async error handling
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **hpp** - HTTP Parameter Pollution protection
- **compression** - Response compression

## Security Best Practices

1. Always use HTTPS in production
2. Keep JWT_SECRET secure and complex
3. Use environment variables for sensitive data
4. Implement rate limiting on auth endpoints
5. Validate all user inputs
6. Use httpOnly cookies for JWT tokens
7. Implement proper CORS configuration
8. Keep dependencies updated
9. Use helmet for security headers
10. Implement proper error handling

## API Testing

Use tools like Postman or Thunder Client to test the API endpoints. Import the provided Postman collection for quick testing.

## Support

For issues or questions, contact the development team or create an issue in the repository.

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Developed by:** Akshat Lila & Bhavya Jain

## 🔐 Security Architecture

### Authentication Middleware (`middleware/authenticate.js`)

Comprehensive JWT-based authentication:

**Features:**

- Dual token support: cookies and Authorization headers
- Automatic token validation and user verification
- Cookie management with security flags
- Error handling with token cleanup

**Implementation:**

```javascript
const authenticate = async (req, res, next) => {
  // Token extraction from cookies or headers
  // JWT verification with error handling
  // User existence validation
  // Request object augmentation with user data
};
```

### Authorization Middleware (`middleware/authorizeRoles.js`)

Role-based access control:

**Features:**

- Flexible role checking with spread operator support
- Granular permission control
- Clean error responses for unauthorized access

**Usage Example:**

```javascript
router.get(
  "/admin-only",
  authenticate,
  authorizeRoles("admin", "sub-admin"),
  handler
);
```

### Security Middleware Stack

Comprehensive security implementation in `index.js`:

1. **Helmet**: Security headers protection
2. **CORS**: Configurable cross-origin request handling
3. **Rate Limiting**: Brute force attack prevention (100 requests/15 minutes)
4. **HPP**: HTTP Parameter Pollution protection
5. **Compression**: Response optimization
6. **Input Sanitization**: NoSQL injection prevention
7. **Cookie Security**: Secure, HttpOnly, SameSite configuration

## 🛣️ API Routes

### Authentication Routes (`routes/auth.js`)

**Endpoints:**

- `GET /auth/me` - Get current user profile
- `POST /auth/login` - User authentication with JWT generation
- `POST /auth/logout` - Secure logout with cookie clearing
- `POST /auth/forgot-password` - Email-based password reset
- `POST /auth/reset-password` - Password reset with token validation
- `POST /auth/change-password` - Authenticated password change

**Features:**

- Comprehensive input validation
- Secure password hashing with bcrypt
- Email notifications via Nodemailer
- Remember me functionality
- First login handling

### Admin Routes (`routes/admin.js`)

**User Management:**

- `GET /admin/students` - List all students with team information
- `GET /admin/mentors` - List all mentors with assignment data
- `POST /admin/register` - Bulk user registration
- `PUT /admin/user/:id` - Update user information and roles
- `DELETE /admin/user/:id` - Remove users with validation

**Team Management:**

- `GET /admin/teams` - Comprehensive team listing with population
- `POST /admin/allocate/:team_id/:mentor_id` - Mentor allocation
- `GET /admin/remaining-mentors` - Available mentors for allocation

**Project Management:**

- `GET /admin/projects` - Project bank management
- `POST /admin/upload-projects` - Bulk project upload via Excel/CSV
- `PUT /admin/approve-project/:id` - Project approval workflow

**System Operations:**

- `POST /admin/upload-users` - Bulk user import
- `DELETE /admin/flush-all` - System reset functionality

### Team Routes (`routes/team.js`)

**Team Operations:**

- `POST /team/create` - Team creation with validation
- `POST /team/join` - Team joining mechanism
- `PUT /team/leave` - Team departure handling
- `GET /team/my-team` - Current team information

**Project Management:**

- `POST /team/select-projects` - Project preference submission
- `POST /team/propose-project` - Custom project proposal

**Evaluation System:**

- `POST /team/submit-form` - Form submission handling
- `GET /team/pending-forms` - Pending evaluation tracking
- `POST /team/mentor-feedback` - Feedback submission

### Common Routes (`routes/common.js`)

**Shared Functionality:**

- `GET /common/projects` - Available projects listing
- `GET /common/teams-for-approval` - Mentor approval queue
- `POST /common/approve-team` - Team approval by mentors
- `GET /common/system-settings` - Global configuration access

## 🗄️ Database Configuration

### Connection Setup (`config/db.js`)

MongoDB connection with Mongoose:

- Connection pooling optimization
- Error handling and retry logic
- Environment-based configuration
- Graceful shutdown handling

### Fixed Users (`middleware/fixedUsers.js`)

Automatic system user creation:

- Default admin account initialization
- Developer account setup
- Environment-based configuration
- Password hashing and security

## 🚀 Server Configuration

### Environment Variables

**Required Configuration:**

```env
# Database
MONGO_URI=mongodb://localhost:27017/pams

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Email Service
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password

# Default Users
ADMIN_EMAIL=admin@dept.edu
ADMIN_PASS=secure-admin-password
DEFAULT_PASS=default-user-password

# Production Settings
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
PORT=5000
```

**Optional Configuration:**

```env
# Multiple Client URLs (comma-separated)
CLIENT_URLS=https://domain1.com,https://domain2.com

# Developer Account
DEV_EMAIL=dev@dept.edu
DEV_PASS=dev-password
```

### Production Optimizations

- **Trust Proxy**: Configured for deployment behind reverse proxies
- **Security Headers**: Comprehensive security header management
- **Graceful Shutdown**: Proper cleanup on process termination
- **Error Handling**: Centralized error management
- **Logging**: Structured logging with Morgan

## 🛠️ Development

### Getting Started

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Environment Setup:**

   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

3. **Database Setup:**

   ```bash
   # Ensure MongoDB is running
   # Default connection: mongodb://localhost:27017/pams
   ```

4. **Start Development Server:**

   ```bash
   npm run dev
   ```

### Available Scripts

- `npm start` - Production server
- `npm run dev` - Development server with nodemon
- `npm test` - Run test suite (placeholder)

### Development Features

- **Hot Reloading**: Automatic server restart with nodemon
- **Debug Logging**: Comprehensive request/response logging
- **Error Stack Traces**: Detailed error information in development
- **CORS Flexibility**: Relaxed CORS policies for development

## 🔍 API Usage Examples

### Authentication Flow

```javascript
// Login
POST /auth/login
{
  "username": "admin",
  "password": "password123",
  "rememberMe": true
}

// Get User Profile
GET /auth/me
Headers: {
  "Authorization": "Bearer <jwt-token>"
}
```

### Team Operations

```javascript
// Create Team
POST /team/create
{
  "name": "Awesome Team",
  "description": "We build awesome things"
}

// Join Team
POST /team/join
{
  "teamCode": "ABC123"
}
```

### Admin Operations

```javascript
// Create User
POST /admin/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "student",
  "studentData": {
    "rollNumber": "21CS001",
    "batch": "2021-25",
    "department": "Computer Science"
  }
}
```

## 🐛 Error Handling

### Centralized Error Management

The application uses a centralized error handling middleware that:

- Standardizes error response format
- Logs errors for debugging
- Provides appropriate HTTP status codes
- Sanitizes error messages for production

### Common Error Responses

```javascript
// Authentication Error
{
  "message": "Authentication token not provided or in an invalid format."
}

// Authorization Error
{
  "message": "Access denied"
}

// Validation Error
{
  "message": "Validation failed",
  "errors": ["Field is required", "Invalid format"]
}
```

## 📈 Performance Considerations

### Database Optimization

- **Indexing**: Strategic indexes on frequently queried fields
- **Population**: Efficient data loading with selective field population
- **Lean Queries**: Memory-optimized queries where possible
- **TTL Indexes**: Automatic cleanup of expired data

### Security Performance

- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Compression**: Reduces bandwidth usage
- **Caching**: Strategic caching for static data
- **Connection Pooling**: Efficient database connection management

## 🧪 Testing

The backend is designed to be testable with:

- **Modular Architecture**: Easy unit testing of individual components
- **Dependency Injection**: Mockable external dependencies
- **Environment Isolation**: Test-specific configurations
- **Error Simulation**: Comprehensive error condition testing

The backend includes a comprehensive testing suite located in the `test/` directory.

### Available Tests

**Test Scripts:**

```bash
# Generate dummy data for testing
npm run test:dummy

# Test TTL index functionality
npm run test:ttl

# Run all tests
npm test

# Interactive test runner
npm run test:run [command]
```

**Test Files:**

- `test/dummyData.js` - Generates realistic test data for development
- `test/test-ttl.js` - Tests TTL index for automatic project cleanup
- `test/runTests.js` - Interactive test runner with colored output

### Dummy Data Generation

The `dummyData.js` script creates a complete test dataset:

- **Users**: 22 total (2 admin, 15 students, 5 mentors)
- **Teams**: 5 teams with proper relationships
- **Projects**: 8 projects in project bank
- **Timeline**: Complete project timelines and weekly updates
- **Evaluations**: Mentor evaluations and progress tracking

**Sample Credentials After Generation:**

- Admin: `admin@dept.edu` / `admin123`
- Dev: `dev@dept.edu` / `dev123`
- Student: `student1@dept.edu` / `student1123`
- Mentor: `mentor1@dept.edu` / `mentor1123`

### TTL Testing

The TTL test verifies automatic cleanup of rejected projects after 2 days, ensuring database efficiency and compliance with data retention policies.

### Usage Examples

```bash
# Quick setup for development
npm run test:dummy

# Verify TTL functionality
npm run test:ttl

# Full test suite
npm test

# Interactive mode
node test/runTests.js help
```

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database connection secured
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Error logging implemented
- [ ] Health check endpoints
- [ ] Graceful shutdown handling
- [ ] Process monitoring

### Deployment Options

- **Traditional VPS**: PM2 process management
- **Docker**: Containerized deployment
- **Cloud Platforms**: Heroku, AWS, Google Cloud
- **Serverless**: API Gateway + Lambda (with modifications)

This backend provides a solid foundation for the PAMS application and can be extended to support additional features and modules as needed.
