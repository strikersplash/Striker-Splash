import { Request, Response } from 'express';
import { pool } from '../../config/db';
import Staff from '../../models/Staff';

// Display staff duty management page
export const getStaffDutyManagement = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this page
    if (!req.session.user || req.session.user.role !== 'admin') {
      req.flash('error_msg', 'Unauthorized access');
      return res.redirect('/auth/login');
    }
    
    // Get all staff members
    const staffMembers = await Staff.find();
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get staff on duty today
    const dutyQuery = `
      SELECT 
        sod.id, sod.staff_id, sod.role, sod.duty_date,
        s.name, s.username
      FROM 
        staff_on_duty sod
      JOIN
        staff s ON sod.staff_id = s.id
      WHERE 
        sod.duty_date = $1
      ORDER BY
        sod.role
    `;
    
    const dutyResult = await pool.query(dutyQuery, [today]);
    const staffOnDuty = dutyResult.rows;
    
    res.render('admin/staff-duty', {
      title: 'Staff on Duty',
      staffMembers,
      staffOnDuty,
      today
    });
  } catch (error) {
    console.error('Staff duty management error:', error);
    req.flash('error_msg', 'An error occurred while loading staff duty management');
    res.redirect('/admin/dashboard');
  }
};

// Add staff to duty
export const addStaffToDuty = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!req.session.user || req.session.user.role !== 'admin') {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { staffId, role, date } = req.body;
    
    // Validate input
    if (!staffId || !role || !date) {
      res.status(400).json({ success: false, message: 'Staff ID, role, and date are required' });
      return;
    }
    
    // Check if staff exists
    const staff = await Staff.findById(parseInt(staffId));
    
    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff not found' });
      return;
    }
    
    // Check if staff already on duty for this date
    const existingDutyQuery = `
      SELECT * FROM staff_on_duty
      WHERE staff_id = $1 AND duty_date = $2
    `;
    
    const existingDutyResult = await pool.query(existingDutyQuery, [staffId, date]);
    
    if (existingDutyResult.rows.length > 0) {
      // Update existing duty
      await pool.query(
        'UPDATE staff_on_duty SET role = $1 WHERE staff_id = $2 AND duty_date = $3',
        [role, staffId, date]
      );
    } else {
      // Add new duty
      await pool.query(
        'INSERT INTO staff_on_duty (staff_id, role, duty_date) VALUES ($1, $2, $3)',
        [staffId, role, date]
      );
    }
    
    // Get updated staff on duty
    const updatedDutyQuery = `
      SELECT 
        sod.id, sod.staff_id, sod.role, sod.duty_date,
        s.name, s.username
      FROM 
        staff_on_duty sod
      JOIN
        staff s ON sod.staff_id = s.id
      WHERE 
        sod.staff_id = $1 AND sod.duty_date = $2
    `;
    
    const updatedDutyResult = await pool.query(updatedDutyQuery, [staffId, date]);
    
    res.json({
      success: true,
      staffOnDuty: updatedDutyResult.rows[0]
    });
  } catch (error) {
    console.error('Add staff to duty error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while adding staff to duty' });
  }
};

// Remove staff from duty
export const removeStaffFromDuty = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow admin to access this API
    if (!req.session.user || req.session.user.role !== 'admin') {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }
    
    const { id } = req.params;
    
    // Delete duty record
    await pool.query('DELETE FROM staff_on_duty WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Staff removed from duty'
    });
  } catch (error) {
    console.error('Remove staff from duty error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while removing staff from duty' });
  }
};