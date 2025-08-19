"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = void 0;
const db_1 = require("../config/db");
// Get top players by age group and/or location
const getLeaderboard = async (ageGroup, location, limit = 10) => {
    try {
        let query = `
      SELECT 
        p.id as "playerId",
        p.name as "playerName",
        p.age_group as "ageGroup",
        p.residence,
        SUM(gs.goals) as "totalGoals"
      FROM 
        game_stats gs
      JOIN 
        players p ON gs.player_id = p.id
    `;
        const values = [];
        const conditions = [];
        if (ageGroup && ageGroup !== 'all') {
            conditions.push(`p.age_group = $${values.length + 1}`);
            values.push(ageGroup);
        }
        if (location && location !== 'all') {
            conditions.push(`p.residence ILIKE $${values.length + 1}`);
            values.push(`%${location}%`);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += `
      GROUP BY 
        p.id, p.name, p.age_group, p.residence
      ORDER BY 
        "totalGoals" DESC
      LIMIT $${values.length + 1}
    `;
        values.push(limit);
        const result = await db_1.pool.query(query, values);
        return result.rows.map(row => ({
            playerId: row.playerId.toString(),
            playerName: row.playerName,
            ageGroup: row.ageGroup,
            residence: row.residence,
            totalGoals: parseInt(row.totalGoals)
        }));
    }
    catch (error) {
        console.error('Leaderboard error:', error);
        throw new Error('Failed to retrieve leaderboard data');
    }
};
exports.getLeaderboard = getLeaderboard;
