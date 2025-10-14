# PAMS - Project Allocation and Management System

A comprehensive web application designed to streamline the process of allocating projects to students and managing their academic journey through the complete project lifecycle. Built with modern technologies and robust security features, PAMS provides an end-to-end solution for academic project management.

## 🎯 Overview

PAMS is a full-stack application that revolutionizes project management in academic institutions. The system enables administrators to manage users, upload project banks, oversee allocation processes, and monitor student progress with comprehensive analytics. Mentors can evaluate teams, review documents, score weekly submissions, and provide detailed feedback. Students can form teams, select project preferences, submit various forms and documents, and collaborate on their assigned projects with integrated progress tracking.

## ✨ Key Highlights

- **🔐 Multi-Role Authentication** with JWT-based secure access
- **📊 Dynamic Dashboard System** for all user roles with real-time statistics
- **📝 Comprehensive Document Management** with approval workflows
- **📈 Weekly Progress Tracking** with mentor scoring and feedback
- **🎓 Complete Project Lifecycle Management** from proposal to completion
- **⚙️ Flexible System Configuration** with dynamic document types
- **🔄 Automated Mentor Allocation** based on preferences and capacity
- **📧 Email Notification System** for approvals and rejections
- **🗑️ Granular Data Management** with individual flush operations
- **📱 Responsive Design** optimized for all device sizes

## 🏗️ Architecture & Structure

This repository follows a monorepo architecture with clear separation of concerns:

```plaintext
PAMS/
├── backend/          # Node.js/Express.js API Server
├── frontend/         # React/Vite Client Application
└── README.md         # This file
```

### Backend Architecture

- **RESTful API** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT-based Authentication** with role-based access control
- **Modular Design** with middleware, models, and routes
- **Security Features** including rate limiting, CORS, and input sanitization

### Frontend Architecture

- **React 19** with modern hooks and context API
- **Vite** for fast development and optimized builds
- **React Router** for client-side routing with role-based protection
- **Tailwind CSS 4** for responsive UI design
- **Axios** for API communication

## 🚀 Core Features

### 🔐 Authentication & Security

- **Multi-role Authentication**: Admin, Sub-Admin, Mentor, Student, Developer
- **JWT Token Management**: Secure token handling with httpOnly cookies
- **Role-based Access Control**: Granular permissions for different user types
- **First Login Protection**: Mandatory password change on initial login
- **Password Reset Flow**: Email-based OTP verification and password recovery
- **Session Management**: Automatic token refresh and secure logout

### 👥 User Management

- **Admin Dashboard**: Complete CRUD operations for all user types
- **Bulk User Import**: Excel/CSV file upload for mass user creation with validation
- **Role Management**: Dynamic role changes (Student, Mentor, Sub-Admin promotion/demotion)
- **User Profile Management**: Comprehensive user data with role-specific fields
- **Mentor Capacity Management**: Configurable team assignment limits per mentor
- **Student Team Assignment**: Automatic team reference management

### 📚 Project Management

- **Project Bank**: Centralized repository with category-based organization
- **Project Proposal System**: Student-initiated project proposals
- **Multi-level Approval Workflow**: Admin approval with feedback mechanism
- **Project Allocation**: Automated assignment based on team preferences
- **Dynamic Project Categories**: Customizable project classification (R&D, Consultancy, Startup, Hardware, etc.)
- **Project Availability Tracking**: Real-time monitoring of available project slots
- **TTL Management**: Automatic cleanup of rejected projects after configurable period
- **Project Discussion Scheduling**: Email-based meeting coordination

### 👨‍👩‍👦 Team Operations

- **Team Formation**: Student-initiated team creation with unique 6-character codes
- **Team Joining**: Simple code-based joining with batch/department validation
- **Team Size Management**: Configurable team size limits (leader + up to 3 members)
- **Team Details View**: Comprehensive team information with member profiles
- **Project Preference System**: Multiple project choices with priority ranking
- **Mentor Preference System**: Multi-level mentor selection preferences
- **Team Status Tracking**: Pending, Approved, Rejected with feedback
- **Team Code Management**: Unique code generation and verification

### 🎯 Mentor Assignment System

- **Preference-based Allocation**: Automatic assignment based on mutual preferences
- **Capacity Management**: Respects mentor maximum team limits
- **Team Selection Portal**: Mentor interface for approving/rejecting teams
- **Manual Assignment**: Admin override for direct mentor allocation
- **Assigned Team Dashboard**: Centralized view of all assigned teams
- **Team Progress Monitoring**: Real-time tracking of team submissions

