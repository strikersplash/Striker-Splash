import { Request, Response } from 'express';
import { pool } from '../../config/db';

// Display age bracket management page
export const getAgeBrackets = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this page
    if (!(req.session as any).user || (req.session as any).user.role !== 'admin') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    // Get all age brackets
    const bracketsQuery = `
      SELECT * FROM age_brackets
      ORDER BY min_age
    `;
    
    const bracketsResult = await pool.query(bracketsQuery);
    const ageBrackets = bracketsResult.rows;
    
    res.render('admin/age-brackets', {
      title: 'Age Brackets',
      ageBrackets
    });
  } catch (error) {
    console.error('Age brackets error:', error);
    req.flash('error_msg', 'An error occurred while loading age brackets');
    res.redirect('/admin/dashboard');
  }
};

// Add age bracket
export const addAgeBracket = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!(req.session as any).user || (req.session as any).user.role !== 'admin') {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { name, minAge, maxAge } = req.body;
    
    // Validate input
    if (!name || minAge === undefined || maxAge === undefined) {
      res.status(400).json({ success: false, message: 'Name, minimum age, and maximum age are required' });
      return;
    }
    
    // Check for overlapping age ranges
    const overlapQuery = `
      SELECT * FROM age_brackets
      WHERE 
        (min_age <= $1 AND max_age >= $1) OR
        (min_age <= $2 AND max_age >= $2) OR
        (min_age >= $1 AND max_age <= $2)
    `;
    
    const overlapResult = await pool.query(overlapQuery, [minAge, maxAge]);
    
    if (overlapResult.rows.length > 0) {
      res.status(400).json({ success: false, message: 'Age range overlaps with existing bracket' });
      return;
    }
    
    // Add new age bracket
    const insertQuery = `
      INSERT INTO age_brackets (name, min_age, max_age, active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const insertResult = await pool.query(insertQuery, [name, minAge, maxAge, true]);
    
    res.json({
      success: true,
      ageBracket: insertResult.rows[0]
    });
  } catch (error) {
    console.error('Add age bracket error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while adding age bracket' });
  }
};

// Update age bracket
export const updateAgeBracket = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!(req.session as any).user || (req.session as any).user.role !== 'admin') {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { id } = req.params;
    const { name, minAge, maxAge, active } = req.body;
    
    // Validate input
    if (!name || minAge === undefined || maxAge === undefined || active === undefined) {
      res.status(400).json({ success: false, message: 'Name, minimum age, maximum age, and active status are required' });
      return;
    }
    
    // Check for overlapping age ranges (excluding this bracket)
    const overlapQuery = `
      SELECT * FROM age_brackets
      WHERE 
        id != $1 AND
        (
          (min_age <= $2 AND max_age >= $2) OR
          (min_age <= $3 AND max_age >= $3) OR
          (min_age >= $2 AND max_age <= $3)
        )
    `;
    
    const overlapResult = await pool.query(overlapQuery, [id, minAge, maxAge]);
    
    if (overlapResult.rows.length > 0) {
      res.status(400).json({ success: false, message: 'Age range overlaps with existing bracket' });
      return;
    }
    
    // Update age bracket
    const updateQuery = `
      UPDATE age_brackets
      SET name = $1, min_age = $2, max_age = $3, active = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, [name, minAge, maxAge, active, id]);
    
    if (updateResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Age bracket not found' });
      return;
    }
    
    res.json({
      success: true,
      ageBracket: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Update age bracket error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating age bracket' });
  }
};

// Delete age bracket
export const deleteAgeBracket = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!(req.session as any).user || (req.session as any).user.role !== 'admin') {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { id } = req.params;
    
    // Check if age bracket is in use
    const usageQuery = `
      SELECT COUNT(*) as count FROM players
      WHERE age_group = (SELECT name FROM age_brackets WHERE id = $1)
    `;
    
    const usageResult = await pool.query(usageQuery, [id]);
    
    if (parseInt(usageResult.rows[0].count) > 0) {
      res.status(400).json({ success: false, message: 'Cannot delete age bracket that is in use' });
      return;
    }
    
    // Delete age bracket
    await pool.query('DELETE FROM age_brackets WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Age bracket deleted successfully'
    });
  } catch (error) {
    console.error('Delete age bracket error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting age bracket' });
  }
};