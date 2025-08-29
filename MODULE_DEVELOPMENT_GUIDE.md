# PAMS Development Guide - Adding New Modules

This guide provides comprehensive instructions for extending the PAMS (Project Allocation and Management System) with new modules and features. Follow these patterns and conventions to maintain code quality and system integrity.

## 📋 Prerequisites

Before adding new modules, ensure you understand:

- The existing security architecture and role-based access control
- The current data models and their relationships
- The frontend component architecture and routing system
- The backend API structure and middleware chain

## 🏗️ Module Development Pattern

### 1. Planning Phase

**Define Your Module Requirements:**

- [ ] Identify target user roles (student, mentor, admin, etc.)
- [ ] Define required database schemas and relationships
- [ ] Plan API endpoints and their security requirements
- [ ] Design UI components and user workflows
- [ ] Consider integration points with existing modules

### Example: Analytics Dashboard Module

```plaintext
Module: Analytics Dashboard
Target Roles: Admin, Sub-Admin
Purpose: System performance monitoring and reporting
Integration: Team data, Project data, User data
```

### 2. Backend Module Structure

Create a new module following this structure:

```plaintext
backend/
├── models/
│   └── Analytics.js          # New data model
├── routes/
│   └── analytics.js          # API endpoints
├── middleware/
│   └── analyticsAuth.js      # Module-specific middleware (if needed)
└── utils/
    └── analyticsHelpers.js   # Utility functions
```

#### 2.1 Create Data Model

**File**: `backend/models/Analytics.js`

```javascript
const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    // Define your schema here
    metric: {
      type: String,
      required: true,
      enum: ["user_activity", "team_performance", "project_allocation"],
    },
    value: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Reference to existing models
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    relatedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add indexes for performance
analyticsSchema.index({ metric: 1, timestamp: -1 });
analyticsSchema.index({ relatedUser: 1 });

// Add virtual fields if needed
analyticsSchema.virtual("formattedTimestamp").get(function () {
  return this.timestamp.toISOString().split("T")[0];
});

module.exports = mongoose.model("Analytics", analyticsSchema);
```

#### 2.2 Create API Routes

**File**: `backend/routes/analytics.js`

```javascript
const router = require("express").Router();
const asyncHandler = require("express-async-handler");
const Analytics = require("../models/Analytics");
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

// GET /analytics/dashboard - Admin dashboard data
router.get(
  "/dashboard",
  authenticate,
  authorizeRoles("admin", "sub-admin"),
  asyncHandler(async (req, res) => {
    try {
      const { startDate, endDate, metric } = req.query;

      // Build query with filters
      const query = {};
      if (startDate && endDate) {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
      if (metric) {
        query.metric = metric;
      }

      const analytics = await Analytics.find(query)
        .populate("relatedUser", "name role")
        .populate("relatedTeam", "code name")
        .sort({ timestamp: -1 })
        .limit(100);

      res.status(200).json({
        success: true,
        data: analytics,
        count: analytics.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching analytics data",
        error: error.message,
      });
    }
  })
);

// POST /analytics/record - Record new metric
router.post(
  "/record",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    try {
      const { metric, value, metadata, relatedUser, relatedTeam } = req.body;

      const analyticsRecord = new Analytics({
        metric,
        value,
        metadata,
        relatedUser,
        relatedTeam,
      });

      await analyticsRecord.save();

      res.status(201).json({
        success: true,
        data: analyticsRecord,
        message: "Analytics record created successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Error creating analytics record",
        error: error.message,
      });
    }
  })
);

module.exports = router;
```

#### 2.3 Register Routes in Main Server

**File**: `backend/index.js`

```javascript
// Add to imports
const analytics = require("./routes/analytics");

// Add to routes section
app.use("/analytics", analytics);
```

### 3. Frontend Module Structure

Create a new feature module following this structure:

