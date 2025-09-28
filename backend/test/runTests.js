#!/usr/bin/env node

/**
 * PAMS Backend Test Runner
 *
 * This script provides a simple interface to run various tests and utilities.
 *
 * Usage:
 *   node test/runTests.js [command]
 *
 * Commands:
 *   dummy    - Generate dummy data for testing
 *   ttl      - Test TTL index functionality
 *   all      - Run all tests
 *   help     - Show this help message
 */

const { spawn } = require("child_process");
const path = require("path");

// ANSI color codes for better output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runScript(scriptName, description) {
  return new Promise((resolve, reject) => {
    log(`\n${"=".repeat(60)}`, "cyan");
    log(`🚀 Running: ${description}`, "bright");
    log(`${"=".repeat(60)}`, "cyan");

    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn("node", [scriptPath], {
      stdio: "inherit",
      cwd: path.dirname(__dirname), // Run from backend directory
    });

    child.on("close", (code) => {
      if (code === 0) {
        log(`\n✅ ${description} completed successfully`, "green");
        resolve();
      } else {
        log(`\n❌ ${description} failed with exit code ${code}`, "red");
        reject(new Error(`Script ${scriptName} failed`));
      }
    });

    child.on("error", (error) => {
      log(`\n❌ Error running ${description}: ${error.message}`, "red");
      reject(error);
    });
  });
}

async function runDummyData() {
  await runScript("dummyData.js", "Dummy Data Generation");
}

async function runTTLTest() {
  await runScript("test-ttl.js", "TTL Index Test");
}

async function runAllTests() {
  try {
    log("🎯 Running all PAMS backend tests...", "bright");

    await runDummyData();

    // Add a small delay before TTL test to let the data settle
    log("\n⏳ Waiting 2 seconds before TTL test...", "yellow");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await runTTLTest();

    log("\n🎉 All tests completed successfully!", "green");
  } catch (error) {
    log(`\n💥 Test suite failed: ${error.message}`, "red");
    process.exit(1);
  }
}

function showHelp() {
  log("PAMS Backend Test Runner", "bright");
  log("========================", "bright");
  log("");
  log("Usage: node test/runTests.js [command]", "cyan");
  log("");
  log("Commands:", "yellow");
  log("  dummy    - Generate comprehensive dummy data for testing", "white");
  log("  ttl      - Test TTL index functionality for project cleanup", "white");
  log("  all      - Run all tests (recommended)", "white");
  log("  help     - Show this help message", "white");
  log("");
  log("Examples:", "yellow");
  log("  node test/runTests.js dummy", "cyan");
  log("  node test/runTests.js ttl", "cyan");
  log("  node test/runTests.js all", "cyan");
  log("");
  log("Prerequisites:", "yellow");
  log("  - MongoDB must be running", "white");
  log("  - MONGO_URI must be set in environment or .env file", "white");
  log("");
  log("Generated Data:", "yellow");
  log("  - 2 admin users (admin, dev)", "white");
  log("  - 15 students with proper roll numbers", "white");
  log("  - 5 mentors (1 sub-admin)", "white");
  log("  - 5 teams with complete project data", "white");
  log("  - 8 projects in project bank", "white");
  log("  - Weekly status updates and evaluations", "white");
  log("  - System settings configuration", "white");
}

async function main() {
  const command = process.argv[2] || "help";

  try {
    switch (command.toLowerCase()) {
      case "dummy":
        await runDummyData();
        break;

      case "ttl":
        await runTTLTest();
        break;

      case "all":
        await runAllTests();
        break;

      case "help":
      case "--help":
      case "-h":
        showHelp();
        break;

      default:
        log(`❌ Unknown command: ${command}`, "red");
        log(
          'Use "node test/runTests.js help" for available commands',
          "yellow"
        );
        process.exit(1);
    }
  } catch (error) {
    log(`💥 Fatal error: ${error.message}`, "red");
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  runDummyData,
  runTTLTest,
  runAllTests,
};
