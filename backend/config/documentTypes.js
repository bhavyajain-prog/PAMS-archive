// Dynamic Document Types Configuration
// This file defines the document types that are tracked in the system
// You can enable/disable document types or add new ones by modifying this configuration

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
  {
    key: "roleSpecification",
    name: "Role Specification (Form 2)",
    description: "Team member roles and responsibilities",
    enabled: true,
    requiredForApproval: true,
    adminApprovalRequired: true,
    mentorApprovalRequired: true,
    formPath: "/role-specification",
    category: "form",
    order: 2,
  },
  {
    key: "weeklyStatus",
    name: "Weekly Status Reports (Form 3)",
    description: "Weekly progress reports with file uploads",
    enabled: true,
    requiredForApproval: false, // Weekly status is mentor-approved only
    adminApprovalRequired: false,
    mentorApprovalRequired: true,
    formPath: "/weekly-status-matrix",
    category: "report",
    order: 3,
  },
  // Future document types can be added here:
  //
  // {
  //   key: "finalPresentation",
  //   name: "Final Presentation",
  //   description: "Final project presentation slides and demo video",
  //   enabled: false, // Set to true to enable
  //   requiredForApproval: true,
  //   adminApprovalRequired: true,
  //   mentorApprovalRequired: true,
  //   formPath: "/final-presentation",
  //   category: "presentation",
  //   order: 4
  // },
  // {
  //   key: "projectReport",
  //   name: "Final Project Report",
  //   description: "Comprehensive project documentation and technical report",
  //   enabled: false,
  //   requiredForApproval: true,
  //   adminApprovalRequired: true,
  //   mentorApprovalRequired: true,
  //   formPath: "/project-report",
  //   category: "document",
  //   order: 5
  // },
  // {
  //   key: "codeSubmission",
  //   name: "Source Code Submission",
  //   description: "Complete project source code with documentation",
  //   enabled: false,
  //   requiredForApproval: true,
  //   adminApprovalRequired: false,
  //   mentorApprovalRequired: true,
  //   formPath: "/code-submission",
  //   category: "code",
  //   order: 6
  // }
];

// Helper functions to work with the configuration
const DocumentTypesConfig = {
  // Get all document types
  getAll: () => DOCUMENT_TYPES_CONFIG,

  // Get only enabled document types
  getEnabled: () => DOCUMENT_TYPES_CONFIG.filter((doc) => doc.enabled),

  // Get document types that require approval for completion
  getRequiredForApproval: () =>
    DOCUMENT_TYPES_CONFIG.filter(
      (doc) => doc.enabled && doc.requiredForApproval
    ),

  // Get document type by key
  getByKey: (key) => DOCUMENT_TYPES_CONFIG.find((doc) => doc.key === key),

  // Get document types by category
  getByCategory: (category) =>
    DOCUMENT_TYPES_CONFIG.filter(
      (doc) => doc.enabled && doc.category === category
    ),

  // Get document types requiring admin approval
  getRequiringAdminApproval: () =>
    DOCUMENT_TYPES_CONFIG.filter(
      (doc) => doc.enabled && doc.adminApprovalRequired
    ),

  // Get document types requiring mentor approval
  getRequiringMentorApproval: () =>
    DOCUMENT_TYPES_CONFIG.filter(
      (doc) => doc.enabled && doc.mentorApprovalRequired
    ),

  // Check if a document type is enabled
  isEnabled: (key) => {
    const docType = DocumentTypesConfig.getByKey(key);
    return docType ? docType.enabled : false;
  },

  // Get ordered document types (for UI display)
  getOrdered: () =>
    DOCUMENT_TYPES_CONFIG.filter((doc) => doc.enabled).sort(
      (a, b) => a.order - b.order
    ),
};

module.exports = {
  DOCUMENT_TYPES_CONFIG,
  DocumentTypesConfig,
};
