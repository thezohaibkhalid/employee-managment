-- Add stitch_count column to machine_bonus_rates table
-- This allows storing different bonus rates for different stitch ranges

-- First, drop the existing unique constraint
ALTER TABLE machine_bonus_rates DROP CONSTRAINT IF EXISTS machine_bonus_rates_machine_id_bonus_type_key;

-- Add the stitch_count column
ALTER TABLE machine_bonus_rates ADD COLUMN IF NOT EXISTS stitch_count INTEGER DEFAULT 0;

-- Create new unique constraint that includes stitch_count
ALTER TABLE machine_bonus_rates ADD CONSTRAINT machine_bonus_rates_machine_id_bonus_type_stitch_count_key 
UNIQUE (machine_id, bonus_type, stitch_count);

-- Update existing records to have stitch_count = 0 (for backward compatibility)
UPDATE machine_bonus_rates SET stitch_count = 0 WHERE stitch_count IS NULL;

-- Make stitch_count NOT NULL
ALTER TABLE machine_bonus_rates ALTER COLUMN stitch_count SET NOT NULL;
