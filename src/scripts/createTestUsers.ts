import mongoose from "mongoose";
import dotenv from "dotenv";
import Staff from "../models/Staff";
import Player from "../models/Player";
import Shot from "../models/Shot";
import GameStat from "../models/GameStat";
import { generateQRHash } from "../services/qrService";

// Load environment variables
dotenv.config();

// Connect to database
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/striker_splash";

const createTestUsers = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Create admin user
    const adminExists = await Staff.findOne({ username: "admin" });
    if (!adminExists) {
      const admin = new Staff({
        username: "admin",
        password: "admin123",
        name: "Administrator",
        role: "admin",
      });
      await admin.save();
      }

    // Create staff user
    const staffExists = await Staff.findOne({ username: "staff" });
    if (!staffExists) {
      const staff = new Staff({
        username: "staff",
        password: "staff123",
        name: "Staff Member",
        role: "staff",
      });
      await staff.save();
      }

    // Create test players
    const players = [
      {
        name: "John Doe",
        phone: "07700900001",
        dob: new Date("1990-01-15"),
        residence: "London",
        qrHash: generateQRHash(),
        ageGroup: "Adults 31-50 years",
      },
      {
        name: "Jane Smith",
        phone: "07700900002",
        dob: new Date("2010-05-20"),
        residence: "Manchester",
        qrHash: generateQRHash(),
        ageGroup: "Teens 11-17 years",
      },
      {
        name: "Billy Kid",
        phone: "07700900003",
        dob: new Date("2015-11-10"),
        residence: "Birmingham",
        qrHash: generateQRHash(),
        ageGroup: "Up to 10 years",
      },
    ];

    for (const playerData of players) {
      const playerExists = await Player.findOne({ phone: playerData.phone });
      if (!playerExists) {
        const player = new Player(playerData);
        await player.save();

        // Create shots for this player
        const shot = new Shot({
          player: player._id,
          amount: 10,
          shotsQuantity: 5,
          paymentStatus: "completed",
          paymentReference: `TEST-${Date.now()}`,
        });
        await shot.save();

        // Create some game stats
        if (playerData.name === "John Doe") {
          const staffMember = await Staff.findOne();
          if (staffMember) {
            const gameStat1 = new GameStat({
              player: player._id,
              goals: 3,
              staffMember: staffMember._id,
              location: "London Event",
            });
            await gameStat1.save();

            const gameStat2 = new GameStat({
              player: player._id,
              goals: 2,
              staffMember: staffMember._id,
              location: "Manchester Event",
            });
            await gameStat2.save();
          }
        }

        }
    }

    process.exit(0);
  } catch (error) {
    console.error("Error creating test users:", error);
    process.exit(1);
  }
};

createTestUsers();
