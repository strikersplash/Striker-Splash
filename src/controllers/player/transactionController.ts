import { Request, Response } from "express";
import Player from "../../models/Player";
import Shot from "../../models/Shot";
import { generateQRHash, generateQRCode } from "../../services/qrService";
import { pool } from "../../config/db";

// Display transaction form
export const getTransactionForm = (req: Request, res: Response): void => {
  // Only allow staff to access this page
  if (!(req.session as any).user) {
    req.flash("error_msg", "Please log in to access this page");
    return res.redirect("/auth/login");
  }

  res.render("player/transaction", {
    title: "Sell Kicks",
    step: "registration",
  });
};

// Process player registration and payment
export const processTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow staff to access this page
    if (!(req.session as any).user) {
      req.flash("error_msg", "Please log in to access this page");
      return res.redirect("/auth/login");
    }

    const {
      name,
      phone,
      district,
      cityVillage,
      shotsQuantity,
      playerType,
      isChildAccount,
    } = req.body;

    // Validate input
    if (!name || !phone || !district || !cityVillage || !shotsQuantity) {
      req.flash(
        "error_msg",
        "Please fill in all fields including district and city/village"
      );
      return res.redirect("/player/transaction");
    }

    // Handle child registration logic
    const isChild = isChildAccount === "on" || isChildAccount === true;
    let actualPhone = phone;
    let parentPhone = null;

    if (isChild) {
      // For child accounts, the phone entered is the parent's phone
      parentPhone = phone;
      // Generate a unique phone identifier for the child
      // Check how many children this parent already has
      const existingChildren = await pool.query(
        "SELECT COUNT(*) as count FROM players WHERE parent_phone = $1",
        [parentPhone]
      );
      const childNumber = parseInt(existingChildren.rows[0].count) + 1;
      actualPhone = `${parentPhone}-C${childNumber}`;
    }

    // Calculate amount ($2 BZD per shot)
    const amount = parseInt(shotsQuantity) * 2;

    // Check if player already exists (by the actual phone that will be stored)
    let player = await Player.findByPhone(actualPhone);

    // If player doesn't exist, create new player
    if (!player) {
      // Generate QR hash
      const qrHash = generateQRHash();

      // Create new player with a dummy DOB (required by the model)
      const dummyDob = new Date("2000-01-01");

      // Determine age group based on player type
      let ageGroup = "Adults 31-50 years"; // Default
      if (playerType === "Up to 10 years") {
        ageGroup = "Up to 10 years";
      } else if (playerType === "Teens 11-17 years") {
        ageGroup = "Teens 11-17 years";
      } else if (playerType === "Young Adults 18-30 years") {
        ageGroup = "Young Adults 18-30 years";
      } else if (playerType === "Adults 31-50 years") {
        ageGroup = "Adults 31-50 years";
      } else if (playerType === "Seniors 51+ years") {
        ageGroup = "Seniors 51+ years";
      }

      player = await Player.create({
        name,
        phone: actualPhone,
        dob: dummyDob,
        residence: district,
        city_village: cityVillage,
        qr_hash: qrHash,
        age_group: ageGroup,
        is_child_account: isChild,
        parent_phone: parentPhone,
      });

      if (!player) {
        throw new Error("Failed to create player");
      }
    }

    // Create new shot transaction
    const shot = await Shot.create({
      player_id: player.id,
      amount,
      shots_quantity: shotsQuantity,
      payment_status: "completed", // In a real app, this would be set after payment confirmation
      payment_reference: `PAY-${Date.now()}`,
    });

    if (!shot) {
      throw new Error("Failed to create shot");
    }

    // Generate QR code
    const qrCodeBase64 = await generateQRCode(player.id, player.qr_hash);

    // Render confirmation page
    res.render("player/transaction", {
      title: "Sale Confirmation",
      step: "confirmation",
      player,
      shot,
      qrCodeBase64,
    });
  } catch (error) {
    console.error("Transaction error:", error);
    req.flash("error_msg", "An error occurred during sale processing");
    res.redirect("/player/transaction");
  }
};

// Display QR code
export const getQRCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.query;

    if (!phone) {
      req.flash("error_msg", "Phone number is required");
      return res.redirect("/player/transaction");
    }

    // Find player
    const player = await Player.findByPhone(phone as string);

    if (!player) {
      req.flash("error_msg", "Player not found");
      return res.redirect("/player/transaction");
    }

    // Get latest shot
    const shots = await Shot.find({ player_id: player.id });
    const shot = shots.length > 0 ? shots[0] : null;

    if (!shot) {
      req.flash("error_msg", "No kicks found for this player");
      return res.redirect("/player/transaction");
    }

    // Generate QR code
    const qrCodeBase64 = await generateQRCode(player.id, player.qr_hash);

    // Render QR code page
    res.render("player/transaction", {
      title: "Player QR Code",
      step: "qrcode",
      player,
      shot,
      qrCodeBase64,
    });
  } catch (error) {
    console.error("QR code error:", error);
    req.flash("error_msg", "An error occurred while retrieving QR code");
    res.redirect("/player/transaction");
  }
};

// Search players by name (API endpoint)
export const searchPlayers = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      return res.json([]);
    }

    // Search for players with similar names (excluding deleted players)
    const query =
      "SELECT name, phone, residence FROM players WHERE name ILIKE $1 AND deleted_at IS NULL LIMIT 10";
    const { rows } = await Player.query(query, [`%${name}%`]);

    res.json(rows);
  } catch (error) {
    console.error("Player search error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while searching for players" });
  }
};
