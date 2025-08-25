-- Fix overly restrictive check constraints that are causing insertion errors

-- Drop existing check constraints that might be too restrictive
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_gender_check;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_blood_group_check;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_caste_check;

-- Add more flexible check constraints
ALTER TABLE employees ADD CONSTRAINT employees_gender_check 
  CHECK (gender IN ('Male', 'Female', 'male', 'female', 'M', 'F', 'm', 'f', 'Other', 'other', ''));

ALTER TABLE employees ADD CONSTRAINT employees_blood_group_check 
  CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''));

-- Fix machine type constraints
ALTER TABLE machines DROP CONSTRAINT IF EXISTS machines_machine_type_check;
ALTER TABLE machines ADD CONSTRAINT machines_machine_type_check 
  CHECK (machine_type IN ('17 head', '18 head', '28 head', '33 head', '34 head'));

-- Fix bonus type constraints  
ALTER TABLE machine_bonus_rates DROP CONSTRAINT IF EXISTS machine_bonus_rates_bonus_type_check;
ALTER TABLE machine_bonus_rates ADD CONSTRAINT machine_bonus_rates_bonus_type_check 
  CHECK (bonus_type IN ('2 head', 'sheet', '2head', 'Sheet'));

-- Fix employee type constraints
ALTER TABLE machine_salary_rates DROP CONSTRAINT IF EXISTS machine_salary_rates_employee_type_check;
ALTER TABLE machine_salary_rates ADD CONSTRAINT machine_salary_rates_employee_type_check 
  CHECK (employee_type IN ('operator', 'karigar', 'helper', 'Operator', 'Karigar', 'Helper'));

-- Ensure emp_id is unique
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_emp_id_unique;
ALTER TABLE employees ADD CONSTRAINT employees_emp_id_unique UNIQUE (emp_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_emp_id ON employees(emp_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_type_id ON employees(employee_type_id);
CREATE INDEX IF NOT EXISTS idx_machine_bonus_rates_machine_id ON machine_bonus_rates(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_salary_rates_machine_id ON machine_salary_rates(machine_id);
CREATE INDEX IF NOT EXISTS idx_production_records_date ON production_records(date);
CREATE INDEX IF NOT EXISTS idx_salary_records_employee_id ON salary_records(employee_id);
