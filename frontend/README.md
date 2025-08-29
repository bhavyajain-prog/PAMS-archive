# PAMS Frontend

The client-side React application for the Project Allocation and Management System (PAMS). Built with modern React patterns, this application provides an intuitive and responsive user interface for all stakeholders in the academic project management process.

## 🏗️ Architecture Overview

The frontend follows a feature-based architecture with role-based routing and comprehensive state management:

```
frontend/
├── public/           # Static assets and HTML template
├── src/
│   ├── assets/       # Images, icons, and static resources
│   ├── components/   # Shared UI components
│   ├── contexts/     # React Context providers for global state
│   ├── features/     # Feature-based modules (admin, auth, mentor, student)
│   ├── pages/        # Top-level page components
│   ├── routing/      # Route protection and navigation logic
│   ├── services/     # API communication and external services
│   ├── App.jsx       # Main application component and route configuration
│   └── main.jsx      # Application entry point
├── index.html        # HTML template
├── vite.config.js    # Vite build configuration
└── package.json      # Dependencies and scripts
```

## 🎨 UI Components Architecture

### Shared Components (`components/`)

**Core Components:**

- `Header.jsx` - Application navigation with role-based menu
- `Footer.jsx` - Application footer with links and information
- `Loading.jsx` - Consistent loading states across the application
- `Redirect.jsx` - Programmatic navigation helper

**Features:**

- Responsive design with Tailwind CSS
- Consistent styling patterns
- Accessibility considerations
- Reusable across all features

### Feature Modules (`features/`)

#### Admin Module (`features/admin/`)

Comprehensive administrative interface with full system control:

**Components:**

- `AdminPortal.jsx` - Main dashboard with system overview
- `AdminUpload.jsx` - Bulk data import interface (users, projects)
- `ManageStudents.jsx` - Student lifecycle management
- `ManageMentors.jsx` - Mentor and sub-admin management
- `ManageTeams.jsx` - Team oversight and allocation
- `ManageProjects.jsx` - Project bank administration
- `FormApproval.jsx` - Evaluation form review system

**Key Features:**

- **User Management**: Full CRUD operations with role management
- **Bulk Operations**: Excel/CSV import with validation
- **Role Promotion**: Dynamic mentor ↔ sub-admin transitions
- **System Analytics**: Comprehensive statistics and reports
- **Data Validation**: Real-time form validation and error handling

#### Authentication Module (`features/auth/`)

Secure authentication flow with comprehensive user management:

**Components:**

- `Login.jsx` - Primary authentication interface
- `Register.jsx` - User registration (admin-controlled)
- `ForgotPassword.jsx` - Password recovery initiation
- `ResetPassword.jsx` - Secure password reset with token validation

**Security Features:**

- **JWT Token Management**: Automatic token handling
- **Remember Me**: Persistent authentication option
- **First Login Flow**: Mandatory password change
- **Error Handling**: User-friendly security error messages

#### Student Module (`features/student/`)

Student-centric interface for team and project management:

**Components:**

- `StudentPortal.jsx` - Personal dashboard and overview
- `CreateTeam.jsx` - Team formation with validation
- `JoinTeam.jsx` - Team joining via unique codes
- `MyTeam.jsx` - Team management and member overview
- `TeamDetails.jsx` - Comprehensive team information
- `ProposeProject.jsx` - Custom project proposal submission

**Student Capabilities:**

- **Team Formation**: Create teams with unique codes
- **Team Management**: Leader-based team administration
- **Project Selection**: Preference-based project selection
- **Progress Tracking**: Real-time status monitoring

#### Mentor Module (`features/mentor/`)

Mentor-focused interface for team guidance and evaluation:

**Components:**

- `MentorPortal.jsx` - Mentor dashboard with assigned teams
- `TeamSelection.jsx` - Team approval and preference management

**Mentor Capabilities:**

