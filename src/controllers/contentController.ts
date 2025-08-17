import { Request, Response } from "express";
import { pool } from "../config/db";

// Get content by section
export const getContentBySection = async (
  section: string
): Promise<Record<string, string>> => {
  try {
    const query = `
      SELECT content_key, content_value 
      FROM site_content 
      WHERE section = $1
    `;
    const result = await pool.query(query, [section]);

    const content: Record<string, string> = {};
    result.rows.forEach((row) => {
      content[row.content_key] = row.content_value;
    });

    return content;
  } catch (error) {
    console.error(`Error fetching content for section ${section}:`, error);
    return {};
  }
};

// Update content
export const updateContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { section, updates } = req.body;

    if (!section || !updates || typeof updates !== "object") {
      res.status(400).json({ success: false, message: "Invalid request data" });
      return;
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const [key, value] of Object.entries(updates)) {
        const query = `
          INSERT INTO site_content (section, content_key, content_value, updated_at) 
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          ON CONFLICT (section, content_key) 
          DO UPDATE SET content_value = $3, updated_at = CURRENT_TIMESTAMP
        `;
        await client.query(query, [section, key, value]);
      }

      await client.query("COMMIT");
      res.json({ success: true, message: "Content updated successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating content:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update content" });
  }
};

// Get editable content for admin panel
export const getEditableContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { section } = req.params;

    const content = await getContentBySection(section);
    res.json({ success: true, content });
  } catch (error) {
    console.error("Error fetching editable content:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch content" });
  }
};