### 📋 Document & Form Management

#### Dynamic Document System
- **Configurable Document Types**: Enable/disable document requirements
- **Required vs Optional**: Flexible document requirements for approval
- **PDF Document Uploads**: Secure file upload with validation
- **Form-based Submissions**: Structured data collection (Project Abstract, Role Specification)
- **Weekly Status Reports**: Recurring submissions with file attachments

#### Document Approval Workflow
- **Two-tier Approval**: Mentor approval followed by Admin approval
- **Document Review Portal**: Dedicated interfaces for mentors and admins
- **Status Tracking**: Draft, Submitted, Mentor Approved, Admin Approved, Rejected
- **Feedback System**: Contextual comments and revision requests
- **Document Download**: Secure file access for authorized users
- **Document Deletion**: Admin ability to request re-uploads

### 📊 Evaluation & Progress Tracking

#### Project Abstract (Form 1)
- **Project Track Selection**: R&D, Consultancy, Startup, Project Pool, Hardware
- **GitHub Repository**: Version control integration
- **Tools & Technologies**: Detailed tech stack documentation
- **Module Breakdown**: Component-wise project structure
- **Multi-level Approval**: Mentor and admin review workflow

#### Role Specification (Form 2)
- **Member Role Assignment**: Define responsibilities for each team member
- **Task Distribution**: Clear role definitions and expectations
- **Approval Workflow**: Mentor and admin validation

#### Weekly Status Updates (Form 3)
- **Timeline-based Tracking**: Automatic week calculation from project start date
- **Module Progress**: Current module being worked on
- **Progress Percentage**: Quantifiable progress tracking
- **Achievements**: Key accomplishments for the week
- **Challenges**: Issues and blockers faced
- **Project File Upload**: Weekly code/document submissions (ZIP files)
- **Mentor Scoring**: 0-10 score with detailed comments
- **Historical View**: Complete submission history with scores

### 📈 Dashboard & Analytics

#### Admin Dashboard
- **System-wide Statistics**: Total users, teams, projects, submissions
- **Document Review Status**: Pending and approved document counts
- **Team Progress Overview**: Status distribution and completion rates
- **User Activity Tracking**: Recent registrations and actions
- **Project Bank Analytics**: Available vs assigned projects
- **Mentor Workload**: Team distribution across mentors

#### Mentor Dashboard
- **Assigned Teams Overview**: Total teams with key metrics
- **Pending Reviews**: Documents awaiting mentor approval
- **Completed Reviews**: Approved submissions tracking
- **Active Projects**: Teams with assigned final projects
- **Team Cards**: Quick access to team details and document review
- **Document Status**: Real-time approval progress per team

#### Student Dashboard
- **Team Status**: Current team membership and approval status
- **Project Information**: Assigned project details
- **Document Submission**: Quick access to all forms
- **Weekly Status**: Current week and submission status
- **Feedback History**: All mentor and admin comments
- **Team Progress**: Overall completion percentage

### 🔧 System Administration

#### Data Management
- **Flush All Data**: Complete system reset preserving admin accounts
- **Granular Flush Operations**: 
  - Flush Students (with cascading team and project cleanup)
  - Flush Mentors (with team assignment updates)
  - Flush Projects (with team reference updates)
  - Flush Teams (with all relationship cleanup)
- **Detailed Operation Reports**: Shows deleted and updated counts
- **Relationship Integrity**: Automatic cascading updates across all entities

#### System Configuration
- **Document Type Management**: Enable/disable document requirements
- **Academic Calendar**: Project timeline configuration
- **Team Size Limits**: Configurable maximum team members
- **Mentor Capacity**: Per-mentor team assignment limits
- **Email Templates**: Customizable notification messages
- **Default Password**: Configurable initial login credentials

#### File Management
- **Secure Upload**: Multer-based file handling
- **File Type Validation**: Restricted to allowed formats
- **Size Limits**: Configurable maximum file sizes
- **Storage Organization**: Categorized file storage structure
- **File Deletion**: Automatic cleanup on document resubmission

### 📧 Email Notification System

- **Project Approval/Rejection**: Automatic notifications to proposers
- **Discussion Scheduling**: Meeting invitations with date/time
- **Password Reset**: OTP-based verification emails
- **Team Status Updates**: Notifications for approval/rejection
- **Form Feedback**: Email alerts for document review comments

