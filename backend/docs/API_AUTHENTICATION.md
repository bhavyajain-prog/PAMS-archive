# Authentication API Documentation

## Overview
The Authentication module handles user authentication, session management, password operations, and account security for the PAMS (Project Allocation and Management System).

**Base Path:** `/auth`

**Authentication Method:** JWT (JSON Web Token) stored in HTTP-only cookies

---

## Endpoints

### 1. Get Current User Profile

**Endpoint:** `GET /auth/me`

**Description:** Retrieves the authenticated user's profile information including role-specific data.

**Authentication:** Required (JWT Token)

**Authorization:** All authenticated users

**Request Headers:**
- `Cookie: token=<JWT>` or `Authorization: Bearer <JWT>`

**Response Status Codes:**
- `200 OK` - User profile retrieved successfully
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - User not found in database

**Response Body (200 OK):**
```json
{
  "user": {
    "_id": "string",
    "name": "string",
    "username": "string",
    "email": "string",
    "role": "string (student|mentor|admin|sub-admin|dev)",
    "firstLogin": "boolean",
    "createdAt": "ISO8601 datetime",
    "updatedAt": "ISO8601 datetime",
    "studentData": {
      "rollNumber": "string",
      "batch": "string",
      "department": "string",
      "currentTeam": {
        "_id": "string",
        "code": "string",
        "status": "string",
        "leader": {
          "_id": "string",
          "name": "string",
          "username": "string"
        }
      }
    }
  }
}
```

**Notes:**
- For students, includes populated `currentTeam` with leader details
- Password field is always excluded from response
- Response structure varies based on user role

---

### 2. User Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticates user credentials and establishes a session by issuing a JWT token.

**Authentication:** Not required

