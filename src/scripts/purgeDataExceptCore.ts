/**
 * Purge non-core data from the database while preserving:
 *  - Admin staff user (username or name matches 'admin')
 *  - Staff user "Crai Pearlman" (case-insensitive match on name)
 *  - Player "Crai Pearlman" (case-insensitive match on name)
 *
 * This script truncates or deletes from tables that reference players, queue, competitions, teams,
 * transactions, stats, logs, content, etc. It attempts to maintain referential integrity by ordering
 * deletes from child tables upward. It DOES NOT drop tables.
 *
 * Environment: uses existing DB connection settings via dotenv.
 *
 * Run:
 *   npm run build (if needed) then: npx ts-node src/scripts/purgeDataExceptCore.ts
 *   or via package script: npm run purge:data
 */
import dotenv from "dotenv";
import { pool } from "../config/db";

dotenv.config();

(async () => {
  const client = await pool.connect();
  try {
    console.log("🚨 Starting data purge (preserving core records)...");
    await client.query("BEGIN");

    // ENV-based overrides
    // Comma-separated names / usernames / IDs to preserve (case-insensitive for names)
    const PRESERVE_PLAYER_NAMES = (
      process.env.PRESERVE_PLAYER_NAMES || "crai pearlman,crai pearlaman"
    )
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const PRESERVE_STAFF_USERNAMES = (
      process.env.PRESERVE_STAFF_USERNAMES || "admin"
    )
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const PRESERVE_PLAYER_IDS = (process.env.PRESERVE_PLAYER_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const PRESERVE_STAFF_IDS = (process.env.PRESERVE_STAFF_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const dryRun = (process.env.DRY_RUN || "false").toLowerCase() === "true";

    // Discover existing tables (public schema) to avoid failing on non-existent ones
    const tableList = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname='public'`
    );
    const existing = new Set<string>(tableList.rows.map((r) => r.tablename));
    const has = (t: string) => existing.has(t);

    // Identify preserved staff IDs (by username, name, or explicit IDs) only if table exists
    const staffRes = has("staff")
      ? await client.query(`SELECT id, username, name FROM staff`)
      : ({ rows: [] } as any);
    const preserveStaffIds = staffRes.rows
      .filter(
        (r: any) =>
          PRESERVE_STAFF_IDS.includes(String(r.id)) ||
          PRESERVE_STAFF_USERNAMES.includes((r.username || "").toLowerCase()) ||
          PRESERVE_STAFF_USERNAMES.includes((r.name || "").toLowerCase()) ||
          PRESERVE_PLAYER_NAMES.includes((r.name || "").toLowerCase())
      )
      .map((r: any) => r.id);
    console.log("Preserving staff IDs:", preserveStaffIds);

    // Identify preserved player IDs (by name or explicit IDs)
    const playerRes = has("players")
      ? await client.query(`SELECT id, name FROM players`)
      : ({ rows: [] } as any);
    const preservePlayerIds = playerRes.rows
      .filter(
        (r: any) =>
          PRESERVE_PLAYER_IDS.includes(String(r.id)) ||
          PRESERVE_PLAYER_NAMES.includes((r.name || "").toLowerCase())
      )
      .map((r: any) => r.id);
    console.log("Preserving player IDs:", preservePlayerIds);
    if (!preservePlayerIds.length) {
      console.warn(
        "⚠️  No player IDs matched the preservation criteria. ALL players will be removed unless DRY_RUN is true."
      );
    }

    // Helper to build NOT IN clause safely
    const notIn = (ids: number[]) =>
      ids.length ? `NOT IN (${ids.join(",")})` : "IS NOT NULL";

    // Order matters: delete from child tables first
    // Session table (connect-pg-simple typically uses "session") – purge first
    // Note: Some Supabase setups may prefix schemas; adjust SCHEMA if needed via env.
    const SESSION_TABLE =
      process.env.SESSION_TABLE ||
      (has("session") ? "session" : has("sessions") ? "sessions" : "session");

    const statements: string[] = [];
    if (has(SESSION_TABLE)) statements.push(`DELETE FROM ${SESSION_TABLE}`);
    if (has("game_stats"))
      statements.push(
        `DELETE FROM game_stats WHERE player_id ${notIn(preservePlayerIds)}`
      );
    if (has("kick_logs"))
      statements.push(
        `DELETE FROM kick_logs WHERE player_id ${notIn(preservePlayerIds)}`
      );
    if (has("match_players"))
      statements.push(
        `DELETE FROM match_players WHERE player_id ${notIn(preservePlayerIds)}`
      );
    if (has("matches")) statements.push(`DELETE FROM matches`);
    if (has("queue_tickets"))
      statements.push(
        `DELETE FROM queue_tickets WHERE player_id ${notIn(preservePlayerIds)}`
      );
    if (has("team_members"))
      statements.push(
        `DELETE FROM team_members WHERE player_id ${notIn(preservePlayerIds)}`
      );
    if (has("team_stats")) statements.push(`DELETE FROM team_stats`);
    if (has("teams")) statements.push(`DELETE FROM teams`);
    if (has("competition_players"))
      statements.push(
        `DELETE FROM competition_players WHERE player_id ${notIn(
          preservePlayerIds
        )}`
      );
    if (has("competition_teams"))
      statements.push(`DELETE FROM competition_teams`);
    if (has("competitions")) statements.push(`DELETE FROM competitions`);
    if (has("event_registrations"))
      statements.push(
        `DELETE FROM event_registrations WHERE player_id ${notIn(
          preservePlayerIds
        )}`
      );
    if (has("events")) statements.push(`DELETE FROM events`);
    if (has("transactions"))
      statements.push(
        `DELETE FROM transactions WHERE player_id ${notIn(preservePlayerIds)}`
      );
    if (has("notifications"))
      statements.push(
        `DELETE FROM notifications WHERE player_id ${notIn(preservePlayerIds)}`
      );
    if (has("uploads"))
      statements.push(
        `DELETE FROM uploads WHERE player_id ${notIn(preservePlayerIds)}`
      );
    if (has("site_content")) statements.push(`DELETE FROM site_content`);
    if (has("players"))
      statements.push(
        `DELETE FROM players WHERE id ${notIn(preservePlayerIds)}`
      );
    if (has("staff"))
      statements.push(`DELETE FROM staff WHERE id ${notIn(preserveStaffIds)}`);
    if (has("global_counters") && has("queue_tickets"))
      statements.push(
        `UPDATE global_counters SET value = (SELECT COALESCE(MAX(ticket_number),0)+1 FROM queue_tickets) WHERE id='next_queue_number'`
      );

    if (dryRun) {
      console.log("🧪 DRY_RUN enabled. The following statements WOULD run:");
      statements.forEach((s) => console.log("   ", s));
      await client.query("ROLLBACK");
      console.log(
        "✅ Dry run complete. No changes committed. Set DRY_RUN=false to apply."
      );
      return;
    } else {
      for (const sql of statements) {
        console.log("🧹 Executing:", sql);
        try {
          await client.query(sql);
        } catch (err: any) {
          console.warn("⚠️  Statement failed (continuing):", err.message);
        }
      }
    }

    await client.query("COMMIT");
    // Diagnostics after purge
    const remainingPlayers = has("players")
      ? await client.query("SELECT id, name FROM players ORDER BY id")
      : ({ rows: [] } as any);
    const remainingStaff = has("staff")
      ? await client.query("SELECT id, username, name FROM staff ORDER BY id")
      : ({ rows: [] } as any);
    console.log("👥 Remaining players:", remainingPlayers.rows);
    console.log("👤 Remaining staff:", remainingStaff.rows);
    console.log("✅ Data purge complete. Core records preserved.");
  } catch (e: any) {
    await client.query("ROLLBACK");
    console.error("❌ Purge failed, rolled back:", e.message);
  } finally {
    client.release();
    await pool.end();
  }
})();