## 🔒 Security Architecture

### Authentication Flow

1. **Login**: Username/password validation with bcrypt
2. **Token Generation**: JWT with configurable expiration
3. **Token Storage**: HttpOnly cookies for security
4. **Token Validation**: Middleware-based route protection
5. **Role Authorization**: Permission-based access control

### Role-Based Access Control (RBAC)

```plaintext
Developer (dev)
├── Full system access
├── Debug capabilities
└── Override permissions

Admin (admin)
├── User management (all roles)
├── Project bank management
├── System configuration
├── Team allocation
└── Complete oversight

Sub-Admin (sub-admin)
├── Limited user management
├── Team oversight
├── Project approval
└── Mentor capabilities

Mentor (mentor)
├── Assigned team management
├── Evaluation and feedback
├── Project guidance
└── Progress monitoring

Student (student)
├── Team creation/joining
├── Project selection
├── Form submissions
└── Profile management
```

### Security Middleware Stack

- **Helmet**: Security headers protection
- **CORS**: Cross-origin request handling
- **Rate Limiting**: Brute force attack prevention
- **HPP**: HTTP Parameter Pollution protection
- **Input Sanitization**: NoSQL injection prevention
- **Compression**: Response optimization

## 🛠️ Technologies

### Backend Stack

- **Runtime**: Node.js (Latest LTS)
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (jsonwebtoken)
- **Security**: bcryptjs, helmet, hpp, express-rate-limit
- **File Processing**: multer, xlsx, csv-parse
- **Email**: nodemailer
- **Development**: nodemon, morgan

### Frontend Stack

- **Framework**: React 19.x with Hooks and Context API
- **Build Tool**: Vite 6.x for lightning-fast development
- **Routing**: React Router DOM 7.x with role-based protection
- **Styling**: Tailwind CSS 4.x with custom components
- **HTTP Client**: Axios with interceptors for auth
- **Icons**: React Icons (Font Awesome, Lucide)
- **Animations**: Smooth transitions and interactions
- **State Management**: React Context API for global state
- **Form Handling**: React Select for enhanced dropdowns
- **Date Handling**: Date-fns for date operations
- **File Upload**: Custom file upload components

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB 6.0+ (local or cloud instance)
- Git

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/bhavyajain-prog/PAMS.git
   cd PAMS
   ```

2. **Backend Setup:**

   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure environment variables
   npm run dev           # Start development server
   ```

3. **Frontend Setup:**

   ```bash
   cd ../frontend
   npm install
   cp .env.example .env  # Configure environment variables
   npm run dev           # Start development server
   ```

4. **Access the Application:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

### Environment Configuration

See individual README files in `backend/` and `frontend/` directories for detailed environment variable configuration.

## 📁 Project Structure Details

### Backend Structure

```plaintext
backend/
├── config/           # Database and configuration
├── middleware/       # Authentication, authorization, error handling
├── models/           # MongoDB schemas (User, Team, ProjectBank, SystemSettings)
├── routes/           # API endpoints (auth, admin, common, team)
├── uploads/          # File storage directory
├── index.js          # Application entry point
└── package.json      # Dependencies and scripts
```

### Frontend Structure

```plaintext
frontend/
├── src/
│   ├── components/   # Shared UI components
│   ├── contexts/     # React Context providers
│   ├── features/     # Feature-based modules
│   │   ├── admin/    # Admin portal components
│   │   ├── auth/     # Authentication components
│   │   ├── forms/    # Evaluation forms
│   │   ├── mentor/   # Mentor portal components
│   │   └── student/  # Student portal components
│   ├── pages/        # Top-level page components
│   ├── routing/      # Route protection and configuration
│   ├── services/     # API communication
│   ├── App.jsx       # Main application component
│   └── main.jsx      # Application entry point
├── public/           # Static assets
├── index.html        # HTML template
├── vite.config.js    # Vite configuration
└── package.json      # Dependencies and scripts
```

## 🔧 Development Guidelines

### Code Organization

- **Feature-based structure** for scalability
- **Separation of concerns** across layers
- **Reusable components** and utilities
- **Consistent naming conventions**

### Security Best Practices

- **Input validation** on both client and server
- **SQL/NoSQL injection prevention**
- **XSS protection** with proper sanitization
- **CSRF protection** with SameSite cookies
- **Rate limiting** for API endpoints

