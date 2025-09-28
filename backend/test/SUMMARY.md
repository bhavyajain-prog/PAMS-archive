# PAMS Backend Test Directory Summary

## 📁 Directory Structure

```plaintext
test/
├── dummyData.js      # Comprehensive test data generator
├── test-ttl.js       # TTL index functionality test
├── runTests.js       # Interactive test runner
└── README.md         # Detailed testing documentation
```

## 🎯 Quick Start

```bash
# Generate test data (recommended first step)
npm run test:dummy

# Test TTL functionality
npm run test:ttl

# Run all tests
npm test

# Interactive test runner
npm run test:run help
```

## 📊 Generated Test Data

After running `npm run test:dummy`, you'll have:

- **22 Users**: Admin, Dev, 15 Students, 5 Mentors
- **5 Teams**: With complete project assignments and relationships
- **8 Projects**: Mix of approved, pending, and rejected projects
- **Weekly Updates**: Realistic progress tracking data
- **System Settings**: Configured timeline and academic calendar

## 🔑 Sample Login Credentials

| Role    | Email               | Password      |
| ------- | ------------------- | ------------- |
| Admin   | `admin@dept.edu`    | `admin123`    |
| Dev     | `dev@dept.edu`      | `dev123`      |
| Student | `student1@dept.edu` | `student1123` |
| Mentor  | `mentor1@dept.edu`  | `mentor1123`  |

## ✨ Features

- **Realistic Data**: Proper roll numbers, phone numbers, and relationships
- **Complete Workflows**: From team formation to project completion
- **Validation Compliant**: All data passes model validation
- **Relationship Integrity**: Proper foreign key relationships maintained
- **Timeline Simulation**: Projects with realistic start/end dates

## 🚀 Usage Tips

1. **First Time Setup**: Run `npm run test:dummy` to populate database
2. **Clean Slate**: Script automatically clears existing data
3. **Environment**: Uses same .env configuration as main app
4. **Testing**: Perfect for frontend development and API testing

For detailed documentation, see `test/README.md`.
