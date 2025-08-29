# PAMS Security Architecture & Role-Based Access Control

This document provides a comprehensive overview of the security implementation and role-based access control (RBAC) system in the Project Allocation and Management System (PAMS).

## 🔐 Security Overview

PAMS implements a multi-layered security architecture with defense-in-depth principles:

### Security Layers

1. **Network Security**: CORS, Rate Limiting, HTTPS enforcement
2. **Authentication**: JWT-based token system with secure storage
3. **Authorization**: Role-based access control with granular permissions
4. **Input Validation**: Server-side validation and sanitization
5. **Data Protection**: Password hashing, secure session management

## 🎭 Role-Based Access Control (RBAC)

### User Roles Hierarchy

```
Developer (dev) - System Override
    ↓
Admin (admin) - Full System Control
    ↓
Sub-Admin (sub-admin) - Limited Administrative Access
    ↓
Mentor (mentor) - Team Guidance and Evaluation
    ↓
Student (student) - Basic User Access
```

### Role Definitions

#### 1. Developer (`dev`)

**Purpose**: System development and debugging access
**Capabilities**:

- Override all permission restrictions
- Access to development portals and debug tools
- Full system access regardless of other restrictions
- System maintenance and troubleshooting

**Security Note**: This role should only exist in development environments

#### 2. Administrator (`admin`)

**Purpose**: Complete system administration and oversight
**Data Schema**: `adminData`

- `empNo`: Employee number
- `department`: Administrative department
- `permissions`: Array of specific permissions
- `isSubAdmin`: false (distinguishes from sub-admin)

**Capabilities**:

- **User Management**: Create, update, delete all user types
- **Role Management**: Promote/demote mentors to sub-admins
- **System Configuration**: Modify system settings and parameters
- **Project Bank**: Full project management (add, approve, remove)
- **Team Allocation**: Assign mentors and projects to teams
- **Data Management**: Bulk import/export operations
- **System Analytics**: Access to all reports and statistics
- **Form Approval**: Override mentor decisions on evaluations

#### 3. Sub-Administrator (`sub-admin`)

**Purpose**: Limited administrative assistance
**Data Schema**: `mentorData` + `adminData`

- Inherits mentor capabilities
- `adminData.isSubAdmin`: true
- Limited `permissions` array

**Capabilities**:

- **Limited User Management**: Cannot modify admin accounts
- **Team Oversight**: Monitor and manage team operations
- **Project Management**: Approve student-proposed projects
- **Mentor Functions**: All mentor capabilities included
- **Regional/Department Scope**: Often limited to specific departments

**Restrictions**:

- Cannot create or modify admin accounts
- Cannot access sensitive system configurations
- Cannot perform bulk system operations

#### 4. Mentor (`mentor`)

**Purpose**: Team guidance and project evaluation
**Data Schema**: `mentorData`

- `empNo`: Employee number
- `department`: Academic department
- `designation`: Job title/position
- `qualifications`: Array of qualifications
- `assignedTeams`: Array of team IDs
- `maxTeams`: Maximum assignable teams (default: 3)

**Capabilities**:

- **Team Management**: View and guide assigned teams
- **Evaluation System**: Review and approve student submissions
- **Project Guidance**: Provide feedback and direction
- **Form Review**: Approve project abstracts, role specifications
- **Progress Monitoring**: Track team progress and milestones
- **Team Approval**: Accept or reject team mentor assignments

**Restrictions**:

- Limited to assigned teams only
- Cannot modify user accounts
- Cannot access system administration features

#### 5. Student (`student`)

**Purpose**: Project participation and team collaboration
**Data Schema**: `studentData`

- `rollNumber`: Unique student identifier (format: ##[A-Z]{5}###)
- `batch`: Academic batch/year
- `department`: Academic department
- `currentTeam`: Reference to current team (optional)

**Capabilities**:

- **Team Operations**: Create teams, join teams via codes
- **Project Selection**: Select project preferences
- **Form Submission**: Submit evaluation forms and progress reports
- **Profile Management**: Update personal information
- **Team Collaboration**: Communicate with team members
- **Project Proposal**: Propose custom projects for approval

**Restrictions**:

- Cannot access other users' data
- Cannot modify team assignments (except joining/leaving)
- Cannot approve forms or projects
- Limited to own academic data

## 🛡️ Authentication System

### JWT Implementation

**Token Structure**:

```javascript
{
  _id: "user_mongodb_id",
  role: "user_role",
  iat: "issued_at_timestamp",
  exp: "expiration_timestamp"
}
```

**Token Security Features**:

- **Secure Storage**: HttpOnly cookies (not accessible via JavaScript)
- **SameSite**: Strict setting prevents CSRF attacks
- **Secure Flag**: HTTPS-only transmission in production
- **Expiration**: Configurable expiration time (default: 7 days)
- **Refresh Strategy**: Re-authentication required on expiration

### Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database

    C->>S: POST /auth/login (username, password)
    S->>DB: Find user by username
    DB->>S: User data
    S->>S: Verify password (bcrypt)
    S->>S: Generate JWT token
    S->>C: Set HttpOnly cookie + user data

    Note over C,S: Subsequent requests
    C->>S: API request with cookie
    S->>S: Verify JWT token
    S->>DB: Validate user exists
    DB->>S: User data
    S->>C: Authorized response
```

### Password Security

**Hashing Strategy**:

- **Algorithm**: bcrypt with salt rounds (10)
- **Salt Generation**: Unique salt per password
- **Hash Verification**: Secure comparison during login

**Password Policies**:

- **First Login**: Mandatory password change
- **Reset Mechanism**: Email-based secure password reset
- **Validation**: Server-side password strength validation

## 🔒 Authorization Middleware

### Route Protection Implementation

```javascript
// Authentication Middleware
const authenticate = async (req, res, next) => {
  // 1. Extract token from cookie or Authorization header
  // 2. Verify JWT signature and expiration
  // 3. Validate user exists in database
  // 4. Attach user object to request
  // 5. Continue to next middleware or return error
};

// Authorization Middleware
const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    // 1. Check if user role is in allowed roles
    // 2. Allow access or return 403 Forbidden
  };
