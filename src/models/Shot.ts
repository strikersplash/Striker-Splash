import { pool, executeQuery } from '../config/db';

export interface IShot {
  id: number;
  player_id: number;
  amount: number;
  shots_quantity: number;
  payment_status: string;
  payment_reference?: string;
  timestamp: Date;
}

class Shot {
  // Execute a query directly
  static async query(text: string, params: any[]): Promise<any> {
    try {
      return await executeQuery(text, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Find shots by player ID
  static async find(criteria: { player_id?: number }): Promise<IShot[]> {
    try {
      if (criteria.player_id) {
        const result = await executeQuery('SELECT * FROM shots WHERE player_id = $1 ORDER BY timestamp DESC', [criteria.player_id]);
        return result.rows;
      }
      
      const result = await executeQuery('SELECT * FROM shots ORDER BY timestamp DESC LIMIT 100');
      return result.rows;
    } catch (error) {
      console.error('Error finding shots:', error);
      return [];
    }
  }

  // Create new shot
  static async create(shotData: Omit<IShot, 'id' | 'timestamp'>): Promise<IShot | null> {
    try {
      const { player_id, amount, shots_quantity, payment_status, payment_reference } = shotData;
      
      const result = await executeQuery(
        'INSERT INTO shots (player_id, amount, shots_quantity, payment_status, payment_reference) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [player_id, amount, shots_quantity, payment_status, payment_reference]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating shot:', error);
      return null;
    }
  }

  // Get daily revenue
  static async getDailyRevenue(date?: Date): Promise<number> {
    try {
      const targetDate = date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const result = await executeQuery(
        'SELECT SUM(amount) as total FROM shots WHERE payment_status = $1 AND timestamp >= $2 AND timestamp <= $3',
        ['completed', startOfDay, endOfDay]
      );
      
      return parseFloat(result.rows[0]?.total || '0');
    } catch (error) {
      console.error('Error getting daily revenue:', error);
      return 0;
    }
  }

  // Get revenue by date range
  static async getRevenueByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const query = `
        SELECT 
          DATE(timestamp) as date,
          SUM(amount) as total
        FROM 
          shots
        WHERE 
          payment_status = $1 AND timestamp >= $2 AND timestamp <= $3
        GROUP BY 
          DATE(timestamp)
        ORDER BY 
          date
      `;
      
      const result = await executeQuery(query, ['completed', startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error getting revenue by date range:', error);
      return [];
    }
  }

  // Count shots by player
  static async countByPlayer(playerId: number): Promise<number> {
    try {
      const result = await executeQuery(
        'SELECT SUM(shots_quantity) as total FROM shots WHERE player_id = $1 AND payment_status = $2',
        [playerId, 'completed']
      );
      
      return parseInt(result.rows[0]?.total || '0');
    } catch (error) {
      console.error('Error counting shots by player:', error);
      return 0;
    }
  }
}

export default Shot;