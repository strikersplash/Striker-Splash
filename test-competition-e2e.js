#!/usr/bin/env node

const axios = require("axios");

const BASE_URL = "http://localhost:3000";

// Test session storage
let cookies = "";

async function login() {
  try {
    console.log("🔐 Logging in as admin...");

    // First get the login page to get any CSRF tokens
    const loginPageResponse = await axios.get(`${BASE_URL}/auth/login`);

    // Extract cookies
    if (loginPageResponse.headers["set-cookie"]) {
      cookies = loginPageResponse.headers["set-cookie"]
        .map((cookie) => cookie.split(";")[0])
        .join("; ");
    }

    const loginResponse = await axios.post(
      `${BASE_URL}/auth/login`,
      {
        username: "admin",
        password: "admin123",
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: cookies,
        },
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 400; // Accept redirects as success
        },
      }
    );

    // Update cookies
    if (loginResponse.headers["set-cookie"]) {
      cookies = loginResponse.headers["set-cookie"]
        .map((cookie) => cookie.split(";")[0])
        .join("; ");
    }

    console.log("✅ Login successful");
    return true;
  } catch (error) {
    console.error(
      "❌ Login failed:",
      error.response?.status,
      error.response?.statusText
    );
    return false;
  }
}

async function testCompetitionQueue() {
  try {
    console.log("📋 Testing competition queue...");

    const response = await axios.get(
      `${BASE_URL}/staff/competition-setup/queue`,
      {
        headers: {
          Cookie: cookies,
        },
      }
    );

    console.log("✅ Competition queue response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Competition queue failed:",
      error.response?.status,
      error.response?.data
    );
    return null;
  }
}

async function createIndividualCompetition() {
  try {
    console.log("🏃 Creating individual competition...");

    const competitionData = {
      name: "Test Individual Competition",
      type: "individual",
      cost: 5.0,
      kicks_per_player: 10,
      description: "Test individual competition",
      participants: [1, 2, 3], // Assuming these player IDs exist
    };

    const response = await axios.post(
      `${BASE_URL}/staff/competition-setup/create`,
      competitionData,
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies,
        },
      }
    );

    console.log("✅ Individual competition created:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Individual competition creation failed:",
      error.response?.status,
      error.response?.data
    );
    return null;
  }
}

async function createTeamCompetition() {
  try {
    console.log("👥 Creating team competition...");

    // First, let's check what teams exist
    const teamsResponse = await axios.get(`${BASE_URL}/api/teams`, {
      headers: {
        Cookie: cookies,
      },
    });

    console.log("Available teams:", teamsResponse.data);

    const competitionData = {
      name: "Test Team Competition",
      type: "team",
      team_size: 5,
      cost: 25.0,
      kicks_per_player: 10,
      description: "Test team competition",
      teams: teamsResponse.data.teams
        ? teamsResponse.data.teams.slice(0, 2).map((t) => t.id)
        : [1, 2],
    };

    const response = await axios.post(
      `${BASE_URL}/staff/competition-setup/create`,
      competitionData,
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies,
        },
      }
    );

    console.log("✅ Team competition created:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Team competition creation failed:",
      error.response?.status,
      error.response?.data
    );
    return null;
  }
}

async function startCompetition(competitionId) {
  try {
    console.log(`🚀 Starting competition ${competitionId}...`);

    const response = await axios.post(
      `${BASE_URL}/staff/competition-setup/start/${competitionId}`,
      {},
      {
        headers: {
          Cookie: cookies,
        },
      }
    );

    console.log("✅ Competition started:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Competition start failed:",
      error.response?.status,
      error.response?.data
    );
    return null;
  }
}

async function runTests() {
  console.log("🧪 Starting Competition System End-to-End Test\n");

  // Test login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log("❌ Cannot proceed without login");
    return;
  }

  console.log("");

  // Test queue (initial state)
  console.log("1️⃣ TESTING INITIAL QUEUE STATE");
  const initialQueue = await testCompetitionQueue();
  console.log("");

  // Test individual competition creation
  console.log("2️⃣ TESTING INDIVIDUAL COMPETITION CREATION");
  const individualComp = await createIndividualCompetition();
  console.log("");

  // Test team competition creation
  console.log("3️⃣ TESTING TEAM COMPETITION CREATION");
  const teamComp = await createTeamCompetition();
  console.log("");

  // Test queue after creation
  console.log("4️⃣ TESTING QUEUE AFTER CREATION");
  const updatedQueue = await testCompetitionQueue();
  console.log("");

  // Test starting a competition
  if (
    updatedQueue &&
    updatedQueue.competitions &&
    updatedQueue.competitions.length > 0
  ) {
    console.log("5️⃣ TESTING COMPETITION START");
    const competitionToStart = updatedQueue.competitions[0];
    await startCompetition(competitionToStart.id);
    console.log("");

    // Test queue after starting
    console.log("6️⃣ TESTING QUEUE AFTER START");
    await testCompetitionQueue();
  }

  console.log("🏁 Test completed!");
}

// Run the tests
runTests().catch(console.error);