```plaintext
frontend/src/features/
└── analytics/
    ├── components/
    │   ├── AnalyticsDashboard.jsx
    │   ├── MetricsChart.jsx
    │   └── DataTable.jsx
    ├── hooks/
    │   └── useAnalytics.js
    └── services/
        └── analyticsAPI.js
```

#### 3.1 Create API Service

**File**: `frontend/src/features/analytics/services/analyticsAPI.js`

```javascript
import axiosInstance from "../../../services/axios";

export const analyticsAPI = {
  // Get dashboard data
  getDashboardData: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axiosInstance.get(
        `/analytics/dashboard?${params}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch analytics data"
      );
    }
  },

  // Record new metric
  recordMetric: async (metricData) => {
    try {
      const response = await axiosInstance.post(
        "/analytics/record",
        metricData
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to record metric"
      );
    }
  },
};
```

#### 3.2 Create Custom Hook

**File**: `frontend/src/features/analytics/hooks/useAnalytics.js`

```javascript
import { useState, useEffect, useCallback } from "react";
import { analyticsAPI } from "../services/analyticsAPI";

export const useAnalytics = (initialFilters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await analyticsAPI.getDashboardData(filters);
      setData(result.data || []);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const recordMetric = useCallback(
    async (metricData) => {
      try {
        await analyticsAPI.recordMetric(metricData);
        // Refresh data after recording
        fetchData();
        return true;
      } catch (err) {
        setError(err.message);
        return false;
      }
    },
    [fetchData]
  );

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    recordMetric,
    refetch: fetchData,
  };
};
```

#### 3.3 Create Main Component

**File**: `frontend/src/features/analytics/components/AnalyticsDashboard.jsx`

```javascript
import React, { useState } from "react";
import { useAnalytics } from "../hooks/useAnalytics";
import MetricsChart from "./MetricsChart";
import DataTable from "./DataTable";
import Loading from "../../../components/Loading";

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const { data, loading, error, updateFilters } = useAnalytics();

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    updateFilters(dateRange);
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Analytics Dashboard
        </h1>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            Error: {error}
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <MetricsChart data={data} />
        </div>

        {/* Data Table */}
        <DataTable data={data} />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
```

#### 3.4 Add Routes to App

**File**: `frontend/src/App.jsx`

```javascript
// Add import
import AnalyticsDashboard from "./features/analytics/components/AnalyticsDashboard";

// Add route
<Route
  path="/admin/analytics"
  element={
    <RoleBasedRoute roles={["admin", "sub-admin"]}>
      <AnalyticsDashboard />
    </RoleBasedRoute>
  }
/>;
```

## 🔒 Security Implementation

### 1. Backend Security

**Route Protection Pattern:**

```javascript
router.get(
  "/secure-endpoint",
  authenticate, // Verify JWT token
  authorizeRoles("admin", "mentor"), // Check user role
  asyncHandler(async (req, res) => {
    // Your secure logic here
  })
);
```

**Input Validation Pattern:**

```javascript
const validateInput = (req, res, next) => {
  const { requiredField } = req.body;

  if (!requiredField) {
    return res.status(400).json({
      success: false,
      message: "Required field is missing",
    });
  }

  // Additional validation logic
  next();
};
```

### 2. Frontend Security

**Protected Route Pattern:**

```javascript
<Route
  path="/your-module"
  element={
    <RoleBasedRoute roles={["required", "roles"]}>
      <YourComponent />
    </RoleBasedRoute>
  }
/>
```

**API Error Handling:**

```javascript
try {
  const response = await yourAPI.call();
  // Handle success
} catch (error) {
  // Handle errors appropriately
  console.error("API Error:", error.message);
  // Show user-friendly error message
}
```

## 📊 Database Integration

### 1. Referencing Existing Models

**One-to-Many Relationship:**

```javascript
// In your new model
relatedTeam: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Team",
  required: true
}

// Querying with population
const result = await YourModel.find()
  .populate("relatedTeam", "code name members");
