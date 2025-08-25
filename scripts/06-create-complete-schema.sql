-- Manufacturing Management System Database Schema
-- Fixed version with 'caste' instead of 'cast'

-- Employee Types Table
CREATE TABLE IF NOT EXISTS employee_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  has_fixed_salary BOOLEAN NOT NULL DEFAULT false,
  is_core_type BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Machines Table
CREATE TABLE IF NOT EXISTS machines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  company VARCHAR(200) NOT NULL,
  machine_type VARCHAR(10) NOT NULL CHECK (machine_type IN ('17', '18', '28', '33', '34')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Machine Bonus Rates Table
CREATE TABLE IF NOT EXISTS machine_bonus_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  bonus_type VARCHAR(50) NOT NULL, -- '2 head', 'sheet', etc.
  rate DECIMAL(10,2) NOT NULL,
  stitch_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(machine_id, bonus_type)
);

-- Machine Salary Rates Table
CREATE TABLE IF NOT EXISTS machine_salary_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  employee_type VARCHAR(50) NOT NULL, -- 'operator', 'karigar', 'helper'
  daily_rate DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(machine_id, employee_type)
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  emp_id VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  father_name VARCHAR(200),
  date_of_birth DATE,
  cnic VARCHAR(20),
  phone VARCHAR(20),
  address TEXT,
  employee_type_id UUID NOT NULL REFERENCES employee_types(id),
  salary DECIMAL(10,2), -- Only for fixed salary employees
  caste VARCHAR(100), -- Changed from 'cast' to 'caste'
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
CREATE TABLE IF NOT EXISTS employee_advances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salary Records Table (for fixed salary employees)
CREATE TABLE IF NOT EXISTS salary_records (
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

-- Production Records Table (for bonus calculations)
CREATE TABLE IF NOT EXISTS production_records (
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
CREATE TABLE IF NOT EXISTS monthly_production_summary (
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

-- Insert default employee types
INSERT INTO employee_types (name, has_fixed_salary, is_core_type) VALUES
('operator', false, true),
('karigar', false, true),
('helper', false, true),
('supervisor', true, true)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_emp_id ON employees(emp_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_type ON employees(employee_type_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_employee_month ON salary_records(employee_id, month, year);
CREATE INDEX IF NOT EXISTS idx_production_records_machine_date ON production_records(machine_id, date);
CREATE INDEX IF NOT EXISTS idx_production_records_date ON production_records(date);
CREATE INDEX IF NOT EXISTS idx_employee_advances_employee ON employee_advances(employee_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_employee_types_updated_at ON employee_types;
DROP TRIGGER IF EXISTS update_machines_updated_at ON machines;
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;

CREATE TRIGGER update_employee_types_updated_at BEFORE UPDATE ON employee_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
