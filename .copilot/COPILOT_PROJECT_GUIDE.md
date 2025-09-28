# PAMS - Project Allocation and Management System

## Copilot Project Context & Architecture Documentation

**Last Updated**: 28 September 2025  
**Project Version**: Backend v2.2.0, Frontend v2.2  
**Repository**: PAMS - Academic Project Management System

## 📋 PROJECT OVERVIEW

PAMS is a full-stack web application designed for academic institutions to manage student project allocation and evaluation. It's built with **Node.js/Express.js** backend and **React 19/Vite** frontend, using **MongoDB** for data persistence and **JWT** for authentication.

### 🎯 Core Purpose

- **Students**: Form teams, select project preferences, submit evaluation forms
- **Mentors**: Guide teams, provide feedback, evaluate progress
- **Admins**: Manage users, approve projects, oversee allocation process
- **System**: Automate project allocation, track progress, manage workflows

## 🏗️ ARCHITECTURE OVERVIEW

### **Monorepo Structure**

```plaintext
PAMS-original/
├── backend/          # Node.js/Express.js API Server
├── frontend/         # React 19/Vite Client Application
└── README.md         # Main project documentation
```

### **Technology Stack**

**Backend Stack:**

- **Runtime**: Node.js (Latest LTS)
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) with httpOnly cookies
- **Security**: bcryptjs, helmet, hpp, express-rate-limit, CORS
- **File Processing**: multer, xlsx, csv-parse
- **Email**: nodemailer
- **Development**: nodemon, morgan

**Frontend Stack:**

- **Framework**: React 19.x with hooks and Context API
- **Build Tool**: Vite 6.x (fast dev server & optimized builds)
- **Routing**: React Router DOM 7.x with role-based protection
- **Styling**: Tailwind CSS 4.x (utility-first CSS)
- **HTTP Client**: Axios with custom instance
- **Icons**: React Icons, Lucide React
- **Animations**: Framer Motion
- **State Management**: React Context API (AuthContext)
- **Form Handling**: React Select for enhanced dropdowns

## 🔐 AUTHENTICATION & AUTHORIZATION

### **Authentication Flow**

1. **Login**: Username/email + password validation with bcrypt
2. **Token Generation**: JWT with configurable expiration (1d default, 7d with remember)
3. **Token Storage**: HttpOnly cookies for security (not accessible via JS)
4. **Token Validation**: Middleware-based route protection
5. **Role Authorization**: Granular permission-based access control

### **User Roles & Permissions**

```plaintext
Developer (dev)
├── Full system access
├── Debug capabilities
└── Override all permissions

Admin (admin)
├── Complete user management (all roles)
├── Project bank management & approval
├── System configuration & settings
├── Team allocation & mentor assignment
└── Complete oversight & analytics

Sub-Admin (sub-admin)
├── Limited user management
├── Team oversight & approval
├── Project approval capabilities
└── Mentor-level capabilities

Mentor (mentor)
├── Assigned team management
├── Form evaluation & feedback
├── Project guidance & scoring
└── Progress monitoring

Student (student)
├── Team creation/joining
├── Project preference selection
├── Form submissions (3 evaluation forms)
└── Profile management
```

### **Route Protection Implementation**

- **Frontend**: `RoleBasedRoute.jsx` wrapper component
- **Backend**: `authenticate.js` + `authorizeRoles.js` middleware
- **Security**: Automatic redirects, loading states, server-synchronized permissions

## 📊 DATABASE MODELS & RELATIONSHIPS

### **User Model (`models/User.js`)**

**Core Fields**: `name`, `username`, `email`, `password`, `phone`, `role`, `firstLogin`

**Role-Specific Data Schemas:**

- **Student Data**: `rollNumber`, `batch`, `department`, `currentTeam`
- **Mentor Data**: `empNo`, `department`, `designation`, `qualifications`, `assignedTeams`, `maxTeams`
- **Admin Data**: `empNo`, `department`, `permissions`, `isSubAdmin`

### **Team Model (`models/Team.js`)**

**Core Fields**:

- `code` (6-char unique identifier)
- `leader` (User reference)
- `members` (Array of User references with timestamps)
- `batch`, `department`

**Project Management**:

- `projectChoices` (Array of ProjectBank references)
- `finalProject` (Single ProjectBank reference)
- `mentor.assigned` (User reference)
- `mentor.preferences` (Array of preferred mentors)

