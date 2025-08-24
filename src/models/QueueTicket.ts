import { executeQuery } from "../config/db";

export interface IQueueTicket {
  id: number;
  ticket_number: number;
  player_id: number;
  status: "in-queue" | "played" | "expired";
  competition_type: string;
  official?: boolean;
  team_play?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

class QueueTicket {
  static async incrementTicketNumber(): Promise<number> {
    try {
      await this.ensureCounterIntegrity();
      const result = await executeQuery(
        "UPDATE global_counters SET value = value + 1 WHERE id = $1 RETURNING value",
        ["next_queue_number"]
      );
      const newCounterValue = parseInt(result.rows[0].value, 10);
      const issuedTicket = newCounterValue - 1;
      if (process.env.DEBUG_TICKETS === "true") {
        console.log(
          `[TICKETS] increment: counter(after)=${newCounterValue} issued=${issuedTicket}`
        );
      }
      return issuedTicket;
    } catch (error) {
      console.error("Error incrementing ticket number:", error);
      throw error;
    }
  }

  static async getTicketWindow(): Promise<{
    lastIssued: number;
    nextToIssue: number;
  }> {
    try {
      const counterRes = await executeQuery(
        "SELECT value FROM global_counters WHERE id = $1",
        ["next_queue_number"]
      );
      let nextToIssue = counterRes.rows[0]?.value
        ? parseInt(counterRes.rows[0].value, 10)
        : 0;
      const rangeRes = await executeQuery(
        "SELECT start_ticket, end_ticket, created_at FROM ticket_ranges ORDER BY created_at DESC LIMIT 1"
      );
      const range = rangeRes.rows[0] || null;
      let lastIssued: number;
      if (range) {
        const maxInRange = await executeQuery(
          "SELECT COALESCE(MAX(ticket_number), $1 - 1) AS last FROM queue_tickets WHERE ticket_number BETWEEN $1 AND $2 AND created_at >= $3",
          [range.start_ticket, range.end_ticket, range.created_at]
        );
        lastIssued = parseInt(maxInRange.rows[0].last, 10);
        if (nextToIssue < range.start_ticket) nextToIssue = range.start_ticket;
        if (nextToIssue <= lastIssued) nextToIssue = lastIssued + 1;
        if (
          nextToIssue > range.end_ticket + 1 &&
          process.env.DEBUG_TICKETS === "true"
        ) {
          console.warn(
            `[TICKETS] counter ${nextToIssue} beyond end of roll ${range.end_ticket}`
          );
        }
      } else {
        const maxResult = await executeQuery(
          "SELECT COALESCE(MAX(ticket_number), $1 - 1) AS last FROM queue_tickets",
          [nextToIssue]
        );
        lastIssued = parseInt(maxResult.rows[0].last, 10);
        if (nextToIssue <= lastIssued) nextToIssue = lastIssued + 1;
      }
      if (process.env.DEBUG_TICKETS === "true") {
        console.log(
          `[TICKETS] window(rangeAware) lastIssued=${lastIssued} nextToIssue=${nextToIssue}`
        );
      }
      return { lastIssued, nextToIssue };
    } catch (error) {
      console.error("Error getting ticket window:", error);
      throw error;
    }
  }

  static async getDisplayNumbers(): Promise<{
    currentServing: number | null;
    lastIssued: number;
    next: number;
  }> {
    const { lastIssued, nextToIssue } = await this.getTicketWindow();
    try {
      const active = await executeQuery(
        "SELECT MIN(ticket_number) AS min_active FROM queue_tickets WHERE status = 'in-queue'"
      );
      const minActiveRaw = active.rows[0]?.min_active;
      const minActive = minActiveRaw ? parseInt(minActiveRaw, 10) : null;
      return { currentServing: minActive, lastIssued, next: nextToIssue };
    } catch (e) {
      return { currentServing: null, lastIssued, next: nextToIssue };
    }
  }

