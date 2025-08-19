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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeamSize = exports.deleteTeam = exports.updateTeamName = exports.removeMember = exports.transferCaptaincy = exports.handleJoinRequest = exports.checkMembership = exports.getTeamComparison = exports.browseTeams = exports.getTeamDashboard = exports.leaveTeam = exports.joinTeam = exports.getCreateTeamForm = exports.createTeam = void 0;
const Team_1 = __importDefault(require("../../models/Team"));
const db_1 = require("../../config/db");
const createTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log("Team creation request body:", req.body);
        console.log("Content-Type:", req.headers["content-type"]);
        const { name, team_size, description, slug, is_recruiting } = req.body;
        const playerId = parseInt(req.session.user.id);
        if (!name || !team_size) {
            req.flash("error_msg", "Team name and size are required");
            return res.redirect("/player/teams/create");
        }
        // Validate team size
        const validSizes = [3, 5, 10, 11];
        if (!validSizes.includes(parseInt(team_size))) {
            req.flash("error_msg", "Invalid team size selected");
            return res.redirect("/player/teams/create");
        }
        // Check if player is already in a team - REMOVED: Allow multiple team memberships
        // const existingTeam = await Team.getPlayerTeam(playerId);
        // if (existingTeam) {
        //   req.flash("error_msg", "You are already in a team");
        //   return res.redirect("/player/dashboard");
        // }
        // Check if slug is already taken (if provided)
        if (slug) {
            const existingSlug = yield Team_1.default.getBySlug(slug);
            if (existingSlug) {
                req.flash("error_msg", "Team handle is already taken");
                return res.redirect("/player/teams/create");
            }
        }
        const team = yield Team_1.default.createWithDetails(name, playerId, parseInt(team_size), description || null, slug || null, is_recruiting === "true");
        // Check if this is an AJAX/fetch request
        if (req.xhr || ((_a = req.headers.accept) === null || _a === void 0 ? void 0 : _a.includes("application/json"))) {
            res.json({ success: true, message: "Team created successfully!", team });
        }
        else {
            req.flash("success_msg", "Team created successfully!");
            res.redirect("/player/dashboard");
        }
    }
    catch (error) {
        console.error("Create team error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create team";
        // Check if this is an AJAX/fetch request
        if (req.xhr || ((_b = req.headers.accept) === null || _b === void 0 ? void 0 : _b.includes("application/json"))) {
            res
                .status(400)
                .json({ success: false, message: errorMessage, error: String(error) });
        }
        else {
            req.flash("error_msg", errorMessage);
            res.redirect("/player/teams/create");
        }
    }
});
exports.createTeam = createTeam;
const getCreateTeamForm = (req, res) => {
    res.render("player/teams-create", {
        title: "Create Team",
    });
};
exports.getCreateTeamForm = getCreateTeamForm;
const joinTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { teamId } = req.params;
        const { message } = req.body;
        const playerId = parseInt(req.session.user.id);
        // Check if player is already in a team - REMOVED: Allow multiple team memberships
        // const existingTeam = await Team.getPlayerTeam(playerId);
        // if (existingTeam) {
        //   req.flash("error_msg", "You are already in a team");
        //   return res.redirect("/teams/browse");
        // }
        // Get team information to check recruiting status
        const teamQuery = yield db_1.pool.query("SELECT * FROM teams WHERE id = $1", [
            parseInt(teamId),
        ]);
        if (teamQuery.rows.length === 0) {
            req.flash("error_msg", "Team not found");
            return res.redirect("/teams/browse");
        }
        const team = teamQuery.rows[0];
        // Check if team is at capacity
        const memberCountQuery = yield db_1.pool.query(`SELECT COUNT(*) FROM team_members tm 
       JOIN players p ON tm.player_id = p.id 
       WHERE tm.team_id = $1 AND p.deleted_at IS NULL`, [parseInt(teamId)]);
        const currentMembers = parseInt(memberCountQuery.rows[0].count);
        if (currentMembers >= team.team_size) {
            req.flash("error_msg", "This team is already at full capacity");
            return res.redirect("/teams/browse");
        }
        // Check if there's already a pending request
        const existingRequestQuery = yield db_1.pool.query("SELECT status FROM team_join_requests WHERE player_id = $1 AND team_id = $2", [playerId, parseInt(teamId)]);
        if (existingRequestQuery.rows.length > 0) {
            const status = existingRequestQuery.rows[0].status;
            if (status === "pending") {
                req.flash("error_msg", "You already have a pending join request for this team");
                return res.redirect("/teams/browse");
            }
            else if (status === "approved") {
                // Check if they're actually in the team - if not, clean up the stale request
                const memberCheck = yield db_1.pool.query("SELECT * FROM team_members WHERE player_id = $1 AND team_id = $2", [playerId, parseInt(teamId)]);
                if (memberCheck.rows.length === 0) {
                    // Clean up stale approved request
                    yield db_1.pool.query("DELETE FROM team_join_requests WHERE player_id = $1 AND team_id = $2", [playerId, parseInt(teamId)]);
                    // Allow them to create a new request
                }
                else {
                    req.flash("error_msg", "You are already a member of this team");
                    return res.redirect("/teams/browse");
                }
            }
            else if (status === "rejected") {
                // Allow them to try again by deleting the old rejected request
                yield db_1.pool.query("DELETE FROM team_join_requests WHERE player_id = $1 AND team_id = $2", [playerId, parseInt(teamId)]);
            }
        }
        // Handle based on team's recruiting status
        if (team.is_recruiting) {
            // Team is open for direct joining
            const success = yield Team_1.default.addMember(parseInt(teamId), playerId);
            if (success) {
                req.flash("success_msg", `You have successfully joined ${team.name}!`);
                res.redirect("/teams/browse");
            }
            else {
                req.flash("error_msg", "Failed to join team. The team may be at capacity.");
                res.redirect("/teams/browse");
            }
        }
        else {
            // Team requires approval - create join request
            const success = yield Team_1.default.createJoinRequest(playerId, parseInt(teamId), message);
            if (success) {
                req.flash("success_msg", "Join request sent! The team captain will review your request.");
                res.redirect("/teams/browse");
            }
            else {
                req.flash("error_msg", "Failed to send join request. You may already be in a team or have an existing request.");
                res.redirect("/teams/browse");
            }
        }
    }
    catch (error) {
        console.error("Join team error:", error);
        req.flash("error_msg", "Failed to process join request");
        res.redirect("/teams/browse");
    }
});
exports.joinTeam = joinTeam;
const leaveTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playerId = parseInt(req.session.user.id);
        const { teamId } = req.body;
        if (!teamId) {
            req.flash("error_msg", "Team ID is required");
            return res.redirect("back");
        }
        const success = yield Team_1.default.leaveSpecificTeam(playerId, parseInt(teamId));
        if (success) {
            req.flash("success_msg", "You have left the team");
            res.redirect("/player/dashboard");
        }
        else {
            req.flash("error_msg", "You are not a member of this team");
            res.redirect("/player/dashboard");
        }
    }
    catch (error) {
        console.error("Leave team error:", error);
        req.flash("error_msg", "Failed to leave team");
        res.redirect("/teams/dashboard");
    }
});
exports.leaveTeam = leaveTeam;
const getTeamDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playerId = parseInt(req.session.user.id);
        const { teamIdentifier } = req.params;
        let team;
        let isMember = false;
        if (teamIdentifier) {
            // Get specific team by identifier (name slug, actual slug, or ID)
            team = yield Team_1.default.getBySlug(teamIdentifier);
            if (!team) {
                // Try to find by name-based slug
                const teams = yield Team_1.default.getAll();
                team = teams.find((t) => t.name
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, "") === teamIdentifier);
            }
            if (!team) {
                req.flash("error_msg", "Team not found");
                return res.redirect("/teams/browse");
            }
            // Check if user is a member of this team
            const playerTeams = yield Team_1.default.getPlayerTeams(playerId);
            isMember = playerTeams.some((playerTeam) => playerTeam.id === team.id);
        }
        else {
            // Get player's own team if no identifier provided
            team = yield Team_1.default.getPlayerTeam(playerId);
            if (!team) {
                req.flash("error_msg", "You are not in a team");
                return res.redirect("/teams/browse");
            }
            isMember = true;
        }
        const members = yield Team_1.default.getMembers(team.id);
        const stats = yield Team_1.default.getTeamStats(team.id);
        // Check if user is captain of this team
        const isCaptain = yield Team_1.default.isCaptain(playerId, team.id);
        // Get join requests if user is captain
        let joinRequests = [];
        if (isCaptain) {
            joinRequests = yield Team_1.default.getJoinRequests(team.id);
        }
        res.render("teams/dashboard", {
            title: `Team: ${team.name}`,
            team,
            members,
            stats,
            isMember,
            isCaptain,
            joinRequests,
            user: req.session.user, // Pass user session for template checks
        });
    }
    catch (error) {
        console.error("Team dashboard error:", error);
        req.flash("error_msg", "Failed to load team dashboard");
        res.redirect("/player/dashboard");
    }
});
exports.getTeamDashboard = getTeamDashboard;
const browseTeams = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playerId = parseInt(req.session.user.id);
        const teams = yield Team_1.default.getAll();
        // Check if user is already in a team
        const playerTeam = yield Team_1.default.getPlayerTeam(playerId);
        // Get all teams the player is a member of
        const playerTeams = yield Team_1.default.getPlayerTeams(playerId);
        const playerTeamIds = playerTeams.map((team) => team.id);
        res.render("teams/browse", {
            title: "Browse Teams",
            teams,
            playerTeam, // Pass the player's current team info
            playerTeamIds, // Pass all team IDs the player is a member of
        });
    }
    catch (error) {
        console.error("Browse teams error:", error);
        req.flash("error_msg", "Failed to load teams");
        res.redirect("/player/dashboard");
    }
});
exports.browseTeams = browseTeams;
const getTeamComparison = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { team1, team2 } = req.query;
        if (team1 && team2) {
            const comparisonData = yield Team_1.default.compareTeams(parseInt(team1), parseInt(team2));
            res.render("teams/compare", {
                title: "Team Comparison",
                teams: comparisonData,
            });
        }
        else {
            // Show team selection form
            const allTeams = yield Team_1.default.getAll();
            res.render("teams/compare-select", {
                title: "Compare Teams",
                teams: allTeams,
            });
        }
    }
    catch (error) {
        console.error("Team comparison error:", error);
        req.flash("error_msg", "Failed to load team comparison");
        res.redirect("/teams/browse");
    }
});
exports.getTeamComparison = getTeamComparison;
// Check if player is in a team
const checkMembership = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { playerId } = req.params;
        // Direct database query to check team membership
        const query = `
      SELECT t.id, t.name 
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.player_id = $1
    `;
        const result = yield db_1.pool.query(query, [playerId]);
        if (result.rows.length > 0) {
            res.json({ team: result.rows[0] });
        }
        else {
            res.json({ team: null });
        }
    }
    catch (error) {
        console.error("Check membership error:", error);
        res.status(500).json({ error: "Failed to check team membership" });
    }
});
exports.checkMembership = checkMembership;
// ===== TEAM MANAGEMENT CONTROLLERS =====
// Handle join requests (approve/reject)
const handleJoinRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { requestId, action } = req.params;
        const captainId = parseInt(req.session.user.id);
        // Get the team information before processing the request
        const teamResult = yield db_1.pool.query(`SELECT t.* FROM teams t 
       JOIN team_join_requests tjr ON t.id = tjr.team_id 
       WHERE tjr.id = $1`, [parseInt(requestId)]);
        const success = yield Team_1.default.handleJoinRequest(captainId, parseInt(requestId), action);
        if (success) {
            req.flash("success_msg", `Join request ${action}d successfully!`);
        }
        else {
            req.flash("error_msg", `Failed to ${action} join request.`);
        }
        // Redirect back to the team dashboard using slug
        if (teamResult.rows.length > 0) {
            const team = teamResult.rows[0];
            const teamSlug = Team_1.default.getSlug(team);
            res.redirect(`/teams/dashboard/${teamSlug}`);
        }
        else {
            res.redirect("/teams/browse");
        }
    }
    catch (error) {
        console.error("Handle join request error:", error);
        req.flash("error_msg", "Failed to process join request");
        res.redirect("/teams/browse");
    }
});
exports.handleJoinRequest = handleJoinRequest;
// Transfer team captaincy
const transferCaptaincy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { teamId, newCaptainId } = req.body;
        const currentCaptainId = parseInt(req.session.user.id);
        const success = yield Team_1.default.transferCaptaincy(currentCaptainId, parseInt(newCaptainId), parseInt(teamId));
        if (success) {
            req.flash("success_msg", "Captaincy transferred successfully!");
            // Get the team to redirect to the correct dashboard
            const team = yield Team_1.default.getById(parseInt(teamId));
            if (team) {
                const teamSlug = Team_1.default.getSlug(team);
                return res.redirect(`/teams/dashboard/${teamSlug}`);
            }
        }
        else {
            req.flash("error_msg", "Failed to transfer captaincy. Make sure the new captain is a team member.");
        }
        res.redirect("back");
    }
    catch (error) {
        console.error("Transfer captaincy error:", error);
        req.flash("error_msg", "Failed to transfer captaincy");
        res.redirect("back");
    }
});
exports.transferCaptaincy = transferCaptaincy;
// Remove team member
const removeMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { teamId, memberId } = req.body;
        const captainId = parseInt(req.session.user.id);
        const success = yield Team_1.default.removeMember(captainId, parseInt(memberId), parseInt(teamId));
        if (success) {
            req.flash("success_msg", "Member removed from team successfully!");
            // Get the team to redirect to the correct dashboard
            const team = yield Team_1.default.getById(parseInt(teamId));
            if (team) {
                const teamSlug = Team_1.default.getSlug(team);
                return res.redirect(`/teams/dashboard/${teamSlug}`);
            }
        }
        else {
            req.flash("error_msg", "Failed to remove member. Only captains can remove members.");
        }
        res.redirect("back");
    }
    catch (error) {
        console.error("Remove member error:", error);
        req.flash("error_msg", "Failed to remove member");
        res.redirect("back");
    }
});
exports.removeMember = removeMember;
// Update team name
const updateTeamName = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { teamId, newName } = req.body;
        const captainId = parseInt(req.session.user.id);
        if (!newName || newName.trim().length === 0) {
            req.flash("error_msg", "Team name cannot be empty");
            return res.redirect("back");
        }
        const success = yield Team_1.default.updateTeamName(captainId, parseInt(teamId), newName.trim());
        if (success) {
            req.flash("success_msg", "Team name updated successfully!");
            // Get the updated team to redirect to the correct dashboard
            const team = yield Team_1.default.getById(parseInt(teamId));
            if (team) {
                const teamSlug = Team_1.default.getSlug(team);
                return res.redirect(`/teams/dashboard/${teamSlug}`);
            }
        }
        else {
            req.flash("error_msg", "Failed to update team name. Only captains can edit team details.");
        }
        res.redirect("back");
    }
    catch (error) {
        console.error("Update team name error:", error);
        req.flash("error_msg", "Failed to update team name");
        res.redirect("back");
    }
});
exports.updateTeamName = updateTeamName;
// Delete team
const deleteTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { teamId } = req.body;
        const captainId = parseInt(req.session.user.id);
        if (!teamId) {
            req.flash("error_msg", "Team ID is required");
            return res.redirect("back");
        }
        const success = yield Team_1.default.deleteTeam(captainId, parseInt(teamId));
        if (success) {
            req.flash("success_msg", "Team deleted successfully!");
            return res.redirect("/player/dashboard");
        }
        else {
            req.flash("error_msg", "Failed to delete team. Only captains can delete teams.");
        }
        res.redirect("back");
    }
    catch (error) {
        console.error("Delete team error:", error);
        req.flash("error_msg", "Failed to delete team");
        res.redirect("back");
    }
});
exports.deleteTeam = deleteTeam;
// Update team size
const updateTeamSize = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { teamId, newSize } = req.body;
        const captainId = parseInt(req.session.user.id);
        if (!teamId || !newSize) {
            req.flash("error_msg", "Team ID and new size are required");
            return res.redirect("back");
        }
        const parsedSize = parseInt(newSize);
        if (![3, 5, 10, 11].includes(parsedSize)) {
            req.flash("error_msg", "Invalid team size selected");
            return res.redirect("back");
        }
        const success = yield Team_1.default.updateTeamSize(captainId, parseInt(teamId), parsedSize);
        if (success) {
            req.flash("success_msg", "Team size updated successfully!");
            // Get the updated team to redirect to the correct dashboard
            const team = yield Team_1.default.getById(parseInt(teamId));
            if (team) {
                const teamSlug = Team_1.default.getSlug(team);
                return res.redirect(`/teams/dashboard/${teamSlug}`);
            }
        }
        else {
            req.flash("error_msg", "Failed to update team size. Only captains can edit team details.");
        }
        res.redirect("back");
    }
    catch (error) {
        console.error("Update team size error:", error);
        req.flash("error_msg", "Failed to update team size");
        res.redirect("back");
    }
});
exports.updateTeamSize = updateTeamSize;
