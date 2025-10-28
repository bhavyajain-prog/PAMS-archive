# PAMS Backend API Documentation

## Overview

This directory contains comprehensive API documentation for the PAMS (Project Allocation and Management System) backend. The documentation is organized by functional modules for easy navigation.

**Backend Framework:** Express.js 5.x  
**Database:** MongoDB with Mongoose ODM  
**Authentication:** JWT (JSON Web Tokens)  
**API Version:** 1.0  
**Last Updated:** 2025-10-28

---

## Documentation Structure

### 1. [Authentication API](./API_AUTHENTICATION.md)

**Endpoints:** 6 routes  
**Base Path:** `/auth`  
**Roles:** All users, public endpoints

**Key Features:**

- User login and logout
- Session management with JWT
- Password change (first-time and regular)
- Forgot password workflow
- Password reset with email tokens

**Core Workflows:**

- Standard login flow
- First-time login with mandatory password change
- Password reset via email

---

### 2. [Admin API](./API_ADMIN.md)

**Endpoints:** 31 routes  
**Base Path:** `/admin`  
**Roles:** `admin`, `sub-admin` (specific routes admin-only)

**Key Features:**

- **User Management:** CRUD operations for students, mentors, admins
- **Team Management:** View, approve, reject, allocate mentors
- **Project Bank:** Manage projects, approve/reject proposals
- **Bulk Operations:** Upload CSV/XLSX files for students, mentors, projects
- **Document Review:** Comprehensive document submission tracking
- **System Maintenance:** Flush data (teams, projects, users by type)

**Critical Operations:**

- Bulk user/project imports
- Team approval and mentor allocation
- Project proposal approval workflow
- TTL monitoring for rejected projects
- Document review status dashboard

---

### 3. [Common API](./API_COMMON.md)

**Endpoints:** 17 routes  
**Base Path:** `/common`  
**Roles:** `student`, `mentor`

**Key Features:**

- **Student Operations:** Team creation, joining, leaving, project proposals
- **Mentor Operations:** Team acceptance/rejection, document review
- **Shared Resources:** Project bank access, mentor list

**Core Workflows:**

- Team formation and management
- Project proposal submission and editing
- Mentor-team assignment process
- Document approval workflow (mentor level)

---

### 4. [Team API](./API_TEAM.md)

**Endpoints:** 19+ routes  
**Base Path:** `/team`  
**Roles:** Primarily `student`, some `mentor` access

**Key Features:**

- **Project Abstract:** Submit technical project details
- **Role Specification:** Assign modules to team members
- **Weekly Status:** Submit progress reports with file uploads
- **PDF Documents:** Upload and manage project documents
- **Project Timeline:** Create and track project milestones
- **Document Status:** Track submission and approval states

**File Upload Types:**

- Weekly Status Reports: ZIP files (max 50MB)
- PDF Documents: PDF files (max 10MB)

---

## Quick Reference

### Base URL

```
http://localhost:5000
```

_Production:_ Update based on deployment URL

---

### Authentication

All protected endpoints require authentication via:

**Option 1: HTTP-only Cookie** (Preferred)

```
Cookie: token=<JWT>
```

**Option 2: Authorization Header**

```
Authorization: Bearer <JWT>
```

**Token Expiration:**

- Default: 1 day
- With "Remember Me": 7 days

---

### Role-Based Access

| Role          | Access Level           | Primary Endpoints                            |
| ------------- | ---------------------- | -------------------------------------------- |
| **dev**       | Highest (system admin) | All endpoints                                |
| **admin**     | Full administrative    | `/admin/*`, `/common/*`, `/team/*` (read)    |
| **sub-admin** | Limited administrative | `/admin/*` (most routes), `/common/mentor/*` |
| **mentor**    | Team oversight         | `/common/mentor/*`, `/team/*` (read/score)   |
| **student**   | Team member            | `/common/*`, `/team/*`                       |

---

### Common Response Formats

**Success Response:**

```json
{
  "message": "Operation successful",
  "data": {}
}
```

**Error Response:**

```json
{
  "message": "Human-readable error description",
  "error": "Technical details (development only)"
}
```

**Common HTTP Status Codes:**