```

### Route Access Matrix

| Endpoint                 | Student | Mentor | Sub-Admin | Admin | Dev |
| ------------------------ | ------- | ------ | --------- | ----- | --- |
| `/auth/*`                | ✅      | ✅     | ✅        | ✅    | ✅  |
| `/common/projects`       | ✅      | ✅     | ✅        | ✅    | ✅  |
| `/team/create`           | ✅      | ❌     | ❌        | ❌    | ✅  |
| `/team/join`             | ✅      | ❌     | ❌        | ❌    | ✅  |
| `/common/approve-team`   | ❌      | ✅     | ✅        | ✅    | ✅  |
| `/admin/users`           | ❌      | ❌     | ✅        | ✅    | ✅  |
| `/admin/system-settings` | ❌      | ❌     | ❌        | ✅    | ✅  |

## 🛠️ Security Middleware Stack

### 1. Helmet - Security Headers

```javascript
app.use(
  helmet({
    contentSecurityPolicy: false, // Configured separately
    crossOriginEmbedderPolicy: false,
  })
);
```

**Protection Against**:

- XSS attacks via security headers
- Clickjacking via X-Frame-Options
- MIME type sniffing
- DNS prefetch control

### 2. CORS - Cross-Origin Requests

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    // Production: Strict allowlist
    // Development: Permissive for development ease
  },
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};
```

### 3. Rate Limiting

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Protection Against**:

- Brute force attacks
- API abuse
- DDoS attempts

### 4. Input Sanitization

```javascript
const sanitizeNoSQL = (obj) => {
  // Remove $ and . characters to prevent NoSQL injection
  // Applied to req.body, req.params, req.query
};
```

**Protection Against**:

- NoSQL injection attacks
- Parameter pollution
- Malicious input data

### 5. HPP - HTTP Parameter Pollution

```javascript
app.use(hpp()); // Prevents parameter pollution attacks
```

## 🔍 Frontend Security

### Route Protection Component

```javascript
function RoleBasedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role) && user.role !== "dev") {
    return <Navigate to="/notfound" />;
  }

  return children;
}
```

### Context Security

```javascript
const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Automatic authentication verification
  // Role-based navigation
  // Secure token management
  // User state synchronization
}
```

## 🚨 Security Best Practices Implemented

### 1. Defense in Depth

- Multiple layers of security validation
- Client-side AND server-side validation
- Network-level protection

### 2. Principle of Least Privilege

- Users have minimum necessary permissions
- Role-based access restrictions
- Granular permission system

### 3. Secure by Default

- Secure cookie settings in production
- HTTPS enforcement
- Default deny policies

### 4. Input Validation

- Comprehensive input sanitization
- Type validation and conversion
- Length and format restrictions

### 5. Error Handling

- No sensitive information in error messages
- Consistent error response format
- Proper HTTP status codes

## 🔧 Security Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=cryptographically-secure-secret-key
JWT_EXPIRE=7d

# Database Security
MONGO_URI=mongodb://username:password@host:port/database

# CORS Configuration
CLIENT_URL=https://your-frontend-domain.com
CLIENT_URLS=https://domain1.com,https://domain2.com

# Production Security
NODE_ENV=production
TRUST_PROXY=1
```

### Production Security Checklist

- [ ] HTTPS enabled and enforced
- [ ] Secure JWT secret (minimum 32 characters)
- [ ] Database authentication enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Error handling sanitized
- [ ] Logging implemented for security events

## 📊 Security Monitoring

### Audit Trail

The system logs security-relevant events:

- User login/logout attempts
- Role changes and promotions
- Administrative actions
- Failed authentication attempts
- Permission violations

### Security Metrics

- Authentication success/failure rates
- Role distribution and usage
- API endpoint access patterns
- Rate limiting triggers

## 🔄 Security Update Process

### Regular Security Tasks

1. **Dependency Updates**: Regular npm audit and updates
2. **Token Rotation**: Periodic JWT secret rotation
3. **Access Review**: Regular role and permission audits
4. **Security Testing**: Penetration testing and vulnerability assessments

### Incident Response

1. **Detection**: Monitoring and alerting systems
2. **Containment**: Immediate threat isolation
3. **Eradication**: Remove vulnerabilities
4. **Recovery**: Restore secure operations
5. **Lessons Learned**: Update security measures

This security architecture provides a robust foundation for the PAMS system and can be extended to support additional security requirements as the system evolves.
