const mongoose = require("mongoose");

const projectBankSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    isApproved: { type: Boolean, default: false },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    maxTeams: { type: Number, default: 1, min: 1 },
    assignedTeams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
    feedback: [
      {
        message: { type: String, default: "" },
        byUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
      },
    ],
    rejectedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
projectBankSchema.index({ category: 1 });
projectBankSchema.index({ isApproved: 1 });
// TTL index: Delete rejected projects after 2 days (172800 seconds)
projectBankSchema.index(
  { rejectedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 2 }
);

// ✅ Dynamic virtual
projectBankSchema.virtual("isAvailable").get(function () {
  return this.isApproved && this.assignedTeams.length < this.maxTeams;
});

projectBankSchema.virtual("assignedTeamCount").get(function () {
  return this.assignedTeams ? this.assignedTeams.length : 0;
});

projectBankSchema.pre("save", function (next) {
  if (this.assignedTeams.length > this.maxTeams) {
    return next(
      new Error(
        `Cannot assign more than ${this.maxTeams} teams to this project`
      )
    );
  }
  next();
});

module.exports = mongoose.model("ProjectBank", projectBankSchema);