**Evaluation System**:

- `projectAbstract` (Form 1 - project details, tools, modules)
- `roleSpecification` (Form 2 - member responsibilities, activities)
- `evaluation.weeklyStatus` (Form 3 - weekly progress reports)

**Status Management**: `pending`, `approved`, `rejected` with feedback system

### **ProjectBank Model (`models/ProjectBank.js`)**

- `title`, `description`, `category`
- `isApproved`, `approvedBy`, `proposedBy`
- `maxTeams`, `assignedTeams`
- `feedback` array with approval workflow
- `rejectedAt` for soft deletion

### **SystemSettings Model (`models/SystemSettings.js`)**

- `projectTimeline` (global dates, auto-assignment)
- `academicCalendar` (semester info, dates)
- Configurable system-wide settings

## 🔄 API ARCHITECTURE & ROUTES

### **Route Structure**

```plaintext
/auth         # Authentication endpoints
├── POST /login         # User authentication
├── GET  /me           # Get current user data
├── POST /register     # User registration
├── POST /forgot-password  # Password recovery
└── POST /reset-password   # Password reset

/admin        # Admin-only endpoints
├── GET  /students     # Manage student accounts
├── GET  /mentors      # Manage mentor accounts
├── GET  /teams        # Team oversight & approval
├── GET  /projects     # Project management
├── POST /allocate/:team_id/:mentor_id  # Manual allocation
└── POST /upload       # Bulk data import (Excel/CSV)

/common       # Multi-role endpoints
├── GET  /project-bank    # Available projects
├── POST /create-team     # Team formation (students)
├── POST /join-team       # Team joining (students)
├── GET  /teams           # Team listings (mentors)
└── POST /propose-project # Project proposals

/team         # Team-specific operations
├── GET  /my-team         # Team dashboard
├── POST /submit-form     # Form submissions
├── GET  /forms-for-approval  # Pending evaluations
└── POST /approve-form    # Form approval workflow
```

### **Security Middleware Stack**

- **Helmet**: Security headers protection
- **CORS**: Cross-origin request handling with allowlist
- **Rate Limiting**: Brute force attack prevention (100 req/15min)
- **HPP**: HTTP Parameter Pollution protection
- **Input Sanitization**: NoSQL injection prevention
- **Compression**: Response optimization

## 🎨 FRONTEND ARCHITECTURE

### **Feature-Based Structure**

```plaintext
frontend/src/
├── components/       # Shared UI components
│   ├── Header.jsx    # Navigation with role-based menu
│   ├── Footer.jsx    # Application footer
│   ├── Loading.jsx   # Consistent loading states
│   └── Redirect.jsx  # Role-based navigation helper

├── contexts/         # Global state management
│   └── AuthContext.jsx  # User authentication state

├── features/         # Feature-based modules
│   ├── admin/        # Admin portal & management
│   ├── auth/         # Login, register, password reset
│   ├── forms/        # 3 evaluation forms system
│   ├── mentor/       # Mentor dashboard & team selection
│   └── student/      # Student portal & team management

├── pages/            # Top-level pages
├── routing/          # Route protection logic
├── services/         # API communication (axios)
└── App.jsx           # Main router & layout
```

### **Key Frontend Features**

- **Responsive Design**: Tailwind CSS with mobile-first approach
- **Role-Based Navigation**: Dynamic menu based on user permissions
- **Form Management**: Multi-step evaluation forms with validation
- **Real-Time Updates**: Live status tracking and notifications
- **File Uploads**: Document submission capabilities
- **Search & Filtering**: Dynamic data filtering across components

## 📝 EVALUATION SYSTEM WORKFLOW

### **Three-Form Evaluation Process**

1. **Project Abstract (Form 1)**

   - Project track selection (R&D, Consultancy, Startup, etc.)
   - GitHub repository, tools, modules definition
   - **Status Flow**: `draft` → `submitted` → `mentor_approved` → `admin_approved`

2. **Role Specification (Form 2)**

   - Member role assignments and responsibilities
   - Module-wise activity breakdown
   - **Status Flow**: `draft` → `submitted` → `mentor_approved` → `admin_approved`

3. **Weekly Status Matrix (Form 3)**
   - Weekly progress reports and file uploads
   - Mentor scoring and feedback
   - **Status Flow**: `draft` → `submitted` → `mentor_approved`

