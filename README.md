# PAMS - Project Allocation and Management System

A comprehensive web application designed to streamline the process of allocating projects to students and managing their academic journey. Built with modern technologies and robust security features, PAMS caters to multiple user roles in an academic environment.

## 🎯 Overview

PAMS is a full-stack application that facilitates project management in academic institutions. The system enables administrators to manage users, upload project banks, oversee allocation processes, and monitor student progress. Mentors can evaluate teams and track project milestones, while students can form teams, select project preferences, and collaborate on their assigned projects.

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

### Authentication & Security

- **Multi-role Authentication**: Admin, Sub-Admin, Mentor, Student, Developer
- **JWT Token Management**: Secure token handling with httpOnly cookies
- **Role-based Access Control**: Granular permissions for different user types
- **First Login Protection**: Mandatory password change on initial login
- **Password Reset**: Email-based password recovery system

### User Management

- **Admin Controls**: Complete CRUD operations for all user types
- **Role Promotion/Demotion**: Dynamic role changes (Mentor ↔ Sub-Admin)
- **Bulk User Import**: Excel/CSV file upload for mass user creation
- **User Profile Management**: Comprehensive user data with role-specific fields

### Project Management

- **Project Bank**: Centralized repository of available projects
- **Project Approval Workflow**: Admin approval process for proposed projects
- **Project Allocation**: Automated and manual assignment to teams
- **Project Categories**: Organized project classification system

### Team Operations

- **Team Formation**: Student-initiated team creation with unique codes
- **Team Joining**: Simple code-based team joining mechanism
- **Team Management**: Leader-based team administration
- **Mentor Assignment**: Automatic and manual mentor allocation

### Evaluation System

- **Multi-form Evaluation**: Project Abstract, Role Specification, Weekly Status
- **Mentor Reviews**: Comprehensive feedback and grading system
- **Progress Tracking**: Real-time monitoring of team progress
- **Form Approval Workflow**: Structured review and approval process

### System Administration

- **System Settings**: Configurable academic calendar and project timelines
- **Data Management**: Bulk operations and system maintenance tools
- **Analytics Dashboard**: Comprehensive system overview and statistics
- **File Management**: Secure file upload and storage system

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

- **Framework**: React 19.x
- **Build Tool**: Vite 6.x
- **Routing**: React Router DOM 7.x
- **Styling**: Tailwind CSS 4.x
- **HTTP Client**: Axios
- **Icons**: React Icons
- **Animations**: Framer Motion
- **State Management**: React Context API
- **Form Handling**: React Select

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

- **Advanced Analytics Dashboard**
- **Real-time Notifications System**
- **Document Management System**
- **Integration APIs**
- **Mobile Application**
- **Automated Testing Suite**

## 🤝 Contributing

Please refer to individual component README files for detailed contribution guidelines and development setup instructions.

## 📄 License

This project is proprietary and confidential. All rights reserved.
