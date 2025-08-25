-- Fix machine and bonus rate issues
-- This script addresses the machine type constraint and bonus rate column issues

-- First, ensure we have the correct machine type enum
DROP TYPE IF EXISTS machine_type_enum CASCADE;
CREATE TYPE machine_type_enum AS ENUM ('17 head', '18 head', '28 head', '33 head', '34 head');

-- Drop and recreate machines table with proper constraints
DROP TABLE IF EXISTS machines CASCADE;
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    company VARCHAR(200) NOT NULL,
    machine_type machine_type_enum NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT machines_name_company_unique UNIQUE (name, company)
);

-- Create proper bonus type enum that includes all three types
DROP TYPE IF EXISTS bonus_type_enum CASCADE;
CREATE TYPE bonus_type_enum AS ENUM ('stitch', '2 head', 'sheet');

-- Drop and recreate machine_bonus_rates table with proper structure
DROP TABLE IF EXISTS machine_bonus_rates CASCADE;
CREATE TABLE machine_bonus_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    bonus_type bonus_type_enum NOT NULL,
    stitch_count BIGINT NOT NULL DEFAULT 0,
    rate DECIMAL(10,2) NOT NULL CHECK (rate >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate rates for same machine, bonus type, and stitch count
    CONSTRAINT machine_bonus_rates_unique UNIQUE (machine_id, bonus_type, stitch_count)
);

-- Drop and recreate machine_salary_rates table
DROP TABLE IF EXISTS machine_salary_rates CASCADE;
CREATE TABLE machine_salary_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    employee_type VARCHAR(100) NOT NULL,
    daily_rate DECIMAL(10,2) NOT NULL CHECK (daily_rate >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT machine_salary_rates_unique UNIQUE (machine_id, employee_type)
);

-- Enable RLS on new tables
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_bonus_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_salary_rates ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Allow all operations for authenticated users" ON machines
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON machine_bonus_rates
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON machine_salary_rates
    FOR ALL USING (true);

-- Add some sample data
INSERT INTO machines (name, company, machine_type) VALUES
('Machine 1', 'Brother', '17 head'),
('Machine 2', 'Juki', '18 head'),
('Machine 3', 'Singer', '28 head');

-- Add sample bonus rates
INSERT INTO machine_bonus_rates (machine_id, bonus_type, stitch_count, rate) 
SELECT m.id, 'stitch', 0, 10.00 FROM machines m WHERE m.name = 'Machine 1'
UNION ALL
SELECT m.id, '2 head', 0, 15.00 FROM machines m WHERE m.name = 'Machine 1'
UNION ALL
SELECT m.id, 'sheet', 0, 20.00 FROM machines m WHERE m.name = 'Machine 1';

-- Add sample salary rates
INSERT INTO machine_salary_rates (machine_id, employee_type, daily_rate)
SELECT m.id, 'operator', 500.00 FROM machines m WHERE m.name = 'Machine 1'
UNION ALL
SELECT m.id, 'karigar', 400.00 FROM machines m WHERE m.name = 'Machine 1'
UNION ALL
SELECT m.id, 'helper', 300.00 FROM machines m WHERE m.name = 'Machine 1';
