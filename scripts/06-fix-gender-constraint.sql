-- Fix gender constraint to accept lowercase values
-- Drop existing constraint and create new one with correct values

-- Drop the existing gender check constraint
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_gender_check;

-- Add new constraint that accepts the values from our form
ALTER TABLE employees ADD CONSTRAINT employees_gender_check 
CHECK (gender IN ('male', 'female', 'other'));

-- Also ensure other constraints are flexible
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_blood_group_check;

-- Add flexible blood group constraint
ALTER TABLE employees ADD CONSTRAINT employees_blood_group_check 
CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') OR blood_group IS NULL);

-- Fix bonus type constraints for machine_bonus_rates
ALTER TABLE machine_bonus_rates DROP CONSTRAINT IF EXISTS machine_bonus_rates_bonus_type_check;

-- Add flexible bonus type constraint
ALTER TABLE machine_bonus_rates ADD CONSTRAINT machine_bonus_rates_bonus_type_check 
CHECK (bonus_type IN ('stitch', '2 head', 'sheet'));

-- Fix machine type constraints
ALTER TABLE machines DROP CONSTRAINT IF EXISTS machines_machine_type_check;

-- Add flexible machine type constraint  
ALTER TABLE machines ADD CONSTRAINT machines_machine_type_check 
CHECK (machine_type IN ('17 head', '18 head', '28 head', '33 head', '34 head'));