  private static async ensureCounterIntegrity(): Promise<void> {
    try {
      const counterRes = await executeQuery(
        "SELECT value FROM global_counters WHERE id=$1",
        ["next_queue_number"]
      );
      if (!counterRes.rows.length) return;
      const currentCounter = parseInt(counterRes.rows[0].value, 10);
      const rangeRes = await executeQuery(
        "SELECT start_ticket, end_ticket, created_at FROM ticket_ranges ORDER BY created_at DESC LIMIT 1"
      );
      if (rangeRes.rows.length) {
        const r = rangeRes.rows[0];
        const maxInRange = await executeQuery(
          "SELECT COALESCE(MAX(ticket_number), $1 - 1) AS last FROM queue_tickets WHERE ticket_number BETWEEN $1 AND $2 AND created_at >= $3",
          [r.start_ticket, r.end_ticket, r.created_at]
        );
        const lastIssued = parseInt(maxInRange.rows[0].last, 10);
        const desired = Math.max(r.start_ticket, lastIssued + 1);
        if (desired !== currentCounter) {
          await executeQuery(
            "UPDATE global_counters SET value=$1 WHERE id=$2",
            [desired, "next_queue_number"]
          );
          if (process.env.DEBUG_TICKETS === "true") {
            console.warn(
              `[TICKETS] ensureCounterIntegrity(rangeAware) ${currentCounter} -> ${desired}`
            );
          }
        }
      } else {
        const maxResult = await executeQuery(
          "SELECT COALESCE(MAX(ticket_number), $1 - 1) AS last FROM queue_tickets",
          [currentCounter]
        );
        const last = parseInt(maxResult.rows[0].last, 10);
        if (currentCounter <= last) {
          const desired = last + 1;
          await executeQuery(
            "UPDATE global_counters SET value=$1 WHERE id=$2",
            [desired, "next_queue_number"]
          );
          if (process.env.DEBUG_TICKETS === "true") {
            console.warn(
              `[TICKETS] ensureCounterIntegrity(legacy) ${currentCounter} -> ${desired}`
            );
          }
        }
      }
    } catch (e) {
      console.error("[TICKETS] ensureCounterIntegrity failed", e);
    }
  }

  static async addToQueue(
    playerId: number,
    officialEntry = false,
    teamPlay = false
  ): Promise<number> {
    const competitionType = teamPlay ? "team" : "individual";
    const ticketNumber = await this.incrementTicketNumber();
    await executeQuery(
      "INSERT INTO queue_tickets (ticket_number, player_id, status, competition_type, official, team_play) VALUES ($1,$2,$3,$4,$5,$6)",
      [
        ticketNumber,
        playerId,
        "in-queue",
        competitionType,
        officialEntry,
        teamPlay,
      ]
    );
    return ticketNumber;
  }

  static async create(data: {
    player_id: number;
    competition_type: string;
    official?: boolean;
    team_play?: boolean;
  }): Promise<IQueueTicket | null> {
    const {
      player_id,
      competition_type,
      official = true,
      team_play = false,
    } = data;
    const ticketNumber = await this.incrementTicketNumber();
    const result = await executeQuery(
      "INSERT INTO queue_tickets (ticket_number, player_id, status, competition_type, official, team_play) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [
        ticketNumber,
        player_id,
        "in-queue",
        competition_type || "accuracy",
        official,
        team_play,
      ]
    );
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<IQueueTicket | null> {
    const result = await executeQuery(
      "SELECT * FROM queue_tickets WHERE id=$1",
      [id]
    );
    return result.rows[0] || null;
  }

  static async findActiveByPlayerId(playerId: number): Promise<IQueueTicket[]> {
    const result = await executeQuery(
      "SELECT * FROM queue_tickets WHERE player_id=$1 AND status=$2 ORDER BY created_at ASC",
      [playerId, "in-queue"]
    );
    return result.rows;
  }

  static async updateStatus(
    id: number,
    status: "in-queue" | "played" | "expired"
  ): Promise<IQueueTicket | null> {
    const result = await executeQuery(
      "UPDATE queue_tickets SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
      [status, id]
    );
    return result.rows[0] || null;
  }

  static async getCurrentQueuePosition(): Promise<number> {
    const result = await executeQuery(
      "SELECT MIN(ticket_number) AS current_number FROM queue_tickets WHERE status='in-queue'"
    );
    return result.rows[0]?.current_number || 0;
  }

  static async expireEndOfDay(): Promise<number> {
    try {
      const result = await executeQuery(
        "UPDATE queue_tickets SET status='expired', expired_at=NOW() WHERE status='in-queue' RETURNING id, player_id"
      );
      for (const row of result.rows) {
        await executeQuery(
          "UPDATE players SET kicks_balance = kicks_balance + 5 WHERE id=$1",
          [row.player_id]
        );
      }
      return result.rowCount || 0;
    } catch (e) {
      console.error("expireEndOfDay failed", e);
      return 0;
    }
  }

  static async getNextTicketNumber(): Promise<number> {
    const { nextToIssue } = await this.getTicketWindow();
    return nextToIssue;
  }
}

export default QueueTicket;
