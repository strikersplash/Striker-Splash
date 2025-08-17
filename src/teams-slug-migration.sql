-- Add slug column to teams table and populate existing teams with slugs
ALTER TABLE teams ADD COLUMN IF NOT EXISTS slug VARCHAR(150) UNIQUE;

-- Function to generate URL-friendly slug from team name
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT) RETURNS TEXT AS $$
DECLARE
    slug TEXT;
BEGIN
    -- Convert to lowercase, replace spaces and special chars with hyphens, remove multiple hyphens
    slug := LOWER(input_text);
    slug := REGEXP_REPLACE(slug, '[^a-z0-9]+', '-', 'g');
    slug := REGEXP_REPLACE(slug, '^-+|-+$', '', 'g'); -- Remove leading/trailing hyphens
    slug := REGEXP_REPLACE(slug, '-+', '-', 'g'); -- Replace multiple hyphens with single
    
    RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Update existing teams with slugs
UPDATE teams 
SET slug = generate_slug(name) 
WHERE slug IS NULL;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);

-- Add trigger to automatically generate slug for new teams
CREATE OR REPLACE FUNCTION teams_generate_slug() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_slug(NEW.name);
        
        -- Handle potential duplicates by appending a number
        WHILE EXISTS (SELECT 1 FROM teams WHERE slug = NEW.slug AND id != COALESCE(NEW.id, -1)) LOOP
            NEW.slug := NEW.slug || '-' || (EXTRACT(EPOCH FROM NOW())::INTEGER % 10000);
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS teams_slug_trigger ON teams;
CREATE TRIGGER teams_slug_trigger 
    BEFORE INSERT OR UPDATE ON teams 
    FOR EACH ROW EXECUTE FUNCTION teams_generate_slug();
