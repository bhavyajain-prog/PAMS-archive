# PAMS Backend

The server-side implementation of the Project Allocation and Management System (PAMS). This Node.js/Express.js application provides a robust API with comprehensive security features, role-based access control, and efficient data management.

## 🏗️ Architecture Overview

The backend follows a layered architecture pattern with clear separation of concerns:

```
backend/
├── config/           # Configuration files and database setup
├── middleware/       # Custom middleware for authentication, authorization, and security
├── models/           # MongoDB schemas and data models
├── routes/           # API route definitions and handlers
├── uploads/          # File storage directory
├── index.js          # Application entry point and server setup
└── package.json      # Dependencies and scripts
```

## 📊 Data Models

### User Model (`models/User.js`)

Comprehensive user management with role-specific data schemas:

**Core Fields:**

- `name`, `username`, `email`, `password`, `phone`
- `role`: "student" | "admin" | "mentor" | "sub-admin" | "dev"
- `firstLogin`: Boolean flag for password reset requirement

**Role-Specific Data:**

- **Student Data**: `rollNumber`, `batch`, `department`, `currentTeam`
- **Mentor Data**: `empNo`, `department`, `designation`, `qualifications`, `assignedTeams`, `maxTeams`
- **Admin Data**: `empNo`, `department`, `permissions`, `isSubAdmin`

**Features:**

- Dynamic virtual fields based on user role
- Comprehensive validation rules
- Indexed fields for performance optimization
- Pre-validation hooks for data integrity

### Team Model (`models/Team.js`)

Team management with project allocation and mentor assignment:

**Core Fields:**

- `code`: Unique 6-character alphanumeric identifier
- `leader`: Reference to team leader (User)
- `members`: Array of student references with join timestamps
- `batch`, `department`: Academic classification

**Project Management:**

- `projectChoices`: Array of preferred projects
- `finalProject`: Assigned project reference
- `mentor`: Nested object with assigned mentor and preferences

**Evaluation System:**

- Form submission tracking (Abstract, Role Specification, Weekly Status)
- Status management and feedback collection
- Approval workflow support

### Project Bank Model (`models/ProjectBank.js`)

Project repository with approval workflow:

**Core Fields:**

- `title`, `description`, `category`
- `isApproved`: Boolean approval status
- `approvedBy`, `proposedBy`: User references
- `maxTeams`: Maximum team assignments

**Management Features:**

- `assignedTeams`: Array of team references
- `feedback`: Array of feedback objects with timestamps
- TTL index for automatic cleanup of rejected projects
- Virtual fields for availability calculation

### System Settings Model (`models/SystemSettings.js`)

Global configuration management:

**Features:**

- Academic calendar management
- Project timeline configuration
- System-wide settings and preferences
- Administrative control timestamps

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
