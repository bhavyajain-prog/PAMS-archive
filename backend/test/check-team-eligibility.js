// Temporary script to check why team GQ42WU is not eligible
// Run with: node backend/test/check-team-eligibility.js

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Team = require("../models/Team");
const User = require("../models/User");
const ProjectBank = require("../models/ProjectBank");

async function checkTeamEligibility() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const teamCode = "GQ42WU";

    // Fetch the team
    const team = await Team.findOne({ code: teamCode })
      .populate("leader", "name email studentData.rollNumber")
      .populate("members.student", "name email studentData.rollNumber")
      .populate("mentor.assigned", "name email mentorData.department")
      .populate("finalProject", "title description category");

    if (!team) {
      console.log(`❌ Team ${teamCode} not found!`);
      process.exit(1);
    }

    console.log("📋 TEAM DETAILS:");
    console.log("================");
    console.log(`Team Code: ${team.code}`);
    console.log(`Team Status: ${team.status}`);
    console.log(`Leader: ${team.leader?.name || "N/A"}`);
    console.log(`Members Count: ${team.members?.length || 0}`);
    console.log("\n");

    // Check eligibility criteria
    console.log("🔍 ELIGIBILITY CRITERIA CHECK:");
    console.log("================================");

    // Criteria 1: Status = "approved"
    const statusCheck = team.status === "approved";
    console.log(
      `1. Status is "approved": ${statusCheck ? "✅" : "❌"} (Current: "${
        team.status
      }")`
    );

    // Criteria 2: finalProject exists and is not null
    const finalProjectCheck = team.finalProject != null;
    console.log(
      `2. Has finalProject assigned: ${finalProjectCheck ? "✅" : "❌"}`
    );
    if (team.finalProject) {
      console.log(`   → Project: ${team.finalProject.title || "Unknown"}`);
    } else {
      console.log(`   → finalProject value: ${team.finalProject}`);
    }

    // Criteria 3: mentor.assigned exists and is not null
    const mentorCheck = team.mentor?.assigned != null;
    console.log(`3. Has mentor assigned: ${mentorCheck ? "✅" : "❌"}`);
    if (team.mentor?.assigned) {
      console.log(`   → Mentor: ${team.mentor.assigned.name || "Unknown"}`);
    } else {
      console.log(`   → mentor.assigned value: ${team.mentor?.assigned}`);
    }

    // Criteria 4: projectTimeline.startDate does NOT exist
    const timelineCheck = !team.projectTimeline?.startDate;
    console.log(
      `4. Does NOT have startDate yet: ${timelineCheck ? "✅" : "❌"}`
    );
    if (team.projectTimeline?.startDate) {
      console.log(`   → Start Date: ${team.projectTimeline.startDate}`);
    } else {
      console.log(
        `   → projectTimeline.startDate: ${
          team.projectTimeline?.startDate || "undefined"
        }`
      );
    }

    console.log("\n");

    // Overall eligibility
    const isEligible =
      statusCheck && finalProjectCheck && mentorCheck && timelineCheck;
    console.log("📊 OVERALL RESULT:");
    console.log("==================");
    console.log(
      `Team ${teamCode} is ${
        isEligible ? "✅ ELIGIBLE" : "❌ NOT ELIGIBLE"
      } for timeline assignment`
    );

    if (!isEligible) {
      console.log("\n❌ FAILED CRITERIA:");
      if (!statusCheck) console.log('   - Team status is not "approved"');
      if (!finalProjectCheck) console.log("   - No final project assigned");
      if (!mentorCheck) console.log("   - No mentor assigned");
      if (!timelineCheck) console.log("   - Already has a start date");
    }

    console.log("\n");
    console.log("📦 RAW TEAM DATA:");
    console.log("==================");
    console.log(
      JSON.stringify(
        {
          code: team.code,
          status: team.status,
          finalProject: team.finalProject?._id || null,
          mentor: {
            assigned: team.mentor?.assigned?._id || null,
          },
          projectTimeline: team.projectTimeline || null,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  }
}

checkTeamEligibility();
