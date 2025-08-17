import { Request, Response } from "express";
import { pool } from "../../config/db";

// Display leaderboard page
export const getLeaderboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get filter parameters
    const { gender, ageGroup, residence, timeRange, sortBy, type } = req.query;

    console.log("Leaderboard filters:", {
      gender,
      ageGroup,
      residence,
      timeRange,
      sortBy,
      type,
    });

    let leaderboard = [];
    let teamLeaderboard = [];

    // Always fetch both individual and team data
    const filterObj = {
      gender: gender as string,
      ageGroup: ageGroup as string,
      residence: residence as string,
      timeRange: timeRange as string,
      sortBy: sortBy as string,
    };

    console.log("Filter object being passed to functions:", filterObj);

    console.log("Fetching individual leaderboard...");
    leaderboard = await getIndividualLeaderboard(filterObj);
    console.log(
      `Individual leaderboard fetched: ${leaderboard.length} entries`
    );

    console.log("Fetching team leaderboard...");
    teamLeaderboard = await getTeamLeaderboard(filterObj);
    console.log(`Team leaderboard fetched: ${teamLeaderboard.length} entries`);

    // Let's log some team data details
    if (teamLeaderboard.length > 0) {
      console.log(
        "Sample team leaderboard data:",
        JSON.stringify(teamLeaderboard[0], null, 2)
      );

      // Calculate and log total goals across all teams
      const totalTeamGoals = teamLeaderboard.reduce(
        (sum, team) => sum + Number(team.total_goals || 0),
        0
      );
      const totalTeamAttempts = teamLeaderboard.reduce(
        (sum, team) => sum + Number(team.total_attempts || 0),
        0
      );

      console.log(`Total goals across all teams: ${totalTeamGoals}`);
      console.log(`Total attempts across all teams: ${totalTeamAttempts}`);
    } else {
      console.log("No team data available");
    }

    // Get age brackets for filter dropdown using dynamic calculation
    const ageBracketsResult = await pool.query(`
      SELECT DISTINCT 
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 10 THEN 'Up to 10 years'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 17 THEN 'Teens 11-17 years'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 30 THEN 'Young Adults 18-30 years'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 50 THEN 'Adults 31-50 years'
          ELSE 'Seniors 51+ years'
        END as name,
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 10 THEN 1
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 17 THEN 2
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 30 THEN 3
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 50 THEN 4
          ELSE 5
        END as sort_order
      FROM players p
      WHERE p.dob IS NOT NULL
      ORDER BY sort_order
    `);

    res.render("leaderboard/index", {
      title: "Leaderboard",
      leaderboard,
      teamLeaderboard,
      ageBrackets: ageBracketsResult.rows,
      filters: {
        gender: gender || "",
        ageGroup: ageGroup || "",
        residence: residence || "",
        timeRange: timeRange || "",
        sortBy: sortBy || "goals",
        type: type || "individual",
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).render("system/error", {
      title: "Server Error",
      code: 500,
      message: "Failed to load leaderboard",
    });
  }
};