- `200 OK` - Request succeeded
- `201 Created` - Resource created
- `400 Bad Request` - Validation error or bad input
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `413 Payload Too Large` - File upload exceeds limit
- `500 Internal Server Error` - Server error

---

## API Workflow Examples

### 1. User Registration & First Login

**Admin Action:**

```
POST /admin/register
Body: { name, username, email, role, ... }
→ User created with default password
```

**Student/Mentor Action:**

```
POST /auth/login
Body: { username, password: "default" }
→ Response: { firstLogin: true }

PUT /auth/me/password
Body: { newPassword: "new_secure_pass" }
→ Password updated, firstLogin cleared
```

---

### 2. Team Formation & Project Selection

**Student Creates Team:**

```
POST /common/create-team
Body: { projectChoices: [], mentorChoices: [] }
→ Team created with unique code
```

**Other Students Join:**

```
POST /common/join-team
Body: { code: "ABC123" }
→ Added to team members
```

**Admin Approves Team:**

```
POST /admin/approve/:teamId
Body: { feedback: "Approved" }
→ Team status = approved
```

**Mentor Accepts Team:**

```
POST /common/accept-team
Body: { teamId, finalProject, feedback }
→ Mentor assigned, project finalized
```

---

### 3. Document Submission Workflow

**Project Abstract:**

```
PUT /team/project-abstract
Body: { projectTrack, githubRepo, tools, modules }
→ Status: draft

PUT /team/project-abstract/finalize
→ Status: submitted
```

**Mentor Review:**

```
GET /common/mentor/document-review-status
→ View all team documents

PUT /common/mentor/team/:teamId/document/:type/approve
→ Status: mentor_approved
```

**Admin Final Approval:**

```
GET /admin/document-review-status
→ View all team documents (admin dashboard)
```

---

### 4. Weekly Status Submission

**Student Submits:**

```
POST /team/weekly-status
Form Data:
  - week: 1
  - module: "Authentication"
  - progress: "80%"
  - achievements: "..."
  - challenges: "..."
  - projectFile: <ZIP file>
→ Submission created
```

**Mentor Scores:**

```
PUT /team/weekly-status/:submissionId
Body: { score: 85, comments: "Good progress" }
→ Status: mentor_approved, score recorded
```

**Student Views Progress:**

```
GET /team/weekly-status
→ All submissions with scores
```

---

## Environment Variables

Required environment variables for backend operation:

```env
# Database
MONGO_URI=mongodb://localhost:27017/pams

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=1d

# Email (for password reset)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password

# Admin Credentials (fixed users)
ADMIN_EMAIL=admin@example.com
ADMIN_PASS=admin123
DEFAULT_PASS=password123

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

## File Upload Configuration

### Weekly Status Reports

- **Endpoint:** `POST /team/weekly-status`
- **Format:** `.zip` only
- **Max Size:** 50 MB
- **Storage:** `backend/uploads/weekly-status/`
- **Naming:** `{teamCode}_week{week}_{timestamp}.zip`

### PDF Documents

- **Endpoint:** `POST /team/upload-document/:type`
- **Format:** `.pdf` only
- **Max Size:** 10 MB
- **Storage:** `backend/uploads/{documentType}/`
- **Naming:** `{teamCode}_{documentType}_{timestamp}.pdf`

### Bulk User/Project Imports

- **Endpoint:** `POST /admin/upload/:type`
- **Formats:** `.xlsx`, `.csv`
- **Max Size:** 5 MB
- **Storage:** Temporary (`uploads/`, auto-deleted after processing)

---

## Database Collections

### Users

- **Roles:** `dev`, `admin`, `sub-admin`, `mentor`, `student`
- **Subdocuments:** `studentData`, `mentorData`, `adminData`
- **Indexes:** `username`, `email`, `phone` (unique)

### Teams

- **Structure:** Leader + members (max 3 members + leader = 4 total)
- **References:** `leader`, `members.student`, `mentor.assigned`, `finalProject`
- **Subdocuments:** `projectAbstract`, `roleSpecification`, `evaluation.weeklyStatus`

### Projects (ProjectBank)

- **Fields:** `title`, `description`, `category`, `maxTeams`, `isApproved`
- **TTL:** Rejected projects auto-delete after 2 days (`rejectedAt` field)
- **References:** `proposedBy`, `approvedBy`, `assignedTeams`

---

## Security Features

### Authentication

- JWT tokens stored in HTTP-only cookies
- HTTPS-only cookies in production
- SameSite=Strict for CSRF protection
- Configurable token expiration

### Password Security

- Bcrypt hashing with salt (10 rounds)
- Minimum 6 characters
- Never stored or transmitted in plain text
- Password field excluded from all queries

### File Upload Security

- File type validation (MIME type and extension)
- File size limits enforced
- Unique filenames prevent overwrites
- Files stored outside web root

### Authorization

- Role-based access control (RBAC)
- Middleware chain: `authenticate` → `authorizeRoles` → `handler`
- Team membership validation for team operations
- Mentor assignment validation for mentor operations

---

## Rate Limiting Recommendations

Implement rate limiting on:

- **Login:** 5 attempts per IP per 15 minutes
- **Forgot Password:** 3 requests per email per hour
- **Bulk Uploads:** 5 requests per hour per admin
- **File Uploads:** 20 requests per hour per team

---

## Logging Recommendations

Log the following events:

- All authentication attempts (success/failure)
- Admin operations (user CRUD, approvals, bulk uploads)
- File uploads and downloads
- Document approval/rejection actions
- System flush operations
- Failed authorization attempts

---

## Error Handling

All routes use `asyncHandler` wrapper for automatic error catching.

**Global Error Handler** (`backend/middleware/errorManager.js`):

- Catches all unhandled errors
- Returns consistent error format
- Stack traces only in development mode

**Common Validation Errors:**

- Missing required fields
- Invalid ObjectId format
- Duplicate entries (unique constraint violations)
- File size/format validation
- Role/permission violations

---

## Testing

### Manual Testing Tools

- **Postman Collection:** Import from `backend/test/`
- **Thunder Client:** VS Code extension
- **cURL:** Command-line testing

### Automated Tests

```bash
cd backend
npm run test          # Run all tests
npm run test:ttl      # Test TTL index functionality
```

**Test Coverage:**

- Authentication flows
- User CRUD operations
- Team formation and approval
- Project proposal workflow
- Document upload and approval
- Weekly status submission

---

## API Versioning

**Current Version:** 1.0  
**Base Path:** All routes start with `/` (no version prefix)

**Future Versioning Strategy:**

- New versions: `/v2/auth`, `/v2/admin`, etc.
- Maintain backward compatibility for 1 major version
- Deprecation notices 6 months before removal

---

## Support & Contributions

### Reporting Issues

- Check existing documentation first
- Provide request/response examples
- Include environment details (Node version, OS)

### Documentation Updates

- Keep in sync with code changes
- Update examples with actual response formats
- Add new endpoints to appropriate module file

---

## Changelog

### Version 1.0 (2025-10-28)

- Initial comprehensive API documentation
- Covered all 96 endpoints across 4 modules
- Added workflow examples and security guidelines
- Documented file upload configurations

---

## Related Documentation

- **Frontend API Integration:** See `frontend/src/services/axios.js`
- **Database Models:** See `backend/models/*.js`
- **Middleware:** See `backend/middleware/*.js`
- **Testing Guide:** See `backend/test/README.md`

---

## Quick Start for Developers

1. **Clone Repository:**

   ```bash
   git clone <repo-url>
   cd PAMS/backend
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Server:**

   ```bash
   npm run dev
   ```

5. **Access API:**

   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:5173`

6. **Test API:**
   - Import Postman collection from `backend/test/`
   - Default admin login: `admin@example.com` / `admin123`

---

## License

Refer to repository root for license information.

---

**For detailed endpoint documentation, refer to:**

- [API_AUTHENTICATION.md](./API_AUTHENTICATION.md) - Authentication & Password Management
- [API_ADMIN.md](./API_ADMIN.md) - Administrative Operations
- [API_COMMON.md](./API_COMMON.md) - Shared Student/Mentor Operations
- [API_TEAM.md](./API_TEAM.md) - Team Document & Progress Management