### **Approval Workflow**

- **Students**: Submit forms through portal
- **Mentors**: Review, provide feedback, approve/reject
- **Admins**: Final approval authority, system oversight
- **Notifications**: Email alerts for status changes

## � DOCUMENT REVIEW SYSTEM (NEW)

### **Overview**

The Document Review System provides administrators with a comprehensive dashboard to monitor and track all team document submissions and their approval statuses across the entire system.

### **Key Features**

- **Real-time Document Tracking**: Monitor submission and approval status of all team documents
- **Dynamic Document Types**: Configurable document system that can be easily extended
- **Advanced Filtering**: Search by team code, member names, batch, department, and completion status
- **Statistics Dashboard**: Overview of submission rates, approval progress, and pending reviews
- **Responsive Design**: Mobile-friendly interface with expandable team information cards

### **Document Types Configuration**

**Location**: `backend/config/documentTypes.js`

The system uses a dynamic configuration approach for managing document types:

```javascript
const DOCUMENT_TYPES_CONFIG = [
  {
    key: "projectAbstract",
    name: "Project Abstract (Form 1)",
    description: "Project details, tools, and modules specification",
    enabled: true,
    requiredForApproval: true,
    adminApprovalRequired: true,
    mentorApprovalRequired: true,
    formPath: "/project-abstract",
    category: "form",
    order: 1,
  },
  // Additional document types can be added here
];
```

**Configuration Properties**:

- `key`: Unique identifier for the document type
- `name`: Display name shown in the UI
- `description`: Brief description of the document purpose
- `enabled`: Whether this document type is active in the system
- `requiredForApproval`: Whether this document is required for team completion
- `adminApprovalRequired`: Whether admin approval is needed
- `mentorApprovalRequired`: Whether mentor approval is needed
- `formPath`: Route to the form submission page
- `category`: Document category for grouping
- `order`: Display order in the UI

### **API Endpoints**

- **GET** `/admin/document-review-status`: Fetch all teams with document status
- **Response Structure**:
  - `teams`: Array of teams with document information
  - `documentTypes`: Currently enabled document types
  - `statistics`: Overall system statistics
  - `configuration`: System configuration metadata

### **Frontend Component**

**Location**: `frontend/src/features/admin/components/ReviewDocs.jsx`
**Route**: `/admin/doc-upload-status`

**Features**:

- **Statistics Cards**: Total teams, teams with documents, fully approved teams, pending reviews
- **Document Type Statistics**: Breakdown by form type with approval counts
- **Team Search**: Real-time search across team codes, member names, and emails
- **Multi-filter System**: Filter by team status, document completion, batch, and department
- **Expandable Team Cards**: Detailed team information with document status breakdown
- **Status Badges**: Visual indicators for document approval states

**Usage in AdminPortal**:
The ReviewDocs component is accessible through the Admin Portal with a dedicated action card linking to the document review dashboard.

### **Adding New Document Types**

1. **Add Configuration**: Add new document type to `backend/config/documentTypes.js`
2. **Update Backend Logic**: Add handling in the document review API route
3. **Create Form Component**: Add new form component in `frontend/src/features/forms/`
4. **Add Route**: Add route in `App.jsx` for the new form
5. **Update Team Model**: Add new fields to Team schema if needed

**Example - Adding Final Presentation**:

```javascript
// In documentTypes.js
{
  key: "finalPresentation",
  name: "Final Presentation",
  description: "Final project presentation slides and demo video",
  enabled: true,
  requiredForApproval: true,
  adminApprovalRequired: true,
  mentorApprovalRequired: true,
  formPath: "/final-presentation",
  category: "presentation",
  order: 4
}
```

## �🚀 TEAM FORMATION & PROJECT ALLOCATION

### **Team Creation Process**

1. **Student Initiative**: Create team with unique 6-character code
2. **Member Joining**: Other students join using team code (max 3 members)
3. **Project Selection**: Choose 1-2 preferred projects from project bank
4. **Mentor Preferences**: Select 3 preferred mentors in order
5. **Admin Approval**: Team composition and project allocation approval
6. **Mentor Assignment**: Manual or preference-based mentor allocation

### **Project Bank Management**

- **Project Proposals**: Students can propose custom projects
- **Admin Curation**: Project approval and categorization
- **Availability Tracking**: Max teams per project enforcement
- **Category System**: Organized project classification

