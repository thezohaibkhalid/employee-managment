-- Seed initial data for Manufacturing Management System

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

-- Get machine IDs for bonus and salary rates
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

    -- Insert bonus rates for different machine types
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

    -- Insert salary rates for different employee types
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