async function getIndividualLeaderboard(filters: any): Promise<any[]> {
  console.log("Individual leaderboard function called with filters:", filters);

  // Build query with filters for individual leaderboard
  let query = `
      SELECT 
        p.id,
        p.name,
        p.residence,
        p.city_village,
        p.gender,
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 10 THEN 'Up to 10 years'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 17 THEN 'Teens 11-17 years'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 30 THEN 'Young Adults 18-30 years'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 50 THEN 'Adults 31-50 years'
          ELSE 'Seniors 51+ years'
        END as age_group,
        SUM(gs.goals) as total_goals,
        COUNT(gs.id) * 5 as total_attempts,
        COALESCE(MAX(gs.consecutive_kicks), 0) as best_streak,
        STRING_AGG(DISTINCT s.name, ', ') as referees
      FROM 
        game_stats gs
      JOIN 
        players p ON gs.player_id = p.id
      JOIN
        staff s ON gs.staff_id = s.id
      LEFT JOIN
        queue_tickets qt ON gs.queue_ticket_id = qt.id
      WHERE 
        ((qt.status = 'played' AND qt.official = TRUE) OR gs.competition_type = 'custom_competition')
    `;

  const params: any[] = [];
  let paramIndex = 1;

  // Filtering is now handled in the main WHERE clause above

  if (filters.gender && filters.gender !== "all" && filters.gender !== "") {
    console.log("Adding gender filter:", filters.gender);
    query += ` AND p.gender = $${paramIndex}`;
    params.push(filters.gender);
    paramIndex++;
  }

  if (
    filters.ageGroup &&
    filters.ageGroup !== "all" &&
    filters.ageGroup !== ""
  ) {
    console.log("Adding age group filter:", filters.ageGroup);
    query += ` AND (CASE 
      WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 10 THEN 'Up to 10 years'
      WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 17 THEN 'Teens 11-17 years'
      WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 30 THEN 'Young Adults 18-30 years'
      WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.dob)) <= 50 THEN 'Adults 31-50 years'
      ELSE 'Seniors 51+ years'
    END) = $${paramIndex}`;
    params.push(filters.ageGroup);
    paramIndex++;
  }

  if (
    filters.residence &&
    filters.residence !== "all" &&
    filters.residence !== ""
  ) {
    console.log("Adding residence filter:", filters.residence);
    query += ` AND (p.residence ILIKE $${paramIndex} OR p.city_village ILIKE $${paramIndex})`;
    params.push(`%${filters.residence}%`);
    paramIndex++;
  }

  // Add time range filter
  if (
    filters.timeRange &&
    filters.timeRange !== "all" &&
    filters.timeRange !== ""
  ) {
    const now = new Date();
    let startDate: Date;

    switch (filters.timeRange) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    query += ` AND gs.timestamp >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  query += `
      GROUP BY p.id, p.name, p.residence, p.city_village, p.gender, p.dob
      HAVING SUM(gs.goals) > 0
    `;

  // Add sorting
  if (filters.sortBy === "streak") {
    query += ` ORDER BY best_streak DESC, total_goals DESC`;
  } else {
    query += ` ORDER BY total_goals DESC, best_streak DESC`;
  }

  query += ` LIMIT 100`;

  console.log("Individual leaderboard final query:", query);
  console.log("Individual leaderboard query params:", params);

  try {
    const result = await pool.query(query, params);
    console.log(
      `Individual leaderboard query returned ${result.rows.length} rows`
    );
    if (result.rows.length > 0) {
      console.log("Sample individual leaderboard result:", result.rows[0]);
      console.log("All individual results:");
      result.rows.forEach((row, index) => {
        console.log(
          `${index + 1}. ${row.name} (${row.gender}) - ${row.total_goals} goals`
        );
      });
    }
    return result.rows;
  } catch (error) {
    console.error("Error executing individual leaderboard query:", error);
    return [];
  }
}

async function getTeamLeaderboard(filters: any): Promise<any[]> {
  // Use team_stats table, but avoid double counting by prioritizing specific competition records
  let query = `
    WITH team_activity AS (
      -- Calculate team totals from team_stats, avoiding double-counting
      -- by prioritizing specific competition records over global ones
      SELECT
        ts.team_id,
        SUM(ts.total_goals) as goals,
        SUM(ts.total_attempts) as attempts,
        MAX(ts.last_updated) as last_activity
      FROM team_stats ts
      WHERE ts.competition_id IS NOT NULL  -- Only count specific competition records
      GROUP BY ts.team_id
    )
    
    SELECT 
      t.id,
      t.name,
      t.slug,
      t.team_size,
      COUNT(DISTINCT tm.player_id) as member_count,
      COALESCE(ta.goals, 0) as total_goals,
      COALESCE(ta.attempts, 0) as total_attempts,
      ta.last_activity
    FROM teams t
    LEFT JOIN team_members tm ON tm.team_id = t.id
    LEFT JOIN players p ON p.id = tm.player_id
    LEFT JOIN team_activity ta ON ta.team_id = t.id
  `;

  const params: any[] = [];
  let paramIndex = 1;
  let whereClause = "";

  // Add filters if needed
  if (filters.gender && filters.gender !== "all" && filters.gender !== "") {
    whereClause +=
      (whereClause ? " AND " : " WHERE ") +
      `EXISTS (
        SELECT 1 FROM team_members tm2 
        JOIN players p2 ON p2.id = tm2.player_id 
        WHERE tm2.team_id = t.id AND p2.gender = $${paramIndex}
      )`;
    params.push(filters.gender);
    paramIndex++;
  }

  if (
    filters.ageGroup &&
    filters.ageGroup !== "all" &&
    filters.ageGroup !== ""
  ) {
    whereClause +=
      (whereClause ? " AND " : " WHERE ") +
      `EXISTS (
        SELECT 1 FROM team_members tm2 
        JOIN players p2 ON p2.id = tm2.player_id 
        WHERE tm2.team_id = t.id AND (CASE 
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p2.dob)) <= 10 THEN 'Up to 10 years'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p2.dob)) <= 17 THEN 'Teens 11-17 years'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p2.dob)) <= 30 THEN 'Young Adults 18-30 years'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p2.dob)) <= 50 THEN 'Adults 31-50 years'
          ELSE 'Seniors 51+ years'
        END) = $${paramIndex}
      )`;
    params.push(filters.ageGroup);
    paramIndex++;
  }

  if (
    filters.residence &&
    filters.residence !== "all" &&
    filters.residence !== ""
  ) {
    whereClause +=
      (whereClause ? " AND " : " WHERE ") +
      `EXISTS (
        SELECT 1 FROM team_members tm2 
        JOIN players p2 ON p2.id = tm2.player_id 
        WHERE tm2.team_id = t.id AND (p2.residence ILIKE $${paramIndex} OR p2.city_village ILIKE $${paramIndex})
      )`;
    params.push(`%${filters.residence}%`);
    paramIndex++;
  }

  // Add time range filter if needed
  if (
    filters.timeRange &&
    filters.timeRange !== "all" &&
    filters.timeRange !== ""
  ) {
    const now = new Date();
    let startDate: Date;

    switch (filters.timeRange) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    whereClause +=
      (whereClause ? " AND " : " WHERE ") +
      `ta.last_activity >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  query += whereClause;
  query += `
    GROUP BY t.id, t.name, t.slug, t.team_size, ta.goals, ta.attempts, ta.last_activity
    HAVING COUNT(DISTINCT tm.player_id) > 0
  `;

  // Add ordering based on sort filter
  if (filters.sortBy === "streak") {
    // Teams don't have streaks, so we default to goals anyway
    query += ` ORDER BY total_goals DESC, total_attempts ASC, member_count DESC`;
  } else {
    query += ` ORDER BY total_goals DESC, total_attempts ASC, member_count DESC`;
  }

  query += ` LIMIT 50`;

  try {
    console.log("Team leaderboard query:", query);
    console.log("Team leaderboard params:", params);
    const result = await pool.query(query, params);
    console.log("Team leaderboard results:", result.rows.length);
    return result.rows;
  } catch (error) {
    console.error("Error fetching team leaderboard:", error);
    return [];
  }
}
