"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
class QueueTicket {
    static incrementTicketNumber() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.ensureCounterIntegrity();
                const result = yield (0, db_1.executeQuery)("UPDATE global_counters SET value = value + 1 WHERE id = $1 RETURNING value", ["next_queue_number"]);
                const newCounterValue = parseInt(result.rows[0].value, 10);
                const issuedTicket = newCounterValue - 1;
                if (process.env.DEBUG_TICKETS === "true") {
                    console.log(`[TICKETS] increment: counter(after)=${newCounterValue} issued=${issuedTicket}`);
                }
                return issuedTicket;
            }
            catch (error) {
                console.error("Error incrementing ticket number:", error);
                throw error;
            }
        });
    }
    static getTicketWindow() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const counterRes = yield (0, db_1.executeQuery)("SELECT value FROM global_counters WHERE id = $1", ["next_queue_number"]);
                let nextToIssue = ((_a = counterRes.rows[0]) === null || _a === void 0 ? void 0 : _a.value)
                    ? parseInt(counterRes.rows[0].value, 10)
                    : 0;
                const rangeRes = yield (0, db_1.executeQuery)("SELECT start_ticket, end_ticket, created_at FROM ticket_ranges ORDER BY created_at DESC LIMIT 1");
                const range = rangeRes.rows[0] || null;
                let lastIssued;
                if (range) {
                    const maxInRange = yield (0, db_1.executeQuery)("SELECT COALESCE(MAX(ticket_number), $1 - 1) AS last FROM queue_tickets WHERE ticket_number BETWEEN $1 AND $2 AND created_at >= $3", [range.start_ticket, range.end_ticket, range.created_at]);
                    lastIssued = parseInt(maxInRange.rows[0].last, 10);
                    if (nextToIssue < range.start_ticket)
                        nextToIssue = range.start_ticket;
                    if (nextToIssue <= lastIssued)
                        nextToIssue = lastIssued + 1;
                    if (nextToIssue > range.end_ticket + 1 &&
                        process.env.DEBUG_TICKETS === "true") {
                        console.warn(`[TICKETS] counter ${nextToIssue} beyond end of roll ${range.end_ticket}`);
                    }
                }
                else {
                    const maxResult = yield (0, db_1.executeQuery)("SELECT COALESCE(MAX(ticket_number), $1 - 1) AS last FROM queue_tickets", [nextToIssue]);
                    lastIssued = parseInt(maxResult.rows[0].last, 10);
                    if (nextToIssue <= lastIssued)
                        nextToIssue = lastIssued + 1;
                }
                if (process.env.DEBUG_TICKETS === "true") {
                    console.log(`[TICKETS] window(rangeAware) lastIssued=${lastIssued} nextToIssue=${nextToIssue}`);
                }
                return { lastIssued, nextToIssue };
            }
            catch (error) {
                console.error("Error getting ticket window:", error);
                throw error;
            }
        });
    }
    static getDisplayNumbers() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { lastIssued, nextToIssue } = yield this.getTicketWindow();
            try {
                const active = yield (0, db_1.executeQuery)("SELECT MIN(ticket_number) AS min_active FROM queue_tickets WHERE status = 'in-queue'");
                const minActiveRaw = (_a = active.rows[0]) === null || _a === void 0 ? void 0 : _a.min_active;
                const minActive = minActiveRaw ? parseInt(minActiveRaw, 10) : null;
                return { currentServing: minActive, lastIssued, next: nextToIssue };
            }
            catch (e) {
                return { currentServing: null, lastIssued, next: nextToIssue };
            }
        });
    }
    static ensureCounterIntegrity() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const counterRes = yield (0, db_1.executeQuery)("SELECT value FROM global_counters WHERE id=$1", ["next_queue_number"]);
                if (!counterRes.rows.length)
                    return;
                const currentCounter = parseInt(counterRes.rows[0].value, 10);
                const rangeRes = yield (0, db_1.executeQuery)("SELECT start_ticket, end_ticket, created_at FROM ticket_ranges ORDER BY created_at DESC LIMIT 1");
                if (rangeRes.rows.length) {
                    const r = rangeRes.rows[0];
                    const maxInRange = yield (0, db_1.executeQuery)("SELECT COALESCE(MAX(ticket_number), $1 - 1) AS last FROM queue_tickets WHERE ticket_number BETWEEN $1 AND $2 AND created_at >= $3", [r.start_ticket, r.end_ticket, r.created_at]);
                    const lastIssued = parseInt(maxInRange.rows[0].last, 10);
                    const desired = Math.max(r.start_ticket, lastIssued + 1);
                    if (desired !== currentCounter) {
                        yield (0, db_1.executeQuery)("UPDATE global_counters SET value=$1 WHERE id=$2", [desired, "next_queue_number"]);
                        if (process.env.DEBUG_TICKETS === "true") {
                            console.warn(`[TICKETS] ensureCounterIntegrity(rangeAware) ${currentCounter} -> ${desired}`);
                        }
                    }
                }
                else {
                    const maxResult = yield (0, db_1.executeQuery)("SELECT COALESCE(MAX(ticket_number), $1 - 1) AS last FROM queue_tickets", [currentCounter]);
                    const last = parseInt(maxResult.rows[0].last, 10);
                    if (currentCounter <= last) {
                        const desired = last + 1;
                        yield (0, db_1.executeQuery)("UPDATE global_counters SET value=$1 WHERE id=$2", [desired, "next_queue_number"]);
                        if (process.env.DEBUG_TICKETS === "true") {
                            console.warn(`[TICKETS] ensureCounterIntegrity(legacy) ${currentCounter} -> ${desired}`);
                        }
                    }
                }
            }
            catch (e) {
                console.error("[TICKETS] ensureCounterIntegrity failed", e);
            }
        });
    }
    static addToQueue(playerId_1) {
        return __awaiter(this, arguments, void 0, function* (playerId, officialEntry = false, teamPlay = false) {
            const competitionType = teamPlay ? "team" : "individual";
            const ticketNumber = yield this.incrementTicketNumber();
            yield (0, db_1.executeQuery)("INSERT INTO queue_tickets (ticket_number, player_id, status, competition_type, official, team_play) VALUES ($1,$2,$3,$4,$5,$6)", [
                ticketNumber,
                playerId,
                "in-queue",
                competitionType,
                officialEntry,
                teamPlay,
            ]);
            return ticketNumber;
        });
    }
    static create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { player_id, competition_type, official = true, team_play = false, } = data;
            const ticketNumber = yield this.incrementTicketNumber();
            const result = yield (0, db_1.executeQuery)("INSERT INTO queue_tickets (ticket_number, player_id, status, competition_type, official, team_play) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *", [
                ticketNumber,
                player_id,
                "in-queue",
                competition_type || "accuracy",
                official,
                team_play,
            ]);
            return result.rows[0] || null;
        });
    }
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.executeQuery)("SELECT * FROM queue_tickets WHERE id=$1", [id]);
            return result.rows[0] || null;
        });
    }
    static findActiveByPlayerId(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.executeQuery)("SELECT * FROM queue_tickets WHERE player_id=$1 AND status=$2 ORDER BY created_at ASC", [playerId, "in-queue"]);
            return result.rows;
        });
    }
    static updateStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.executeQuery)("UPDATE queue_tickets SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *", [status, id]);
            return result.rows[0] || null;
        });
    }
    static getCurrentQueuePosition() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = yield (0, db_1.executeQuery)("SELECT MIN(ticket_number) AS current_number FROM queue_tickets WHERE status='in-queue'");
            return ((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.current_number) || 0;
        });
    }
    static expireEndOfDay() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, db_1.executeQuery)("UPDATE queue_tickets SET status='expired', expired_at=NOW() WHERE status='in-queue' RETURNING id, player_id");
                for (const row of result.rows) {
                    yield (0, db_1.executeQuery)("UPDATE players SET kicks_balance = kicks_balance + 5 WHERE id=$1", [row.player_id]);
                }
                return result.rowCount || 0;
            }
            catch (e) {
                console.error("expireEndOfDay failed", e);
                return 0;
            }
        });
    }
    static getNextTicketNumber() {
        return __awaiter(this, void 0, void 0, function* () {
            const { nextToIssue } = yield this.getTicketWindow();
            return nextToIssue;
        });
    }
}
exports.default = QueueTicket;
