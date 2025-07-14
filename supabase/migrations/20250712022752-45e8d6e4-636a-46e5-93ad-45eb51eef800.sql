-- Add signature_coordinates column to store exact field coordinates
ALTER TABLE signature_fields 
ADD COLUMN IF NOT EXISTS signature_coordinates TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN signature_fields.signature_coordinates IS 'JSON string containing exact signature field coordinates: {x, y, width, height} in percentages';