- **Team Oversight**: Monitor assigned team progress
- **Evaluation Management**: Review and approve submissions
- **Feedback System**: Provide structured feedback
- **Progress Tracking**: Monitor project milestones

#### Forms Module (`features/forms/`)

Structured evaluation system with multi-stage assessment:

**Components:**

- `Form1.jsx` - Project Abstract submission
- `Form2.jsx` - Role Specification documentation
- `Form3.jsx` - Weekly Status Matrix tracking

**Form Features:**

- **Progressive Submission**: Stage-based form completion
- **Auto-save**: Prevent data loss during editing
- **Validation**: Comprehensive input validation
- **Status Tracking**: Real-time submission status

## 🔐 Security & Authentication

### Authentication Context (`contexts/AuthContext.jsx`)

Centralized authentication state management:

**Features:**

- **Automatic Login**: Persistent authentication via cookies
- **Role-based Routing**: Automatic redirection based on user role
- **Token Management**: Transparent JWT handling
- **User State**: Global user information access

**Implementation Highlights:**

```javascript
const AuthProvider = ({ children }) => {
  // Automatic authentication check on app load
  // Role-based navigation after login
  // User data synchronization with backend
  // Logout handling with cleanup
};
```

### Role-based Route Protection (`routing/RoleBasedRoute.jsx`)

Comprehensive route security:

**Access Control Matrix:**

```
Route Access Levels:
├── Public Routes (/, /login, /register, /forgot-password)
├── Student Routes (/home, /team/*, /forms/*)
├── Mentor Routes (/mentor/*, /team/approve)
├── Admin Routes (/admin/*, /manage/*)
└── Developer Routes (/dev) - Override access
```

**Security Features:**

- **Automatic Redirects**: Unauthorized access handling
- **Loading States**: Seamless user experience during auth checks
- **Role Validation**: Server-synchronized permission checking

## 🛠️ State Management

### Context API Implementation

Efficient state management with React Context:

**Global State:**

- **User Authentication**: Login status and user information
- **Application Settings**: Theme, preferences, and configuration
- **Error Handling**: Global error state and notification system

**Local State:**

- **Form Data**: Component-level form state management
- **UI State**: Modal visibility, loading states, pagination
- **Cache**: Temporary data storage for performance

## 🎨 Styling & Design System

### Tailwind CSS 4.0

Modern utility-first CSS framework:

**Design Principles:**

- **Mobile-first**: Responsive design by default
- **Component-based**: Reusable style patterns
- **Consistent Spacing**: Systematic spacing scale
- **Color Palette**: Cohesive color scheme across features

**Key Patterns:**

```css
/* Consistent button styles */
.btn-primary: bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md

/* Card layouts */
.card: bg-white shadow-lg rounded-lg p-6

/* Form inputs */
.input: border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500
```

### Component Styling

- **Consistent Patterns**: Unified styling across components
- **Interactive States**: Hover, focus, and active states
- **Accessibility**: ARIA compliance and keyboard navigation
- **Animation**: Smooth transitions with Framer Motion

## 📡 API Communication

### Axios Configuration (`services/axios.js`)

Centralized HTTP client with interceptors:

**Features:**

- **Base URL Configuration**: Environment-based API endpoints
- **Request Interceptors**: Automatic token attachment
- **Response Interceptors**: Global error handling
- **Retry Logic**: Automatic retry for transient failures

**Implementation:**

```javascript
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor for authentication
axiosInstance.interceptors.request.use((config) => {
  // Token attachment logic
});

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling
    // Automatic logout on 401
    // User-friendly error messages
  }
);
```

## 🚀 Performance Optimizations

### Code Splitting

Strategic component lazy loading:

- **Route-based Splitting**: Lazy load feature modules
- **Component Splitting**: Dynamic imports for large components
- **Bundle Analysis**: Optimized chunk sizes

### State Optimization

- **Memoization**: React.memo for expensive components
- **Callback Optimization**: useCallback for stable references
- **Effect Dependencies**: Minimized re-renders

