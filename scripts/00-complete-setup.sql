-- Complete Manufacturing Management System Database Setup
-- This script creates all tables and seeds initial data

-- Drop existing tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS monthly_production_summary CASCADE;
DROP TABLE IF EXISTS production_records CASCADE;
DROP TABLE IF EXISTS salary_records CASCADE;
DROP TABLE IF EXISTS employee_advances CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS machine_salary_rates CASCADE;
DROP TABLE IF EXISTS machine_bonus_rates CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS employee_types CASCADE;

-- Employee Types Table
CREATE TABLE employee_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  has_fixed_salary BOOLEAN NOT NULL DEFAULT false,
  is_core_type BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Machines Table
CREATE TABLE machines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  company VARCHAR(200) NOT NULL,
  machine_type VARCHAR(10) NOT NULL CHECK (machine_type IN ('17', '18', '28', '33', '34')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Machine Bonus Rates Table
CREATE TABLE machine_bonus_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  bonus_type VARCHAR(50) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(machine_id, bonus_type)
);

-- Machine Salary Rates Table
CREATE TABLE machine_salary_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  employee_type VARCHAR(50) NOT NULL,
  daily_rate DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(machine_id, employee_type)
);

-- Employees Table
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  emp_id VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  father_name VARCHAR(200),
  date_of_birth DATE,
  cnic VARCHAR(20),
  phone VARCHAR(20),
  address TEXT,
  employee_type_id UUID NOT NULL REFERENCES employee_types(id),
  salary DECIMAL(10,2),
  caste VARCHAR(100),
  city VARCHAR(100),
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  blood_group VARCHAR(5),
  reference_name VARCHAR(200),
  reference_phone VARCHAR(20),
  contact_person_name VARCHAR(200),
  contact_person_phone VARCHAR(20),
  contact_person_relation VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Advances Table
CREATE TABLE employee_advances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salary Records Table
CREATE TABLE salary_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  base_salary DECIMAL(10,2) NOT NULL,
  working_days INTEGER NOT NULL,
  friday_days INTEGER NOT NULL DEFAULT 0,
  normal_leaves INTEGER NOT NULL DEFAULT 0,
  friday_leaves INTEGER NOT NULL DEFAULT 0,
  holidays INTEGER NOT NULL DEFAULT 0,
  total_salary DECIMAL(10,2) NOT NULL,
  advance_deduction DECIMAL(10,2) NOT NULL DEFAULT 0,
  bonus DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_salary DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, month, year)
);

-- Production Records Table
CREATE TABLE production_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  operator_id UUID REFERENCES employees(id),
  karigar_id UUID REFERENCES employees(id),
  helper_id UUID REFERENCES employees(id),
  bonus_type VARCHAR(50) NOT NULL,
  stitches INTEGER NOT NULL DEFAULT 0,
  bonus_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  operator_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  karigar_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  helper_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(machine_id, date)
);

-- Monthly Production Summary Table
CREATE TABLE monthly_production_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  total_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_bonus DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  working_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(machine_id, employee_id, month, year)
);

-- Create indexes for better performance
CREATE INDEX idx_employees_emp_id ON employees(emp_id);
CREATE INDEX idx_employees_employee_type ON employees(employee_type_id);
CREATE INDEX idx_salary_records_employee_month ON salary_records(employee_id, month, year);
CREATE INDEX idx_production_records_machine_date ON production_records(machine_id, date);
CREATE INDEX idx_production_records_date ON production_records(date);
CREATE INDEX idx_employee_advances_employee ON employee_advances(employee_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_employee_types_updated_at BEFORE UPDATE ON employee_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default employee types
INSERT INTO employee_types (name, has_fixed_salary, is_core_type) VALUES
('Operator', false, true),
('Karigar', false, true),
('Helper', false, true),
('Supervisor', true, false),
('Manager', true, false),
('Admin', true, false),
('Accountant', true, false);

-- Insert sample machines
INSERT INTO machines (name, company, machine_type) VALUES
('Machine A1', 'Brother Industries', '17'),
('Machine B2', 'Juki Corporation', '18'),
('Machine C3', 'Singer Company', '28'),
('Machine D4', 'Janome', '33'),
('Machine E5', 'Bernina', '34');

-- Insert bonus and salary rates
DO $$
DECLARE
    machine_17_id UUID;
    machine_18_id UUID;
    machine_28_id UUID;
    machine_33_id UUID;
    machine_34_id UUID;
BEGIN
    SELECT id INTO machine_17_id FROM machines WHERE machine_type = '17' LIMIT 1;
    SELECT id INTO machine_18_id FROM machines WHERE machine_type = '18' LIMIT 1;
    SELECT id INTO machine_28_id FROM machines WHERE machine_type = '28' LIMIT 1;
    SELECT id INTO machine_33_id FROM machines WHERE machine_type = '33' LIMIT 1;
    SELECT id INTO machine_34_id FROM machines WHERE machine_type = '34' LIMIT 1;

    -- Insert bonus rates
    INSERT INTO machine_bonus_rates (machine_id, bonus_type, rate) VALUES
    (machine_17_id, '2 head', 0.50),
    (machine_17_id, 'sheet', 0.75),
    (machine_18_id, '2 head', 0.55),
    (machine_18_id, 'sheet', 0.80),
    (machine_28_id, '2 head', 0.60),
    (machine_28_id, 'sheet', 0.85),
    (machine_33_id, '2 head', 0.65),
    (machine_33_id, 'sheet', 0.90),
    (machine_34_id, '2 head', 0.70),
    (machine_34_id, 'sheet', 0.95);

    -- Insert salary rates
    INSERT INTO machine_salary_rates (machine_id, employee_type, daily_rate) VALUES
    (machine_17_id, 'operator', 1500.00),
    (machine_17_id, 'karigar', 1200.00),
    (machine_17_id, 'helper', 800.00),
    (machine_18_id, 'operator', 1600.00),
    (machine_18_id, 'karigar', 1300.00),
    (machine_18_id, 'helper', 850.00),
    (machine_28_id, 'operator', 1700.00),
    (machine_28_id, 'karigar', 1400.00),
    (machine_28_id, 'helper', 900.00),
    (machine_33_id, 'operator', 1800.00),
    (machine_33_id, 'karigar', 1500.00),
    (machine_33_id, 'helper', 950.00),
    (machine_34_id, 'operator', 1900.00),
    (machine_34_id, 'karigar', 1600.00),
    (machine_34_id, 'helper', 1000.00);
END $$;
