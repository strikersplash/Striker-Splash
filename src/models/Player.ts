import { pool } from '../config/db';
import bcrypt from 'bcryptjs';

export interface IPlayer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  dob: Date;
  residence: string;
  qr_hash: string;
  age_group: string;
  gender?: string;
  photo_path?: string;
  password_hash?: string;
  name_locked: boolean;
  name_change_count: number;
  kicks_balance: number;
  created_at: Date;
  updated_at: Date;
}

class Player {
  // Execute a query directly
  static async query(text: string, params: any[]): Promise<any> {
    try {
      return await pool.query(text, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Find player by ID
  static async findById(id: number): Promise<IPlayer | null> {
    try {
      const result = await pool.query('SELECT * FROM players WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding player by ID:', error);
      return null;
    }
  }

  // Find player by phone
  static async findByPhone(phone: string): Promise<IPlayer | null> {
    try {
      const result = await pool.query('SELECT * FROM players WHERE phone = $1', [phone]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding player by phone:', error);
      return null;
    }
  }

  // Find player by email
  static async findByEmail(email: string): Promise<IPlayer | null> {
    try {
      const result = await pool.query('SELECT * FROM players WHERE email = $1', [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding player by email:', error);
      return null;
    }
  }

  // Find player by QR hash
  static async findByQRHash(qrHash: string): Promise<IPlayer | null> {
    try {
      const result = await pool.query('SELECT * FROM players WHERE qr_hash = $1', [qrHash]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding player by QR hash:', error);
      return null;
    }
  }

  // Create new player
  static async create(playerData: Omit<IPlayer, 'id' | 'created_at' | 'updated_at' | 'name_locked' | 'name_change_count' | 'kicks_balance'>): Promise<IPlayer | null> {
    try {
      const { name, phone, email, dob, residence, qr_hash, age_group, gender, photo_path, password_hash } = playerData;
      
      // Hash password if provided
      let hashedPassword = password_hash;
      if (password_hash && !password_hash.startsWith('$2a$')) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password_hash, salt);
      }
      
      const result = await pool.query(
        'INSERT INTO players (name, phone, email, dob, residence, qr_hash, age_group, gender, photo_path, password_hash, name_locked, name_change_count, kicks_balance) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, 0, 0) RETURNING *',
        [name, phone, email, dob, residence, qr_hash, age_group, gender, photo_path, hashedPassword]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating player:', error);
      return null;
    }
  }

  // Update player
  static async update(id: number, updateData: Partial<IPlayer>): Promise<IPlayer | null> {
    try {
      const { name, phone, email, dob, residence, gender, photo_path, password_hash, name_locked, name_change_count } = updateData;
      
      // Hash password if provided
      let hashedPassword = password_hash;
      if (password_hash && !password_hash.startsWith('$2a$')) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password_hash, salt);
      }
      
      const result = await pool.query(
        'UPDATE players SET name = COALESCE($1, name), phone = COALESCE($2, phone), email = COALESCE($3, email), dob = COALESCE($4, dob), residence = COALESCE($5, residence), gender = COALESCE($6, gender), photo_path = COALESCE($7, photo_path), password_hash = COALESCE($8, password_hash), name_locked = COALESCE($9, name_locked), name_change_count = COALESCE($10, name_change_count), updated_at = NOW() WHERE id = $11 RETURNING *',
        [name, phone, email, dob, residence, gender, photo_path, hashedPassword, name_locked, name_change_count, id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating player:', error);
      return null;
    }
  }

  // Update player's kicks balance
  static async updateKicksBalance(id: number, amount: number): Promise<IPlayer | null> {
    try {
      const result = await pool.query(
        'UPDATE players SET kicks_balance = kicks_balance + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [amount, id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating kicks balance:', error);
      return null;
    }
  }

  // Compare password
  static async comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  // Count all players
  static async countDocuments(): Promise<number> {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM players');
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting players:', error);
      return 0;
    }
  }

  // Search players by name or phone
  static async search(query: string): Promise<IPlayer[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM players WHERE name ILIKE $1 OR phone LIKE $2 OR email ILIKE $3 LIMIT 10',
        [`%${query}%`, `%${query}%`, `%${query}%`]
      );
      return result.rows;
    } catch (error) {
      console.error('Error searching players:', error);
      return [];
    }
  }
}

export default Player;