### Asset Optimization

- **Image Optimization**: Responsive images with modern formats
- **Icon System**: Efficient icon loading with React Icons
- **Font Loading**: Optimized web font delivery

## 🌐 Routing Architecture

### Main Application Routes (`App.jsx`)

Comprehensive routing with protection:

```javascript
// Public routes
/login, /register, /forgot-password, /reset-password

// Student routes
/home, /team/create, /team/join, /team/my-team, /forms/*

// Mentor routes
/mentor/home, /mentor/teams, /team/selection

// Admin routes
/admin/home, /admin/upload, /admin/manage/*

// Developer routes
/dev (override access)
```

**Navigation Features:**

- **Breadcrumb Navigation**: Contextual navigation aids
- **Active State Management**: Current route highlighting
- **Dynamic Menu**: Role-based navigation options

## 🔧 Development Environment

### Vite Configuration (`vite.config.js`)

Modern build tool with optimizations:

**Features:**

- **Fast HMR**: Hot module replacement for development
- **Tree Shaking**: Optimal bundle sizes
- **Environment Variables**: VITE\_ prefixed variables
- **Proxy Configuration**: Development API proxy

### Development Scripts

```bash
npm run dev      # Development server with HMR
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint code quality check
```

## 📱 Responsive Design

### Breakpoint Strategy

Mobile-first responsive design:

```css
/* Mobile: 320px+ (default) */
/* Tablet: 640px+ (sm:) */
/* Desktop: 1024px+ (lg:) */
/* Large: 1280px+ (xl:) */
```

### Component Responsiveness

- **Flexible Layouts**: CSS Grid and Flexbox patterns
- **Adaptive Components**: Screen-size aware components
- **Touch Optimization**: Mobile-friendly interactions

## 🧪 Testing Strategy

### Component Testing

Testable component architecture:

- **Pure Components**: Predictable input/output behavior
- **Isolated Logic**: Separated business logic from UI
- **Mock Integration**: Easy API mocking for tests

### E2E Testing Preparation

Ready for end-to-end testing:

- **Data Attributes**: Test-friendly element identification
- **Stable Selectors**: Consistent element targeting
- **State Predictability**: Reliable application states

## 🚀 Build & Deployment

### Environment Configuration

Environment-specific settings:

```env
# Development
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_TITLE=PAMS Development

# Production
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_TITLE=PAMS
```

### Production Build

Optimized production assets:

- **Minification**: CSS and JavaScript optimization
- **Asset Hashing**: Cache-busting file names
- **Gzip Compression**: Reduced transfer sizes
- **Source Maps**: Debug-friendly production builds

### Deployment Options

- **Static Hosting**: Vercel, Netlify, GitHub Pages
- **CDN Deployment**: CloudFront, CloudFlare
- **Container Deployment**: Docker with Nginx
- **Traditional Hosting**: Apache/Nginx with custom configuration

## 🔍 Browser Support

### Modern Browser Requirements

- **Chrome 90+**
- **Firefox 88+**
- **Safari 14+**
- **Edge 90+**

### Feature Detection

- **ES2020+ Features**: Modern JavaScript usage
- **CSS Grid**: Advanced layout support
- **Fetch API**: Native HTTP requests
- **Local Storage**: Client-side data persistence

## 📈 Performance Monitoring

### Core Web Vitals

Optimized for Google's Core Web Vitals:

- **LCP**: Largest Contentful Paint < 2.5s
- **FID**: First Input Delay < 100ms
- **CLS**: Cumulative Layout Shift < 0.1

### Monitoring Integration Ready

- **Error Tracking**: Sentry integration preparation
- **Performance Monitoring**: Real User Monitoring setup
- **Analytics**: Google Analytics/GA4 integration points

This frontend application provides a robust, scalable foundation for the PAMS system and is designed to accommodate future feature expansions and technological upgrades.
