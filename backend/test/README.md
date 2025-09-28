# PAMS Backend Testing Suite

This directory contains testing utilities and scripts for the PAMS (Project Allocation and Management System) backend.

## Files Overview

### `dummyData.js`

A comprehensive script that populates the database with realistic test data for development and testing purposes.

**What it creates:**

- Default admin and dev users (using environment variables)
- Sample students (15), mentors (5), and teams (5)
- Sample project bank entries (8 projects)
- Complete team structures with relationships
- Project abstracts and role specifications
- Weekly status updates with mentor evaluations
- System settings configuration

**Usage:**

```bash
# From the backend directory
node test/dummyData.js

# Or from the test directory
cd test
node dummyData.js
```

**Environment Variables Required:**

- `MONGO_URI` - MongoDB connection string
- Optional: `ADMIN_EMAIL`, `ADMIN_PASS`, `DEV_EMAIL`, `DEV_PASS`

### `test-ttl.js`

Tests the TTL (Time To Live) index functionality for automatic deletion of rejected projects after 2 days.

**Usage:**

```bash
# From the backend directory
node test/test-ttl.js

# Or from the test directory
cd test
node test-ttl.js
```

## Sample Data Configuration

The `dummyData.js` script uses the following configuration (can be modified in the file):

```javascript
const SAMPLE_DATA_CONFIG = {
  students: 15, // Total students to create
  mentors: 5, // Total mentors to create
  teams: 5, // Total teams to create
  projects: 8, // Total projects in project bank
  weeklyUpdates: 3, // Weekly updates per team
};
```

## Sample Login Credentials

After running `dummyData.js`, you can use these credentials to test the system:

**Admin User:**

- Email: `admin@dept.edu` (or from `ADMIN_EMAIL` env var)
- Password: `admin123` (or from `ADMIN_PASS` env var)

**Dev User:**

- Email: `dev@dept.edu` (or from `DEV_EMAIL` env var)
- Password: `dev123` (or from `DEV_PASS` env var)

**Sample Students:**

- Email: `student1@dept.edu` → Password: `student1123`
- Email: `student2@dept.edu` → Password: `student2123`
- ... and so on

**Sample Mentors:**

- Email: `mentor1@dept.edu` → Password: `mentor1123` (Sub-Admin)
- Email: `mentor2@dept.edu` → Password: `mentor2123`
- ... and so on

## Data Structure Generated

### Students

- Roll numbers follow format: `{YY}{DEPT_CODE}{###}` (e.g., `24CS001`)
- Distributed across different departments and batches
- Some students are already assigned to teams

### Teams

- 6-character alphanumeric team codes
- 2-4 members per team
- Proper mentor assignments
- Complete project abstracts and role specifications
- Weekly status updates with mentor evaluations

### Projects

- Distributed across different categories (Web Dev, ML, IoT, etc.)
- Mix of approved, pending, and rejected projects
- Proper feedback and rejection handling

### Mentors

- Different departments and designations
- One sub-admin mentor with additional permissions
- Team assignments maintained

## Testing Workflow

1. **Setup Database:**

   ```bash
   # Make sure MongoDB is running
   # Set MONGO_URI in .env file
   node test/dummyData.js
   ```

2. **Test TTL Functionality:**

   ```bash
   node test/test-ttl.js
   ```

3. **Login and Test Features:**
   - Use the sample credentials to test different user roles
   - Verify team management, project allocation, weekly status updates
   - Test admin features like user management and approvals

## Notes

- The script clears existing data before generating new data
- All passwords are properly hashed using bcrypt
- Relationships between models are properly maintained
- Realistic dates and timelines are used for project timelines
- Weekly status updates include file upload simulation

## Troubleshooting

**Connection Issues:**

- Ensure MongoDB is running
- Check `MONGO_URI` in environment variables
- Verify network connectivity to database

**Duplicate Key Errors:**

- Clear the database before running the script
- Check for existing data that might conflict

**Memory Issues:**

- Reduce `SAMPLE_DATA_CONFIG` values for smaller datasets
- Ensure adequate system memory for large datasets