**Request Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "username": "string (required, username or email)",
  "password": "string (required, minimum 6 characters)",
  "rememberMe": "boolean (optional, default: false)"
}
```

**Response Status Codes:**
- `200 OK` - Authentication successful
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid credentials

**Response Body (200 OK - Regular Login):**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "string",
    "name": "string",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

**Response Body (200 OK - First Login):**
```json
{
  "message": "Login successful",
  "firstLogin": true,
  "user": {
    "_id": "string",
    "name": "string",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

**Response Headers:**
- `Set-Cookie: token=<JWT>; HttpOnly; Secure; SameSite=Strict; Max-Age=<duration>`
  - Duration: 7 days if `rememberMe: true`, otherwise 1 day

**Cookie Configuration:**
- `httpOnly: true` - Prevents JavaScript access
- `secure: true` - HTTPS only (production)
- `sameSite: strict` - CSRF protection
- `maxAge: 30 days` (rememberMe) or `1 day` (default)

**Security Features:**
- Password comparison using bcrypt
- JWT token generation with configurable expiration
- Support for username or email login
- HTTP-only cookie for XSS protection

**Notes:**
- `firstLogin: true` indicates user must change password
- Token expiration aligns with cookie maxAge

---

### 3. User Logout

**Endpoint:** `POST /auth/logout`

**Description:** Terminates the user session by clearing the authentication token cookie.

**Authentication:** Not required (works on client-side cookie)

**Request Headers:** None required

**Request Body:** None

**Response Status Codes:**
- `200 OK` - Logout successful

**Response Body (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Response Headers:**
- `Set-Cookie: token=; Max-Age=0` - Clears authentication cookie

**Notes:**
- Safe to call even if not authenticated
- Client should redirect to login page after logout
- Does not invalidate the JWT token itself (stateless design)

---

### 4. Change Password

**Endpoint:** `PUT /auth/me/password`

**Description:** Updates the authenticated user's password. Also clears the first-login flag.

**Authentication:** Required (JWT Token)

**Authorization:** All authenticated users

**Request Headers:**
- `Content-Type: application/json`
- `Cookie: token=<JWT>` or `Authorization: Bearer <JWT>`

**Request Body:**
```json
{
  "newPassword": "string (required, minimum 6 characters)"
}
```

**Response Status Codes:**
- `200 OK` - Password updated successfully
- `400 Bad Request` - Missing password or validation failure
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - User not found

**Response Body (200 OK):**
```json
{
  "message": "Password updated successfully"
}
```

**Password Requirements:**
- Minimum length: 6 characters
- Hashed using bcrypt with salt rounds: 10

**Security Features:**
- Password hashing with bcrypt
- Salt generation per password
- Automatic `firstLogin` flag reset to false
- No old password verification (for first-time password change)

**Notes:**
- Primarily used for mandatory first-login password change
- Does not require current password verification
- User remains authenticated after password change

---

### 5. Forgot Password Request

**Endpoint:** `POST /auth/forgot-password`

**Description:** Initiates password reset process by sending a reset link to the user's registered email address.

**Authentication:** Not required

**Request Headers:**
- `Content-Type: application/json`
- `Origin: <client-url>` (used for reset link generation)

**Request Body:**
```json
{
  "email": "string (required, valid email format)"
}
```

**Response Status Codes:**
- `200 OK` - Reset email sent successfully
- `400 Bad Request` - Missing or invalid email
- `404 Not Found` - Email not registered in system

**Response Body (200 OK):**
```json
{
  "message": "Password reset email sent"
}
```

**Email Configuration:**
- Service: Gmail SMTP
- From: Configured in `EMAIL_USER` environment variable
- Subject: "Reset Password"
- Format: HTML with branded template

**Reset Token:**
- Type: JWT
- Expiration: 1 hour
- Payload: `{ _id: user._id }`
- Signing key: `JWT_SECRET` environment variable

**Reset Link Format:**
```
{CLIENT_URL}/reset-password/{resetToken}
```

**Email Template Includes:**
- Branded header
- Reset button (primary CTA)
- Plain text link fallback
- Warning about request validity
- Support contact information

**Security Considerations:**
- Token expires after 1 hour
- Single-use token (not tracked, but tied to user ID)
- Email must match registered account
- No indication of whether email exists (prevents enumeration)

**Notes:**
- Client URL determined from `Origin` header or `CLIENT_URL` environment variable
- Email delivery is asynchronous
- No user data exposed in response

---

### 6. Reset Password with Token

**Endpoint:** `POST /auth/reset-password/:token`

**Description:** Completes the password reset process using a valid reset token received via email.

**Authentication:** Not required (token-based)

**Path Parameters:**
- `token` (string, required) - JWT reset token from email link

**Request Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "newPassword": "string (required, minimum 6 characters)"
}
```

**Response Status Codes:**
- `200 OK` - Password reset successful
- `400 Bad Request` - Invalid, expired, or malformed token; or invalid password
- `404 Not Found` - User associated with token not found

**Response Body (200 OK):**
```json
{
  "message": "Password reset successful"
}
```

**Response Body (400 Bad Request - Token Error):**
```json
{
  "message": "Invalid or expired token"
}
```

**Response Body (400 Bad Request - Password Error):**
```json
{
  "message": "New password is required"
}
```

**Token Validation:**
- Verifies JWT signature against `JWT_SECRET`
- Checks token expiration (1 hour from issue)
- Extracts user ID from token payload

**Password Requirements:**
- Minimum length: 6 characters
- Hashed using bcrypt with salt rounds: 10

**Security Features:**
- Token-based authentication
- Password hashing with bcrypt
- Token expiration enforcement
- Single-use intent (token doesn't get invalidated, but lost after use)

**Process Flow:**
1. Verify and decode reset token
2. Locate user by ID from token payload
3. Hash new password with bcrypt
4. Update user password in database
5. Return success response

**Notes:**
- User must log in again after password reset
- Token becomes unusable after 1 hour
- No notification email sent after reset
- Consider implementing token invalidation for enhanced security

---

## Authentication Flow

### Standard Login Flow:
1. User submits credentials to `POST /auth/login`
2. Server validates credentials
3. Server generates JWT token
4. Server sets HTTP-only cookie with token
5. Client stores user data in state/storage
6. Subsequent requests include cookie automatically

### First-Time Login Flow:
1. User logs in with default credentials
2. Server detects `firstLogin: true` flag
3. Server returns `firstLogin: true` in response
4. Client redirects to password change page
5. User submits new password to `PUT /auth/me/password`
6. Server updates password and clears `firstLogin` flag
7. User can now use the system normally

### Password Reset Flow:
1. User requests reset via `POST /auth/forgot-password`
2. Server generates reset token and sends email
3. User clicks link in email
4. Client extracts token from URL
5. User submits new password to `POST /auth/reset-password/:token`
6. Server validates token and updates password
7. User logs in with new password

---

## Security Considerations

### JWT Token Security:
- Tokens stored in HTTP-only cookies (not accessible via JavaScript)
- HTTPS-only cookies in production
- SameSite=Strict for CSRF protection
- Configurable expiration (1 day default, 7 days with rememberMe)
- Signed with secret key from environment variable

### Password Security:
- Passwords hashed using bcrypt with salt
- Minimum 6 characters length requirement
- Salt rounds: 10
- Never stored or transmitted in plain text
- Password field excluded from all query responses

### Email Security:
- Reset tokens expire after 1 hour
- Tokens are single-purpose JWT
- No sensitive information in email body
- Reset links are unique per request

### API Security:
- Authentication middleware validates all protected routes
- Role-based authorization on sensitive endpoints
- No user enumeration via error messages
- Logout clears authentication cookies

---

## Environment Variables Required

```env
JWT_SECRET=<random-secret-key>
JWT_EXPIRE=<default: 1d>
EMAIL_USER=<gmail-account>
EMAIL_PASS=<gmail-app-password>
CLIENT_URL=<frontend-url>
NODE_ENV=<development|production>
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "message": "string (human-readable error description)"
}
```

Common error scenarios:
- Missing authentication: `401 Unauthorized`
- Invalid credentials: `401 Unauthorized`
- Missing required fields: `400 Bad Request`
- Resource not found: `404 Not Found`
- Validation failures: `400 Bad Request`
- Server errors: `500 Internal Server Error`

---

## Rate Limiting Recommendations

Consider implementing rate limiting on:
- Login endpoint: Max 5 attempts per IP per 15 minutes
- Forgot password: Max 3 requests per email per hour
- Password change: Max 5 attempts per user per hour

---

## Logging Recommendations

Log the following events:
- Successful logins (user ID, timestamp, IP)
- Failed login attempts (username, timestamp, IP)
- Password changes (user ID, timestamp)
- Password reset requests (email, timestamp)
- Token validation failures (token, timestamp)

---

## Testing Checklist

- [ ] Login with valid username/password
- [ ] Login with valid email/password
- [ ] Login with invalid credentials
- [ ] Login with rememberMe flag
- [ ] First-time login flow
- [ ] Password change with valid token
- [ ] Password change with short password
- [ ] Forgot password with valid email
- [ ] Forgot password with invalid email
- [ ] Reset password with valid token
- [ ] Reset password with expired token
- [ ] Reset password with invalid token
- [ ] Logout functionality
- [ ] Get current user profile
- [ ] Token expiration handling
- [ ] Cookie security attributes

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-28  
**API Version:** 1.0