## 🛠️ DEVELOPMENT GUIDELINES

### **Code Organization Principles**

- **Feature-Based Structure**: Modules organized by business functionality
- **Separation of Concerns**: Clear layer separation (routes, models, middleware)
- **Reusable Components**: Shared UI elements and utilities
- **Consistent Naming**: Clear, descriptive naming conventions
- **Error Handling**: Comprehensive error management with meaningful messages

### **Security Best Practices**

- **Input Validation**: Both client-side and server-side validation
- **Injection Prevention**: NoSQL injection protection
- **XSS Protection**: Proper output sanitization
- **CSRF Protection**: SameSite cookies implementation
- **Rate Limiting**: API endpoint protection
- **Environment Variables**: Sensitive data protection

### **Performance Optimizations**

- **Database Indexing**: Optimized queries with proper indexes
- **Response Compression**: Gzip compression middleware
- **Lazy Loading**: Code splitting and route-based loading
- **Caching**: Strategic caching implementation
- **Bundle Optimization**: Vite production optimizations

## 🔧 DEVELOPMENT SETUP

### **Environment Requirements**

- Node.js 18+ and npm/yarn
- MongoDB 6.0+ (local or cloud instance)
- Git for version control

### **Key Environment Variables**

```bash
# Backend (.env)
MONGO_URI=mongodb://localhost:27017/pams
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=1d
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@pams.edu
ADMIN_PASS=secure_admin_password
DEFAULT_PASS=default123

# Frontend (.env)
VITE_API_URL=http://localhost:5000
```

### **Development Commands**

```bash
# Backend
cd backend
npm install
npm run dev     # nodemon for hot reload

# Frontend
cd frontend
npm install
npm run dev     # Vite dev server
npm run build   # Production build
```

## 📈 COMMON DEVELOPMENT SCENARIOS

### **Adding New User Role**

1. Update `User` model with role-specific schema
2. Modify `authorizeRoles` middleware
3. Add route protection in `RoleBasedRoute.jsx`
4. Update navigation in `Header.jsx`
5. Create role-specific portal component

### **Creating New API Endpoint**

1. Add route in appropriate router (`admin.js`, `common.js`, etc.)
2. Implement middleware stack (`authenticate`, `authorizeRoles`)
3. Add input validation and error handling
4. Update frontend service calls
5. Handle UI state updates

### **Adding New Form/Evaluation**

1. Extend `Team` model with form schema
2. Create form component in `features/forms/`
3. Add API endpoints for form CRUD operations
4. Implement approval workflow logic
5. Update status tracking system

### **Database Operations**

- **User Management**: Create, update, delete users with role validation
- **Team Operations**: Formation, member management, mentor assignment
- **Project Allocation**: Manual assignment, preference-based allocation
- **System Maintenance**: Bulk operations, data cleanup, analytics

## 🚨 COMMON ISSUES & SOLUTIONS

### **Authentication Issues**

- **Cookie Problems**: Check `httpOnly`, `secure`, `sameSite` settings
- **Token Expiration**: Verify JWT expiration handling
- **CORS Issues**: Ensure proper CORS configuration with credentials

### **Database Connection**

- **MongoDB Atlas**: Check IP whitelist and connection string
- **Local MongoDB**: Ensure service is running
- **Mongoose Validation**: Check schema validation rules

### **File Upload Issues**

- **Multer Configuration**: Verify upload directory permissions
- **File Size Limits**: Check both frontend and backend limits
- **MIME Type Validation**: Ensure proper file type checking

## 📚 ADDITIONAL RESOURCES

### **Key Dependencies to Know**

- **Backend**: `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `multer`
- **Frontend**: `react`, `react-router-dom`, `axios`, `tailwindcss`

### **Important Middleware Order**

1. Security headers (helmet)
2. CORS configuration
3. Rate limiting
4. Body parsing
5. Cookie parsing
6. Input sanitization
7. Routes
8. Error handling

### **VS Code Extensions Recommended**

- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- MongoDB for VS Code
- Thunder Client (API testing)
- GitLens

---

**Note for Future Copilot Sessions**: This documentation provides comprehensive context about the PAMS project architecture, data models, API structure, and development patterns. Use this as a reference for understanding the codebase and making informed decisions about code changes, feature additions, and debugging.
