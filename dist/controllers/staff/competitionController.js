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
exports.getSoloLeaderboard = exports.getSoloLiveData = exports.getMatchLiveData = exports.endSoloCompetition = exports.resumeSoloCompetition = exports.pauseSoloCompetition = exports.startSoloCompetition = exports.endMatch = exports.resumeMatch = exports.pauseMatch = exports.startMatch = exports.getSoloLive = exports.getMatchLive = exports.getCompetitionManagement = exports.getRecentActivity = exports.getActiveCompetitions = exports.addSoloParticipant = exports.addMatchParticipant = exports.updateSoloCompetitionStatus = exports.getSoloCompetition = exports.getSoloCompetitions = exports.createSoloCompetition = exports.updateMatchStatus = exports.getMatch = exports.getMatches = exports.createMatch = void 0;
const Match_1 = require("../../models/Match");
const SoloCompetition_1 = require("../../models/SoloCompetition");
const KickLog_1 = require("../../models/KickLog");
const db_1 = require("../../config/db");
// ===== MATCH MANAGEMENT =====
const createMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Authentication is already handled by isStaff middleware
        // No need for additional checks here
        const { name, match_type, team_a_id, team_b_id, scheduled_start, location, } = req.body;
        // Validate required fields
        if (!name || !match_type || !team_a_id || !team_b_id) {
            res.status(400).json({
                success: false,
                message: "Name, match type, and both teams are required",
            });
            return;
        }
        // Validate team IDs are different
        if (team_a_id === team_b_id) {
            res.status(400).json({
                success: false,
                message: "A team cannot play against itself",
            });
            return;
        }
        // Validate match type
        if (!["3v3", "5v5", "10v10", "11v11"].includes(match_type)) {
            res.status(400).json({
                success: false,
                message: "Invalid match type. Must be 3v3, 5v5, 10v10, or 11v11",
            });
            return;
        }
        const matchData = {
            name,
            match_type,
            team_a_id: parseInt(team_a_id),
            team_b_id: parseInt(team_b_id),
            scheduled_start: scheduled_start ? new Date(scheduled_start) : undefined,
            location,
            created_by: req.session.user.id,
        };
        const match = yield Match_1.Match.create(matchData);
        res.json({
            success: true,
            message: "Match created successfully",
            match,
        });
    }
    catch (error) {
        console.error("Error creating match:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while creating the match",
        });
    }
});
exports.createMatch = createMatch;
const getMatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, limit } = req.query;
        let matches;
        if (status && typeof status === "string") {
            matches = yield Match_1.Match.findByStatus(status);
        }
        else {
            matches = yield Match_1.Match.findAll(limit ? parseInt(limit) : 50);
        }
        res.json({
            success: true,
            matches,
        });
    }
    catch (error) {
        console.error("Error fetching matches:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching matches",
        });
    }
});
exports.getMatches = getMatches;
const getMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const match = yield Match_1.Match.findById(parseInt(id));
        if (!match) {
            res.status(404).json({
                success: false,
                message: "Match not found",
            });
            return;
        }
        // Get participants
        const participants = yield Match_1.Match.getParticipants(match.id);
        // Get kick logs
        const kickLogs = yield KickLog_1.KickLog.findByMatch(match.id);
        res.json({
            success: true,
            match,
            participants,
            kickLogs,
        });
    }
    catch (error) {
        console.error("Error fetching match:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching the match",
        });
    }
});
exports.getMatch = getMatch;
const updateMatchStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Authentication is already handled by isStaff middleware
        // No need for additional checks here
        const { id } = req.params;
        const { status } = req.body;
        if (!["scheduled", "active", "completed", "cancelled"].includes(status)) {
            res.status(400).json({
                success: false,
                message: "Invalid status. Must be scheduled, active, completed, or cancelled",
            });
            return;
        }
        const match = yield Match_1.Match.updateStatus(parseInt(id), status, req.session.user.id);
        if (!match) {
            res.status(404).json({
                success: false,
                message: "Match not found",
            });
            return;
        }
        res.json({
            success: true,
            message: `Match status updated to ${status}`,
            match,
        });
    }
    catch (error) {
        console.error("Error updating match status:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the match status",
        });
    }
});
exports.updateMatchStatus = updateMatchStatus;
// ===== SOLO COMPETITION MANAGEMENT =====
const createSoloCompetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow staff/admin to create competitions
        if (!req.session.user ||
            !["admin", "staff"].includes(req.session.user.role)) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const { name, description, max_participants, scheduled_start, location } = req.body;
        // Validate required fields
        if (!name) {
            res.status(400).json({
                success: false,
                message: "Competition name is required",
            });
            return;
        }
        const competitionData = {
            name,
            description,
            max_participants: max_participants ? parseInt(max_participants) : 50,
            scheduled_start: scheduled_start ? new Date(scheduled_start) : undefined,
            location,
            created_by: req.session.user.id,
        };
        const competition = yield SoloCompetition_1.SoloCompetition.create(competitionData);
        res.json({
            success: true,
            message: "Solo competition created successfully",
            competition,
        });
    }
    catch (error) {
        console.error("Error creating solo competition:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while creating the solo competition",
        });
    }
});
exports.createSoloCompetition = createSoloCompetition;
const getSoloCompetitions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, limit } = req.query;
        let competitions;
        if (status && typeof status === "string") {
            competitions = yield SoloCompetition_1.SoloCompetition.findByStatus(status);
        }
        else {
            competitions = yield SoloCompetition_1.SoloCompetition.findAll(limit ? parseInt(limit) : 50);
        }
        res.json({
            success: true,
            competitions,
        });
    }
    catch (error) {
        console.error("Error fetching solo competitions:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching solo competitions",
        });
    }
});
exports.getSoloCompetitions = getSoloCompetitions;
const getSoloCompetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const competition = yield SoloCompetition_1.SoloCompetition.findById(parseInt(id));
        if (!competition) {
            res.status(404).json({
                success: false,
                message: "Solo competition not found",
            });
            return;
        }
        // Get participants
        const participants = yield SoloCompetition_1.SoloCompetition.getParticipants(competition.id);
        // Get leaderboard
        const leaderboard = yield SoloCompetition_1.SoloCompetition.getLeaderboard(competition.id);
        // Get kick logs
        const kickLogs = yield KickLog_1.KickLog.findBySoloCompetition(competition.id);
        res.json({
            success: true,
            competition,
            participants,
            leaderboard,
            kickLogs,
        });
    }
    catch (error) {
        console.error("Error fetching solo competition:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching the solo competition",
        });
    }
});
exports.getSoloCompetition = getSoloCompetition;
const updateSoloCompetitionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow staff/admin to update competition status
        if (!req.session.user ||
            !["admin", "staff"].includes(req.session.user.role)) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const { id } = req.params;
        const { status } = req.body;
        if (!["scheduled", "active", "completed", "cancelled"].includes(status)) {
            res.status(400).json({
                success: false,
                message: "Invalid status. Must be scheduled, active, completed, or cancelled",
            });
            return;
        }
        const competition = yield SoloCompetition_1.SoloCompetition.updateStatus(parseInt(id), status, req.session.user.id);
        if (!competition) {
            res.status(404).json({
                success: false,
                message: "Solo competition not found",
            });
            return;
        }
        res.json({
            success: true,
            message: `Solo competition status updated to ${status}`,
            competition,
        });
    }
    catch (error) {
        console.error("Error updating solo competition status:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the solo competition status",
        });
    }
});
exports.updateSoloCompetitionStatus = updateSoloCompetitionStatus;
// ===== PARTICIPANT MANAGEMENT =====
const addMatchParticipant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow staff/admin to add participants
        if (!req.session.user ||
            !["admin", "staff"].includes(req.session.user.role)) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const { matchId, teamId, playerId } = req.body;
        if (!matchId || !teamId || !playerId) {
            res.status(400).json({
                success: false,
                message: "Match ID, team ID, and player ID are required",
            });
            return;
        }
        const success = yield Match_1.Match.addParticipant(parseInt(matchId), parseInt(teamId), parseInt(playerId));
        if (!success) {
            res.status(400).json({
                success: false,
                message: "Failed to add participant to match",
            });
            return;
        }
        res.json({
            success: true,
            message: "Participant added to match successfully",
        });
    }
    catch (error) {
        console.error("Error adding match participant:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while adding the participant",
        });
    }
});
exports.addMatchParticipant = addMatchParticipant;
const addSoloParticipant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { competitionId, playerId } = req.body;
        if (!competitionId || !playerId) {
            res.status(400).json({
                success: false,
                message: "Competition ID and player ID are required",
            });
            return;
        }
        const success = yield SoloCompetition_1.SoloCompetition.addParticipant(parseInt(competitionId), parseInt(playerId));
        if (!success) {
            res.status(400).json({
                success: false,
                message: "Failed to add participant to solo competition. Competition may be full or closed.",
            });
            return;
        }
        res.json({
            success: true,
            message: "Participant added to solo competition successfully",
        });
    }
    catch (error) {
        console.error("Error adding solo participant:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while adding the participant",
        });
    }
});
exports.addSoloParticipant = addSoloParticipant;
// ===== LIVE CONSOLE ENDPOINTS =====
const getActiveCompetitions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const activeMatches = yield Match_1.Match.findByStatus("active");
        const activeSoloCompetitions = yield SoloCompetition_1.SoloCompetition.findByStatus("active");
        res.json({
            success: true,
            activeMatches,
            activeSoloCompetitions,
        });
    }
    catch (error) {
        console.error("Error fetching active competitions:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching active competitions",
        });
    }
});
exports.getActiveCompetitions = getActiveCompetitions;
const getRecentActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { limit } = req.query;
        const activity = yield KickLog_1.KickLog.getRecentActivity(limit ? parseInt(limit) : 20);
        res.json({
            success: true,
            activity,
        });
    }
    catch (error) {
        console.error("Error fetching recent activity:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching recent activity",
        });
    }
});
exports.getRecentActivity = getRecentActivity;
// ===== VIEW CONTROLLERS =====
const getCompetitionManagement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow staff/admin to access competition management
        if (!req.session.user ||
            !["admin", "staff"].includes(req.session.user.role)) {
            res.status(401).render("system/error", {
                title: "Unauthorized",
                code: 401,
                message: "Unauthorized access",
            });
            return;
        }
        // Get active competitions, matches, and recent activity
        const activeMatches = yield Match_1.Match.findByStatus("active");
        const activeSoloCompetitions = yield SoloCompetition_1.SoloCompetition.findByStatus("active");
        const recentMatches = yield Match_1.Match.getRecent(10);
        const recentSoloCompetitions = yield SoloCompetition_1.SoloCompetition.getRecent(10);
        // Get recent activity without using ma.score
        let recentActivity = [];
        try {
            recentActivity = yield KickLog_1.KickLog.getRecentActivity(20);
        }
        catch (activityError) {
            console.error("Error fetching recent activity:", activityError);
            // Continue without activity data
        }
        // Get teams for dropdown
        const teamsResult = yield db_1.pool.query("SELECT id, name FROM teams ORDER BY name");
        const teams = teamsResult.rows;
        // Get custom competitions
        let customCompetitions = [];
        try {
            const competitionsResult = yield db_1.pool.query("SELECT * FROM competitions ORDER BY created_at DESC LIMIT 10");
            customCompetitions = competitionsResult.rows;
        }
        catch (compError) {
            console.error("Error fetching custom competitions:", compError);
            // Continue without custom competitions data
        }
        res.render("staff/competition-management", {
            title: "Competition Management",
            activeMatches,
            activeSoloCompetitions,
            recentMatches,
            recentSoloCompetitions,
            recentActivity,
            teams,
            customCompetitions,
            user: req.session.user,
        });
    }
    catch (error) {
        console.error("Error loading competition management:", error);
        res.status(500).render("system/error", {
            title: "Server Error",
            code: 500,
            message: "Failed to load competition management",
        });
    }
});
exports.getCompetitionManagement = getCompetitionManagement;
const getMatchLive = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const match = yield Match_1.Match.findById(parseInt(id));
        if (!match) {
            res.status(404).render("system/error", {
                title: "Match Not Found",
                code: 404,
                message: "Match not found",
            });
            return;
        }
        // Get participants with their players
        const participantsResult = yield db_1.pool.query(`
      SELECT 
        mp.team_id,
        t.name as team_name,
        mp.score,
        COALESCE(kl.kick_count, 0) as total_kicks
      FROM match_participants mp
      JOIN teams t ON mp.team_id = t.id
      LEFT JOIN (
        SELECT 
          team_id,
          COUNT(*) as kick_count
        FROM kick_log kl
        JOIN players p ON kl.player_id = p.id
        WHERE kl.match_id = $1
        GROUP BY team_id
      ) kl ON mp.team_id = kl.team_id
      WHERE mp.match_id = $1
    `, [id]);
        const participants = yield Promise.all(participantsResult.rows.map((participant) => __awaiter(void 0, void 0, void 0, function* () {
            // Get players for this team with their kick counts
            const playersResult = yield db_1.pool.query(`
          SELECT 
            p.id,
            p.name,
            COALESCE(kl.kick_count, 0) as kick_count
          FROM players p
          WHERE p.team_id = $1
          AND p.id IN (
            SELECT player_id FROM match_participants WHERE match_id = $2
          )
        `, [participant.team_id, id]);
            const playersWithKicks = yield Promise.all(playersResult.rows.map((player) => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                const kickResult = yield db_1.pool.query(`
              SELECT COUNT(*) as kick_count
              FROM kick_log
              WHERE match_id = $1 AND player_id = $2
            `, [id, player.id]);
                return Object.assign(Object.assign({}, player), { kick_count: parseInt(((_a = kickResult.rows[0]) === null || _a === void 0 ? void 0 : _a.kick_count) || "0") });
            })));
            return Object.assign(Object.assign({}, participant), { players: playersWithKicks });
        })));
        res.render("staff/match-live", {
            title: `Live Match: ${match.name}`,
            match,
            participants,
            user: req.session.user,
        });
    }
    catch (error) {
        console.error("Error loading match live view:", error);
        res.status(500).render("system/error", {
            title: "Server Error",
            code: 500,
            message: "Failed to load match live view",
        });
    }
});
exports.getMatchLive = getMatchLive;
const getSoloLive = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const soloComp = yield SoloCompetition_1.SoloCompetition.findById(parseInt(id));
        if (!soloComp) {
            res.status(404).render("system/error", {
                title: "Solo Competition Not Found",
                code: 404,
                message: "Solo competition not found",
            });
            return;
        }
        // Get participants with their stats
        const participantsResult = yield db_1.pool.query(`
      SELECT 
        sp.player_id,
        p.name,
        sp.score,
        COALESCE(kl.kick_count, 0) as kick_count
      FROM solo_participants sp
      JOIN players p ON sp.player_id = p.id
      LEFT JOIN (
        SELECT 
          player_id,
          COUNT(*) as kick_count
        FROM kick_log
        WHERE solo_comp_id = $1
        GROUP BY player_id
      ) kl ON sp.player_id = kl.player_id
      WHERE sp.solo_competition_id = $1
    `, [id]);
        res.render("staff/solo-live", {
            title: `Live Solo: ${soloComp.name}`,
            soloComp,
            participants: participantsResult.rows,
            user: req.session.user,
        });
    }
    catch (error) {
        console.error("Error loading solo live view:", error);
        res.status(500).render("system/error", {
            title: "Server Error",
            code: 500,
            message: "Failed to load solo live view",
        });
    }
});
exports.getSoloLive = getSoloLive;
// ===== MATCH CONTROL ENDPOINTS =====
const startMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const match = yield Match_1.Match.findById(parseInt(id));
        if (!match) {
            res.status(404).json({ success: false, message: "Match not found" });
            return;
        }
        if (match.status !== "scheduled") {
            res
                .status(400)
                .json({ success: false, message: "Match cannot be started" });
            return;
        }
        yield Match_1.Match.updateStatus(parseInt(id), "active");
        res.json({ success: true, message: "Match started successfully" });
    }
    catch (error) {
        console.error("Error starting match:", error);
        res.status(500).json({ success: false, message: "Failed to start match" });
    }
});
exports.startMatch = startMatch;
const pauseMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield Match_1.Match.updateStatus(parseInt(id), "paused");
        res.json({ success: true, message: "Match paused successfully" });
    }
    catch (error) {
        console.error("Error pausing match:", error);
        res.status(500).json({ success: false, message: "Failed to pause match" });
    }
});
exports.pauseMatch = pauseMatch;
const resumeMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield Match_1.Match.updateStatus(parseInt(id), "active");
        res.json({ success: true, message: "Match resumed successfully" });
    }
    catch (error) {
        console.error("Error resuming match:", error);
        res.status(500).json({ success: false, message: "Failed to resume match" });
    }
});
exports.resumeMatch = resumeMatch;
const endMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield Match_1.Match.updateStatus(parseInt(id), "completed");
        res.json({ success: true, message: "Match ended successfully" });
    }
    catch (error) {
        console.error("Error ending match:", error);
        res.status(500).json({ success: false, message: "Failed to end match" });
    }
});
exports.endMatch = endMatch;
// ===== SOLO COMPETITION CONTROL ENDPOINTS =====
const startSoloCompetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const soloComp = yield SoloCompetition_1.SoloCompetition.findById(parseInt(id));
        if (!soloComp) {
            res
                .status(404)
                .json({ success: false, message: "Solo competition not found" });
            return;
        }
        if (soloComp.status !== "scheduled") {
            res.status(400).json({
                success: false,
                message: "Solo competition cannot be started",
            });
            return;
        }
        yield SoloCompetition_1.SoloCompetition.updateStatus(parseInt(id), "active");
        res.json({
            success: true,
            message: "Solo competition started successfully",
        });
    }
    catch (error) {
        console.error("Error starting solo competition:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to start solo competition" });
    }
});
exports.startSoloCompetition = startSoloCompetition;
const pauseSoloCompetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield SoloCompetition_1.SoloCompetition.updateStatus(parseInt(id), "paused");
        res.json({
            success: true,
            message: "Solo competition paused successfully",
        });
    }
    catch (error) {
        console.error("Error pausing solo competition:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to pause solo competition" });
    }
});
exports.pauseSoloCompetition = pauseSoloCompetition;
const resumeSoloCompetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield SoloCompetition_1.SoloCompetition.updateStatus(parseInt(id), "active");
        res.json({
            success: true,
            message: "Solo competition resumed successfully",
        });
    }
    catch (error) {
        console.error("Error resuming solo competition:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to resume solo competition" });
    }
});
exports.resumeSoloCompetition = resumeSoloCompetition;
const endSoloCompetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield SoloCompetition_1.SoloCompetition.updateStatus(parseInt(id), "completed");
        res.json({ success: true, message: "Solo competition ended successfully" });
    }
    catch (error) {
        console.error("Error ending solo competition:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to end solo competition" });
    }
});
exports.endSoloCompetition = endSoloCompetition;
// ===== LIVE DATA ENDPOINTS =====
const getMatchLiveData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const match = yield Match_1.Match.findById(parseInt(id));
        if (!match) {
            res.status(404).json({ success: false, message: "Match not found" });
            return;
        }
        // Get updated participants data
        const participantsResult = yield db_1.pool.query(`
      SELECT 
        mp.team_id,
        t.name as team_name,
        mp.score
      FROM match_participants mp
      JOIN teams t ON mp.team_id = t.id
      WHERE mp.match_id = $1
    `, [id]);
        const participants = yield Promise.all(participantsResult.rows.map((participant) => __awaiter(void 0, void 0, void 0, function* () {
            const playersResult = yield db_1.pool.query(`
          SELECT 
            p.id,
            p.name,
            COUNT(kl.id) as kick_count
          FROM players p
          LEFT JOIN kick_log kl ON p.id = kl.player_id AND kl.match_id = $1
          WHERE p.team_id = $2
          GROUP BY p.id, p.name
        `, [id, participant.team_id]);
            return Object.assign(Object.assign({}, participant), { players: playersResult.rows });
        })));
        res.json({
            success: true,
            status: match.status,
            participants,
        });
    }
    catch (error) {
        console.error("Error getting match live data:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to get match data" });
    }
});
exports.getMatchLiveData = getMatchLiveData;
const getSoloLiveData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const soloComp = yield SoloCompetition_1.SoloCompetition.findById(parseInt(id));
        if (!soloComp) {
            res
                .status(404)
                .json({ success: false, message: "Solo competition not found" });
            return;
        }
        // Get updated participants data
        const participantsResult = yield db_1.pool.query(`
      SELECT 
        sp.player_id,
        p.name,
        sp.score,
        COUNT(kl.id) as kick_count
      FROM solo_participants sp
      JOIN players p ON sp.player_id = p.id
      LEFT JOIN kick_log kl ON sp.player_id = kl.player_id AND kl.solo_comp_id = $1
      WHERE sp.solo_competition_id = $1
      GROUP BY sp.player_id, p.name, sp.score
    `, [id]);
        res.json({
            success: true,
            status: soloComp.status,
            participants: participantsResult.rows,
        });
    }
    catch (error) {
        console.error("Error getting solo live data:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to get solo data" });
    }
});
exports.getSoloLiveData = getSoloLiveData;
const getSoloLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const leaderboardResult = yield db_1.pool.query(`
      SELECT 
        sp.player_id,
        p.name as player_name,
        sp.score,
        COUNT(kl.id) as kick_count
      FROM solo_participants sp
      JOIN players p ON sp.player_id = p.id
      LEFT JOIN kick_log kl ON sp.player_id = kl.player_id AND kl.solo_comp_id = $1
      WHERE sp.solo_competition_id = $1 AND p.deleted_at IS NULL
      GROUP BY sp.player_id, p.name, sp.score
      ORDER BY sp.score DESC, kick_count ASC
    `, [id]);
        res.json(leaderboardResult.rows);
    }
    catch (error) {
        console.error("Error getting solo leaderboard:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to get leaderboard" });
    }
});
exports.getSoloLeaderboard = getSoloLeaderboard;
