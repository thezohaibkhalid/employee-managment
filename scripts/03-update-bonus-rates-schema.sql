-- Update machine_bonus_rates table to support stitch ranges
-- Drop the old unique constraint
ALTER TABLE machine_bonus_rates DROP CONSTRAINT machine_bonus_rates_machine_id_bonus_type_key;

-- Add stitch_count column
ALTER TABLE machine_bonus_rates ADD COLUMN stitch_count INTEGER NOT NULL DEFAULT 0;

-- Create new unique constraint that includes stitch_count
ALTER TABLE machine_bonus_rates ADD CONSTRAINT machine_bonus_rates_machine_id_bonus_type_stitch_key 
  UNIQUE(machine_id, bonus_type, stitch_count);

-- Create index for better performance on stitch_count queries
CREATE INDEX idx_machine_bonus_rates_stitch_count ON machine_bonus_rates(stitch_count);
