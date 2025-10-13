const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      validate: {
        validator: (v) => /^[A-Z0-9]{6}$/.test(v),
        message: (props) =>
          `${props.value} is not a valid team code! Must be 6 characters alphanumeric.`,
      },
    },

    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    batch: { type: String, required: true },
    department: { type: String, required: true },

    projectChoices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProjectBank",
      },
    ],
    finalProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectBank",
    },
    mentor: {
      assigned: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      assignedAt: { type: Date },
      preferences: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      currentPreference: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    feedback: [
      {
        message: { type: String, default: "" },
        byUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
      },
    ],

    projectAbstract: {
      projectTrack: {
        type: String,
        enum: ["R&D", "Consultancy", "Startup", "Project Pool", "Hardware"],
      },
      githubRepo: { type: String },
      tools: [
        {
          name: { type: String, required: true },
          version: { type: String },
          type: { type: String },
          purpose: { type: String },
        },
      ],
      modules: [
        {
          name: { type: String, required: true },
          functionality: { type: String },
        },
      ],
      submittedAt: { type: Date },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: [
          "draft",
          "submitted",
          "mentor_approved",
          "admin_approved",
          "rejected",
        ],
        default: "draft",
      },
      mentorApproval: { type: Boolean, default: false },
      adminApproval: { type: Boolean, default: false },
    },

    roleSpecification: {
      assignments: [
        {
          member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          modules: [{ type: String, required: true }],
          activities: [
            {
              name: { type: String, required: true },
              softDeadline: { type: Date },
              hardDeadline: { type: Date },
              details: { type: String },
            },
          ],
        },
      ],
      submittedAt: { type: Date },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: [
          "draft",
          "submitted",
          "mentor_approved",
          "admin_approved",
          "rejected",
        ],
        default: "draft",
      },
      mentorApproval: { type: Boolean, default: false },
      adminApproval: { type: Boolean, default: false },
    },

    evaluation: {
      weeklyStatus: [
        {
          week: { type: Number, required: true },
          dateRange: {
            from: { type: Date, required: true },
            to: { type: Date, required: true },
          },
          module: { type: String, required: true },
          progress: { type: String, required: true },
          achievements: [{ type: String }],
          challenges: [{ type: String }],
          studentRemarks: { type: String },

          // File upload information
          projectFile: {
            originalName: { type: String },
            filename: { type: String },
            path: { type: String },
            size: { type: Number },
            uploadedAt: { type: Date },
          },

          // Mentor evaluation
          mentorComments: { type: String },
          mentorScore: { type: Number, min: 0, max: 10 },
          mentorEvaluatedAt: { type: Date },
          mentorEvaluatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },

          // Status for approval workflow
          status: {
            type: String,
            enum: ["draft", "submitted", "mentor_approved"],
            default: "draft",
          },

          submittedAt: { type: Date, default: Date.now },
          submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
      ],

      summary: {
        totalWeeks: { type: Number },
        moduleCompletion: {
          total: { type: Number },
          completed: { type: Number },
          percentage: { type: Number, min: 0, max: 100 },
        },
        overallProgress: {
          type: String,
          enum: ["Poor", "Average", "Good", "Excellent"],
        },
        estimatedCompletion: { type: Date },
        mentorRemarks: { type: String },
      },
    },

    // PDF Document Uploads - for documents beyond forms
    pdfDocuments: {
      projectPPT: {
        originalName: { type: String },
        filename: { type: String },
        path: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: [
            "draft",
            "submitted",
            "mentor_approved",
            "admin_approved",
            "rejected",
          ],
          default: "draft",
        },
        mentorApproval: { type: Boolean, default: false },
        mentorApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        mentorApprovedAt: { type: Date },
        adminApproval: { type: Boolean, default: false },
        adminApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        adminApprovedAt: { type: Date },
        rejectionReason: { type: String },
      },
      funcReq: {
        originalName: { type: String },
        filename: { type: String },
        path: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: [
            "draft",
            "submitted",
            "mentor_approved",
            "admin_approved",
            "rejected",
          ],
          default: "draft",
        },
        mentorApproval: { type: Boolean, default: false },
        mentorApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        mentorApprovedAt: { type: Date },
        adminApproval: { type: Boolean, default: false },
        adminApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        adminApprovedAt: { type: Date },
        rejectionReason: { type: String },
      },
      srs: {
        originalName: { type: String },
        filename: { type: String },
        path: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: [
            "draft",
            "submitted",
            "mentor_approved",
            "admin_approved",
            "rejected",
          ],
          default: "draft",
        },
        mentorApproval: { type: Boolean, default: false },
        mentorApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        mentorApprovedAt: { type: Date },
        adminApproval: { type: Boolean, default: false },
        adminApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        adminApprovedAt: { type: Date },
        rejectionReason: { type: String },
      },
      projectReport: {
        originalName: { type: String },
        filename: { type: String },
        path: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: [
            "draft",
            "submitted",
            "mentor_approved",
            "admin_approved",
            "rejected",
          ],
          default: "draft",
        },
        mentorApproval: { type: Boolean, default: false },
        mentorApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        mentorApprovedAt: { type: Date },
        adminApproval: { type: Boolean, default: false },
        adminApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        adminApprovedAt: { type: Date },
        rejectionReason: { type: String },
      },
      projectManual: {
        originalName: { type: String },
        filename: { type: String },
        path: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: [
            "draft",
            "submitted",
            "mentor_approved",
            "admin_approved",
            "rejected",
          ],
          default: "draft",
        },
        mentorApproval: { type: Boolean, default: false },
        mentorApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        mentorApprovedAt: { type: Date },
        adminApproval: { type: Boolean, default: false },
        adminApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        adminApprovedAt: { type: Date },
        rejectionReason: { type: String },
      },
      projectCode_final: {
        originalName: { type: String },
        filename: { type: String },
        path: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: [
            "draft",
            "submitted",
            "mentor_approved",
            "admin_approved",
            "rejected",
          ],
          default: "draft",
        },
        mentorApproval: { type: Boolean, default: false },
        mentorApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        mentorApprovedAt: { type: Date },
        adminApproval: { type: Boolean, default: false },
        adminApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        adminApprovedAt: { type: Date },
        rejectionReason: { type: String },
      },
      projectPPT_final: {
        originalName: { type: String },
        filename: { type: String },
        path: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: [
            "draft",
            "submitted",
            "mentor_approved",
            "admin_approved",
            "rejected",
          ],
          default: "draft",
        },
        mentorApproval: { type: Boolean, default: false },
        mentorApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        mentorApprovedAt: { type: Date },
        adminApproval: { type: Boolean, default: false },
        adminApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        adminApprovedAt: { type: Date },
        rejectionReason: { type: String },
      },
      mentorApprovalLetter: {
        originalName: { type: String },
        filename: { type: String },
        path: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: [
            "draft",
            "submitted",
            "mentor_approved",
            "admin_approved",
            "rejected",
          ],
          default: "draft",
        },
        mentorApproval: { type: Boolean, default: false },
        mentorApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        mentorApprovedAt: { type: Date },
        adminApproval: { type: Boolean, default: false },
        adminApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        adminApprovedAt: { type: Date },
        rejectionReason: { type: String },
      },
    },

    // Project Timeline Management
    projectTimeline: {
      startDate: {
        type: Date,
        default: null,
        index: true,
      },
      endDate: {
        type: Date,
        default: null,
      },
      assignedAt: {
        type: Date,
        default: null,
      },
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      isAutoAssigned: {
        type: Boolean,
        default: false,
      },
      weekDuration: {
        type: Number,
        default: 12, // Default 12-week project
        min: 1,
        max: 52,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

teamSchema.index({ batch: 1, department: 1 });
teamSchema.index({ "mentor.assigned": 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ "members.student": 1 });
teamSchema.index({ status: 1 });
teamSchema.index({ createdAt: -1 });
teamSchema.index({ "projectAbstract.status": 1 });
teamSchema.index({ "roleSpecification.status": 1 });
teamSchema.index({ "projectTimeline.assignedAt": 1 });

teamSchema.pre("save", function (next) {
  if (this.members.length > 3) {
    return next(new Error("A team cannot have more than 3 members."));
  }

  const memberIds = this.members.map((m) => m.student.toString());
  const uniqueIds = [...new Set(memberIds)];
  if (memberIds.length !== uniqueIds.length) {
    return next(new Error("Duplicate members are not allowed."));
  }

  if (memberIds.includes(this.leader.toString())) {
    return next(new Error("Team leader cannot also be a member."));
  }

  next();
});

teamSchema.virtual("teamSize").get(function () {
  return this.members.length + 1;
});

teamSchema.virtual("averageWeeklyScore").get(function () {
  const scores = this.evaluation?.weeklyStatus?.map((w) => w.mentorScore) || [];
  if (scores.length === 0) return 0;
  return scores.reduce((acc, score) => acc + score, 0) / scores.length;
});

teamSchema.virtual("completionPercentage").get(function () {
  const summary = this.evaluation?.summary;
  if (!summary?.moduleCompletion) return 0;
  return summary.moduleCompletion.percentage || 0;
});

teamSchema.virtual("isFormComplete").get(function () {
  return {
    projectAbstract: [
      "submitted",
      "mentor_approved",
      "admin_approved",
    ].includes(this.projectAbstract?.status),
    roleSpecification: [
      "submitted",
      "mentor_approved",
      "admin_approved",
    ].includes(this.roleSpecification?.status),
    hasWeeklyStatus: (this.evaluation?.weeklyStatus?.length || 0) > 0,
  };
});

// Virtual for checking if team meets criteria for project timeline assignment
teamSchema.virtual("meetsTimelineAssignmentCriteria").get(function () {
  return (
    this.status === "approved" &&
    this.mentor?.assigned &&
    !this.projectTimeline?.startDate
  );
});

// Virtual for checking if team can access weekly status
teamSchema.virtual("canAccessWeeklyStatus").get(function () {
  return Boolean(this.projectTimeline?.startDate);
});

// Virtual for current project week
teamSchema.virtual("currentProjectWeek").get(function () {
  if (!this.projectTimeline?.startDate) return 0;

  const now = new Date();
  const start = new Date(this.projectTimeline.startDate);
  const diffTime = Math.abs(now - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.ceil(diffDays / 7);

  return weekNumber > 0 ? weekNumber : 1;
});

// Virtual for project progress percentage based on timeline
teamSchema.virtual("timelineProgressPercentage").get(function () {
  if (!this.projectTimeline?.startDate || !this.projectTimeline?.weekDuration)
    return 0;

  const currentWeek = this.currentProjectWeek;
  const totalWeeks = this.projectTimeline.weekDuration;

  return Math.min(Math.round((currentWeek / totalWeeks) * 100), 100);
});

// Method to assign project timeline
teamSchema.methods.assignProjectTimeline = function (
  startDate,
  duration = 12,
  assignedBy = null,
  isAutoAssigned = false
) {
  this.projectTimeline = {
    startDate: new Date(startDate),
    endDate: new Date(
      new Date(startDate).getTime() + duration * 7 * 24 * 60 * 60 * 1000
    ), // duration in weeks
    assignedAt: new Date(),
    assignedBy: assignedBy,
    isAutoAssigned: isAutoAssigned,
    weekDuration: duration,
  };

  return this.save();
};

// Method to check if team meets auto-assignment criteria
teamSchema.methods.checkAutoAssignmentEligibility = function () {
  return (
    this.status === "approved" &&
    this.mentor?.assigned &&
    !this.projectTimeline?.startDate
  );
};

// Static method to find teams eligible for auto-assignment
teamSchema.statics.findEligibleForAutoAssignment = function () {
  return this.find({
    status: "approved",
    "mentor.assigned": { $exists: true, $ne: null },
    "projectTimeline.startDate": { $exists: false },
  });
};

// Static method to auto-assign timeline to eligible teams
teamSchema.statics.autoAssignTimeline = async function (
  globalStartDate,
  duration = 12,
  assignedBy = null
) {
  const eligibleTeams = await this.findEligibleForAutoAssignment();

  const results = [];
  for (const team of eligibleTeams) {
    try {
      await team.assignProjectTimeline(
        globalStartDate,
        duration,
        assignedBy,
        true
      );
      results.push({ teamId: team._id, status: "success" });
    } catch (error) {
      results.push({ teamId: team._id, status: "error", error: error.message });
    }
  }

  return results;
};

teamSchema.methods.addWeeklyStatus = function (weekData, studentId) {
  if (!this.evaluation) {
    this.evaluation = { weeklyStatus: [] };
  }
  if (!this.evaluation.weeklyStatus) {
    this.evaluation.weeklyStatus = [];
  }

  const weekEntry = {
    ...weekData,
    submittedBy: studentId,
    submittedAt: new Date(),
  };

  this.evaluation.weeklyStatus.push(weekEntry);
  return this.save();
};

teamSchema.methods.updateProjectProgress = function () {
  if (!this.evaluation?.weeklyStatus?.length) return;

  const totalModules = this.projectAbstract?.modules?.length || 1;
  // Since status field is removed, we'll calculate based on total activities
  const totalActivities =
    this.roleSpecification?.assignments?.reduce((acc, assignment) => {
      return acc + (assignment.activities?.length || 0);
    }, 0) || 1;

  // For now, we'll use a simple calculation based on weekly status submissions
  const weeklyProgress = this.evaluation.weeklyStatus.length;
  const estimatedWeeks = 12; // Assuming a 12-week project

  if (!this.evaluation.summary) {
    this.evaluation.summary = {};
  }

  this.evaluation.summary.moduleCompletion = {
    total: totalModules,
    completed: Math.floor((weeklyProgress / estimatedWeeks) * totalModules),
    percentage: Math.round((weeklyProgress / estimatedWeeks) * 100),
  };

  this.evaluation.summary.lastUpdated = new Date();
};

teamSchema.statics.findByCode = function (code) {
  return this.findOne({ code: code.toUpperCase() });
};

teamSchema.statics.findByMentor = function (mentorId) {
  return this.find({ "mentor.assigned": mentorId });
};

teamSchema.statics.getTeamStats = function (filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalTeams: { $sum: 1 },
        pendingTeams: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        approvedTeams: {
          $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
        },
        rejectedTeams: {
          $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
        },
        avgTeamSize: { $avg: { $add: [{ $size: "$members" }, 1] } },
      },
    },
  ];

  return this.aggregate(pipeline);
};

module.exports = mongoose.model("Team", teamSchema);
