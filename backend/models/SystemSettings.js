const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    // Global Project Timeline Settings
    projectTimeline: {
      globalStartDate: {
        type: Date,
        default: null,
      },
      autoAssignEnabled: {
        type: Boolean,
        default: false,
      },
      defaultProjectDuration: {
        type: Number,
        default: 12, // weeks
        min: 1,
        max: 52,
      },
      enabledAt: {
        type: Date,
        default: null,
      },
      enabledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    // Academic Calendar Settings
    academicCalendar: {
      currentSemester: {
        type: String,
        enum: ["Spring", "Summer", "Fall"],
        default: "Fall",
      },
      currentYear: {
        type: Number,
        default: new Date().getFullYear(),
      },
      semesterStartDate: {
        type: Date,
        default: null,
      },
      semesterEndDate: {
        type: Date,
        default: null,
      },
    },

    // System Metadata
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    version: {
      type: String,
      default: "1.0.0",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure only one document exists (singleton pattern)
systemSettingsSchema.index({}, { unique: true });

// Virtual for checking if auto-assignment is active
systemSettingsSchema.virtual("isAutoAssignmentActive").get(function () {
  return (
    this.projectTimeline.autoAssignEnabled &&
    this.projectTimeline.globalStartDate
  );
});

// Static method to get or create settings
systemSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Method to update project timeline settings
systemSettingsSchema.methods.updateProjectTimeline = function (
  updates,
  userId
) {
  if (updates.globalStartDate) {
    this.projectTimeline.globalStartDate = updates.globalStartDate;
  }
  if (typeof updates.autoAssignEnabled === "boolean") {
    this.projectTimeline.autoAssignEnabled = updates.autoAssignEnabled;
  }
  if (updates.defaultProjectDuration) {
    this.projectTimeline.defaultProjectDuration =
      updates.defaultProjectDuration;
  }

  this.projectTimeline.enabledAt = new Date();
  this.projectTimeline.enabledBy = userId;
  this.lastUpdatedBy = userId;

  return this.save();
};

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