### API Design

- **RESTful endpoints** with proper HTTP methods
- **Consistent response formats**
- **Error handling** with meaningful messages
- **API versioning** for future compatibility

## 🚀 Deployment

The application is production-ready with:

- **Environment-based configuration**
- **Production optimizations**
- **Security hardening**
- **Graceful shutdown handling**
- **Error logging and monitoring**

## 📈 Future Enhancements

This codebase is designed to be extensible and can support additional modules such as:

- **Advanced Analytics Dashboard** with data visualization
- **Real-time Notifications System** using WebSockets
- **Document Version Control** with diff tracking
- **Plagiarism Detection** for project submissions
- **Integration APIs** for external tools (GitHub, Jira, etc.)
- **Mobile Application** for on-the-go access
- **Automated Testing Suite** with E2E tests
- **AI-powered Project Recommendations** based on student skills
- **Peer Review System** for team evaluations
- **Export Reports** in PDF/Excel formats

## 👨‍💻 User Roles & Capabilities

### Developer Role
- Full system access and override capabilities
- Debug mode with extended logging
- System maintenance and diagnostics
- Database direct access

### Admin Role
- Complete user management (create, read, update, delete)
- Project bank management and approval
- Team allocation and mentor assignment
- System configuration and settings
- Data flush operations with integrity management
- Document review and approval (final approval)
- Email notification management
- Analytics and reporting access

### Sub-Admin Role
- Limited user management capabilities
- Team oversight and approval
- Project approval workflow
- All mentor capabilities
- Document review (mentor-level approval)

### Mentor Role
- View assigned teams dashboard
- Review and approve team documents
- Score weekly status submissions
- Provide feedback and comments
- Approve/reject teams during selection phase
- Download team submissions
- Track team progress

### Student Role
- Create or join teams using unique codes
- Submit project proposals
- Select project and mentor preferences
- Fill and submit evaluation forms
- Upload weekly status reports
- View feedback from mentors and admins
- Track team progress and status

## 🔄 Workflow Overview

### Project Allocation Flow
1. **Students form teams** → Unique code generation
2. **Teams select project preferences** → Rank top choices
3. **Teams select mentor preferences** → Multiple mentor choices
4. **Admin reviews and approves teams** → Feedback system
5. **Mentors approve/reject teams** → Preference-based
6. **Admin allocates mentors and final projects** → Manual or automatic
7. **Project timeline begins** → Weekly tracking starts

### Document Approval Flow
1. **Student submits form/document** → Status: Submitted
2. **Mentor reviews** → Approve/Reject with comments
3. **If approved by mentor** → Status: Mentor Approved
4. **Admin reviews** → Final approval/rejection
5. **If approved by admin** → Status: Admin Approved
6. **If rejected** → Status: Rejected (resubmission required)

### Weekly Status Flow
1. **System calculates current week** → Based on project start date
2. **Team submits weekly report** → With ZIP file attachment
3. **Mentor reviews and scores** → 0-10 points + comments
4. **Status tracked in evaluation** → Historical record maintained
5. **Progress monitored** → Real-time dashboard updates

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-based Authorization**: Middleware-level protection
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Type and size restrictions
- **SQL/NoSQL Injection Prevention**: Mongoose query sanitization
- **XSS Protection**: Input sanitization and output encoding
- **CORS Configuration**: Controlled cross-origin access
- **Rate Limiting**: Brute force attack prevention
- **Secure Headers**: Helmet middleware for HTTP headers
- **Session Management**: Automatic token expiration and refresh

## 📊 Database Schema

### User Model
- Basic info (name, email, username, phone, password)
- Role-specific data (studentData, mentorData, adminData)
- Authentication tokens and reset codes
- Timestamps and versioning

### Team Model
- Team code, leader, and members
- Project choices and final project
- Mentor preferences and assignment
- Status and feedback history
- Document submissions (abstract, role specification, PDFs)
- Weekly status evaluations
- Project timeline configuration

### Project Bank Model
- Project details (title, description, category)
- Proposer and approver information
- Approval status and feedback
- Assigned teams tracking
- Max teams and availability
- TTL for rejected projects

### System Settings Model
- Academic calendar configuration
- Document type management
- System-wide settings
- Feature toggles

## 🤝 Contributing

Please refer to individual component README files for detailed contribution guidelines and development setup instructions.

## 📄 License

This project is proprietary and confidential. All rights reserved.