```

**Many-to-Many Relationship:**

```javascript
// Array of references
relatedUsers: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
];
```

### 2. Database Migrations

**Adding New Fields to Existing Models:**

```javascript
// Create migration script
const User = require("./models/User");

async function addNewField() {
  await User.updateMany(
    { newField: { $exists: false } },
    { $set: { newField: defaultValue } }
  );
}
```

## 🧪 Testing Your Module

### 1. Backend Testing

**API Endpoint Testing:**

```javascript
// Test file: tests/analytics.test.js
const request = require("supertest");
const app = require("../index");

describe("Analytics API", () => {
  test("GET /analytics/dashboard requires authentication", async () => {
    const response = await request(app).get("/analytics/dashboard").expect(401);
  });

  test("GET /analytics/dashboard returns data for admin", async () => {
    const token = "valid-admin-jwt-token";
    const response = await request(app)
      .get("/analytics/dashboard")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

### 2. Frontend Testing

**Component Testing:**

```javascript
// Test file: src/features/analytics/__tests__/AnalyticsDashboard.test.jsx
import { render, screen } from "@testing-library/react";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

test("renders analytics dashboard", () => {
  render(<AnalyticsDashboard />);
  expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument();
});
```

## 📚 Documentation

### 1. API Documentation

Create API documentation for your endpoints:

````markdown
## Analytics API

### GET /analytics/dashboard

Returns analytics dashboard data.

**Authentication**: Required
**Authorization**: Admin, Sub-Admin

**Query Parameters**:

- `startDate` (optional): Filter start date (YYYY-MM-DD)
- `endDate` (optional): Filter end date (YYYY-MM-DD)
- `metric` (optional): Specific metric type

**Response**:

```json
{
  "success": true,
  "data": [...],
  "count": 50
}
```

### 2. Component Documentation

Document your React components:

```javascript
/**
 * AnalyticsDashboard Component
 *
 * Displays system analytics and metrics for administrators.
 *
 * @component
 * @example
 * <AnalyticsDashboard />
 *
 * Features:
 * - Date range filtering
 * - Real-time data updates
 * - Export functionality
 *
 * Required Roles: admin, sub-admin
 */
const AnalyticsDashboard = () => {
  // Component implementation
};
````

## 🚀 Deployment Considerations

### 1. Environment Variables

Add any new environment variables to both development and production:

```env
# Analytics Module Configuration
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_MAX_RECORDS=10000
```

### 2. Database Indexes

Ensure proper indexing for performance:

```javascript
// Add to your model file
analyticsSchema.index({ timestamp: -1 });
analyticsSchema.index({ metric: 1, timestamp: -1 });
```

### 3. Bundle Size Optimization

For frontend modules, consider code splitting:

```javascript
// Lazy load your module
const AnalyticsDashboard = lazy(() =>
  import("./features/analytics/components/AnalyticsDashboard")
);

// Use with Suspense
<Suspense fallback={<Loading />}>
  <AnalyticsDashboard />
</Suspense>;
```

## ✅ Module Checklist

Before deploying your new module:

**Backend:**

- [ ] Data models created with proper validation
- [ ] API routes implemented with security middleware
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Database indexes created
- [ ] Tests written and passing

**Frontend:**

- [ ] Components created with proper structure
- [ ] API services implemented
- [ ] Error handling added
- [ ] Routes protected with role-based access
- [ ] Responsive design implemented
- [ ] Loading states handled

**Integration:**

- [ ] Routes registered in main app
- [ ] Navigation updated (if needed)
- [ ] Permissions documented
- [ ] API endpoints documented
- [ ] Environment variables configured

**Security:**

- [ ] Authentication required for all endpoints
- [ ] Role-based authorization implemented
- [ ] Input sanitization added
- [ ] Error messages sanitized
- [ ] Security testing completed

This guide provides a solid foundation for extending the PAMS system. Follow these patterns consistently to maintain code quality and system integrity across all new modules.
