/**
 * TTL (Time To Live) Index Test for ProjectBank
 *
 * This script tests if rejected projects are automatically deleted after 2 days.
 *
 * To run this test:
 * 1. Make sure your MongoDB is running and MONGO_URI is set in environment
 * 2. Run: node test-ttl.js
 *
 * The TTL index should automatically delete documents where:
 * - rejectedAt field is not null
 * - rejectedAt date is older than 2 days (172800 seconds)
 */

const mongoose = require("mongoose");
const ProjectBank = require("../models/ProjectBank");
require("dotenv").config();

async function testTTL() {
  try {
    // Use the same database configuration as the main app
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.log("❌ MONGO_URI environment variable is not set");
      console.log("Please set MONGO_URI in your environment or .env file");
      return;
    }

    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // Check if the TTL index exists
    const indexes = await ProjectBank.collection.getIndexes();
    console.log("\n📋 Current indexes on ProjectBank collection:");
    Object.keys(indexes).forEach((indexName) => {
      const index = indexes[indexName];
      console.log(`- ${indexName}:`, index);

      // Check if this is our TTL index
      if (index.expireAfterSeconds) {
        console.log(
          `  ⏰ TTL Index found! Expires after ${
            index.expireAfterSeconds
          } seconds (${index.expireAfterSeconds / 3600} hours)`
        );
      }
    });

    // Check for expired projects that should have been deleted
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const expiredProjects = await ProjectBank.find({
      rejectedAt: { $lt: twoDaysAgo, $ne: null },
    });

    console.log(
      `\n🔍 Checking for projects rejected before: ${twoDaysAgo.toISOString()}`
    );

    if (expiredProjects.length > 0) {
      console.log(
        `❌ Found ${expiredProjects.length} expired projects that should have been auto-deleted:`
      );
      expiredProjects.forEach((project) => {
        const daysSinceRejection =
          (Date.now() - new Date(project.rejectedAt).getTime()) /
          (1000 * 60 * 60 * 24);
        console.log(
          `- "${project.title}" (rejected ${daysSinceRejection.toFixed(
            1
          )} days ago)`
        );
      });
      console.log(
        "\n💡 Note: MongoDB TTL background task runs every 60 seconds, so recently expired documents might still exist for up to 1 minute."
      );
    } else {
      console.log(
        "✅ No expired rejected projects found - TTL appears to be working correctly!"
      );
    }

    // Get statistics about all projects
    const allProjects = await ProjectBank.find(
      {},
      "title isApproved rejectedAt createdAt"
    );
    const approved = allProjects.filter((p) => p.isApproved).length;
    const rejected = allProjects.filter((p) => p.rejectedAt).length;
    const pending = allProjects.filter(
      (p) => !p.isApproved && !p.rejectedAt
    ).length;

    console.log(`\n📊 Project Statistics:`);
    console.log(`- Total projects: ${allProjects.length}`);
    console.log(`- Approved: ${approved}`);
    console.log(`- Rejected: ${rejected}`);
    console.log(`- Pending: ${pending}`);

    // Show recent rejected projects (within last 7 days)
    const recentRejected = allProjects.filter(
      (p) =>
        p.rejectedAt &&
        new Date(p.rejectedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    if (recentRejected.length > 0) {
      console.log(`\n📝 Recently rejected projects (last 7 days):`);
      recentRejected.forEach((project) => {
        const daysAgo =
          (Date.now() - new Date(project.rejectedAt).getTime()) /
          (1000 * 60 * 60 * 24);
        console.log(
          `- "${project.title}" (rejected ${daysAgo.toFixed(1)} days ago)`
        );
      });
    }
  } catch (error) {
    console.error("❌ Error testing TTL:", error.message);
    if (error.message.includes("ECONNREFUSED")) {
      console.log(
        "💡 Make sure MongoDB is running and the MONGO_URI is correct"
      );
    }
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

if (require.main === module) {
  testTTL();
}

module.exports = { testTTL };
