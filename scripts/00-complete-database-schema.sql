-- =====================================================
-- COMPLETE DATABASE SCHEMA FOR MANUFACTURING MANAGEMENT SYSTEM
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS AND CUSTOM TYPES
-- =====================================================

-- Machine types enum
CREATE TYPE machine_type_enum AS ENUM ('17 head', '18 head', '28 head', '33 head', '34 head');

-- Gender enum
CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');

-- Blood group enum
CREATE TYPE blood_group_enum AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- Bonus type enum
CREATE TYPE bonus_type_enum AS ENUM ('2 head', 'sheet');

-- Day type enum for salary calculations
CREATE TYPE day_type_enum AS ENUM ('normal', 'friday', 'holiday');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Employee Types Table
CREATE TABLE employee_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    has_fixed_salary BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    is_core_type BOOLEAN NOT NULL DEFAULT false, -- for operator, karigar, helper
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Machines Table
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

-- Machine Bonus Rates Table
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

-- Machine Salary Rates Table
CREATE TABLE machine_salary_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    employee_type_name VARCHAR(100) NOT NULL,
    daily_rate DECIMAL(10,2) NOT NULL CHECK (daily_rate >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT machine_salary_rates_unique UNIQUE (machine_id, employee_type_name),
    
    -- Foreign key to employee types
    CONSTRAINT fk_employee_type FOREIGN KEY (employee_type_name) REFERENCES employee_types(name) ON UPDATE CASCADE
);

-- Employees Table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emp_id VARCHAR(20) NOT NULL UNIQUE, -- EMP1, EMP2, etc.
    name VARCHAR(200) NOT NULL,
    father_name VARCHAR(200) NOT NULL,
    date_of_birth DATE NOT NULL,
    cnic VARCHAR(20) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    designation_id UUID NOT NULL REFERENCES employee_types(id),
    salary DECIMAL(10,2) CHECK (salary >= 0), -- Only for fixed salary employees
    caste VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    gender gender_enum NOT NULL,
    blood_group blood_group_enum,
    reference_name VARCHAR(200),
    contact_person_name VARCHAR(200),
    contact_person_phone VARCHAR(20),
    contact_person_relation VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Check constraints
    CONSTRAINT employees_age_check CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '16 years'),
    CONSTRAINT employees_cnic_format CHECK (cnic ~ '^[0-9]{5}-[0-9]{7}-[0-9]$'),
    CONSTRAINT employees_phone_format CHECK (phone ~ '^[0-9+\-\s()]+$')
);

-- Advances Table
CREATE TABLE advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    date_given DATE NOT NULL DEFAULT CURRENT_DATE,
    is_deducted BOOLEAN NOT NULL DEFAULT false,
    deducted_from_salary_id UUID, -- Reference to salary record when deducted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for performance
    INDEX idx_advances_employee_id (employee_id),
    INDEX idx_advances_date_given (date_given)
);

-- Salary Records Table
CREATE TABLE salary_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    base_salary DECIMAL(10,2) NOT NULL CHECK (base_salary >= 0),
    working_days INTEGER NOT NULL CHECK (working_days >= 0),
    friday_days INTEGER NOT NULL DEFAULT 0 CHECK (friday_days >= 0),
    normal_leaves INTEGER NOT NULL DEFAULT 0 CHECK (normal_leaves >= 0),
    friday_leaves INTEGER NOT NULL DEFAULT 0 CHECK (friday_leaves >= 0),
    holidays INTEGER NOT NULL DEFAULT 0 CHECK (holidays >= 0),
    bonus DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (bonus >= 0),
    advance_deducted DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (advance_deducted >= 0),
    total_salary DECIMAL(10,2) NOT NULL CHECK (total_salary >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate salary records
    CONSTRAINT salary_records_unique UNIQUE (employee_id, month, year),
    
    -- Indexes for performance
    INDEX idx_salary_records_employee_month_year (employee_id, year, month),
    INDEX idx_salary_records_date (year, month)
);

-- Production Records Table (for bonus calculations)
CREATE TABLE production_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_type day_type_enum NOT NULL DEFAULT 'normal',
    bonus_type bonus_type_enum NOT NULL,
    stitches BIGINT NOT NULL CHECK (stitches >= 0),
    bonus_amount DECIMAL(10,2) NOT NULL CHECK (bonus_amount >= 0),
    operator_id UUID REFERENCES employees(id),
    karigar_id UUID REFERENCES employees(id),
    helper_id UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_production_records_machine_date (machine_id, date),
    INDEX idx_production_records_date (date),
    INDEX idx_production_records_employees (operator_id, karigar_id, helper_id)
);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate next employee ID
CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS VARCHAR(20) AS $$
DECLARE
    next_id INTEGER;
    new_emp_id VARCHAR(20);
BEGIN
    -- Get the next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(emp_id FROM 4) AS INTEGER)), 0) + 1
    INTO next_id
    FROM employees
    WHERE emp_id ~ '^EMP[0-9]+$';
    
    -- Generate new employee ID
    new_emp_id := 'EMP' || next_id::TEXT;
    
    RETURN new_emp_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate salary with Friday multiplier
CREATE OR REPLACE FUNCTION calculate_salary_with_multiplier(
    base_salary DECIMAL(10,2),
    total_days INTEGER,
    working_days INTEGER,
    friday_days INTEGER,
    normal_leaves INTEGER DEFAULT 0,
    friday_leaves INTEGER DEFAULT 0,
    holidays INTEGER DEFAULT 0,
    bonus DECIMAL DEFAULT 0
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    daily_rate DECIMAL(10,2);
    friday_rate DECIMAL(10,2);
    normal_working_days INTEGER;
    effective_friday_days INTEGER;
    salary_amount DECIMAL(10,2);
BEGIN
    -- Calculate daily rate
    daily_rate := base_salary / total_days;
    friday_rate := daily_rate * 2.5;
    
    -- Calculate effective working days
    normal_working_days := working_days - friday_days - normal_leaves;
    effective_friday_days := friday_days - friday_leaves;
    
    -- Calculate salary
    salary_amount := (normal_working_days * daily_rate) + 
                    (effective_friday_days * friday_rate) + 
                    (holidays * friday_rate) + 
                    bonus;
    
    RETURN GREATEST(salary_amount, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get bonus rate for specific stitch count
CREATE OR REPLACE FUNCTION get_bonus_rate(
    p_machine_id UUID,
    p_bonus_type bonus_type_enum,
    p_stitch_count BIGINT
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    bonus_rate DECIMAL(10,2);
BEGIN
    -- Get the highest stitch count rate that is <= the given stitch count
    SELECT rate INTO bonus_rate
    FROM machine_bonus_rates
    WHERE machine_id = p_machine_id 
      AND bonus_type = p_bonus_type 
      AND stitch_count <= p_stitch_count
    ORDER BY stitch_count DESC
    LIMIT 1;
    
    -- If no rate found, return 0
    RETURN COALESCE(bonus_rate, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate bonus amount
CREATE OR REPLACE FUNCTION calculate_bonus_amount(
    p_machine_id UUID,
    p_bonus_type bonus_type_enum,
    p_stitch_count BIGINT
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    rate DECIMAL(10,2);
    bonus_amount DECIMAL(10,2);
BEGIN
    -- Get the bonus rate
    rate := get_bonus_rate(p_machine_id, p_bonus_type, p_stitch_count);
    
    -- Calculate bonus (rate per 1000 stitches or similar logic)
    bonus_amount := (p_stitch_count::DECIMAL / 1000) * rate;
    
    RETURN GREATEST(bonus_amount, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get days in month
CREATE OR REPLACE FUNCTION get_days_in_month(p_year INTEGER, p_month INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(DAY FROM (DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1)) + INTERVAL '1 month - 1 day'));
END;
$$ LANGUAGE plpgsql;

-- Function to count Fridays in month
CREATE OR REPLACE FUNCTION count_fridays_in_month(p_year INTEGER, p_month INTEGER)
RETURNS INTEGER AS $$
DECLARE
    first_day DATE;
    last_day DATE;
    friday_count INTEGER := 0;
    current_date DATE;
BEGIN
    first_day := MAKE_DATE(p_year, p_month, 1);
    last_day := first_day + INTERVAL '1 month - 1 day';
    
    current_date := first_day;
    WHILE current_date <= last_day LOOP
        IF EXTRACT(DOW FROM current_date) = 5 THEN -- Friday is 5
            friday_count := friday_count + 1;
        END IF;
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
    
    RETURN friday_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to auto-generate employee ID
CREATE OR REPLACE FUNCTION trigger_generate_employee_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.emp_id IS NULL OR NEW.emp_id = '' THEN
        NEW.emp_id := generate_employee_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_generate_id_trigger
    BEFORE INSERT ON employees
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_employee_id();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp trigger to relevant tables
CREATE TRIGGER employees_update_timestamp_trigger
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER machines_update_timestamp_trigger
    BEFORE UPDATE ON machines
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER employee_types_update_timestamp_trigger
    BEFORE UPDATE ON employee_types
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER production_records_update_timestamp_trigger
    BEFORE UPDATE ON production_records
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_timestamp();

-- Trigger to mark advance as deducted when referenced in salary record
CREATE OR REPLACE FUNCTION trigger_mark_advance_deducted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.advance_deducted > 0 THEN
        -- Mark advances as deducted
        UPDATE advances 
        SET is_deducted = true, deducted_from_salary_id = NEW.id
        WHERE employee_id = NEW.employee_id 
          AND is_deducted = false 
          AND amount <= NEW.advance_deducted;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salary_records_advance_trigger
    AFTER INSERT OR UPDATE ON salary_records
    FOR EACH ROW
    EXECUTE FUNCTION trigger_mark_advance_deducted();

-- =====================================================
-- VIEWS
-- =====================================================

-- Employee Summary View
CREATE VIEW employee_summary AS
SELECT 
    e.id,
    e.emp_id,
    e.name,
    e.father_name,
    e.phone,
    e.city,
    e.gender,
    et.name as designation,
    et.has_fixed_salary,
    e.salary,
    e.is_active,
    COALESCE(adv.total_advances, 0) as total_advances,
    COALESCE(adv.pending_advances, 0) as pending_advances,
    e.created_at
FROM employees e
JOIN employee_types et ON e.designation_id = et.id
LEFT JOIN (
    SELECT 
        employee_id,
        SUM(amount) as total_advances,
        SUM(CASE WHEN is_deducted = false THEN amount ELSE 0 END) as pending_advances
    FROM advances
    GROUP BY employee_id
) adv ON e.id = adv.employee_id;

-- Machine Summary View
CREATE VIEW machine_summary AS
SELECT 
    m.id,
    m.name,
    m.company,
    m.machine_type,
    m.is_active,
    COUNT(DISTINCT mbr.id) as bonus_rates_count,
    COUNT(DISTINCT msr.id) as salary_rates_count,
    m.created_at
FROM machines m
LEFT JOIN machine_bonus_rates mbr ON m.id = mbr.machine_id
LEFT JOIN machine_salary_rates msr ON m.id = msr.machine_id
GROUP BY m.id, m.name, m.company, m.machine_type, m.is_active, m.created_at;

-- Monthly Salary Summary View
CREATE VIEW monthly_salary_summary AS
SELECT 
    sr.year,
    sr.month,
    COUNT(*) as total_employees,
    SUM(sr.base_salary) as total_base_salary,
    SUM(sr.bonus) as total_bonus,
    SUM(sr.advance_deducted) as total_advances_deducted,
    SUM(sr.total_salary) as total_salary_paid,
    AVG(sr.total_salary) as average_salary
FROM salary_records sr
GROUP BY sr.year, sr.month
ORDER BY sr.year DESC, sr.month DESC;

-- Production Summary View
CREATE VIEW production_summary AS
SELECT 
    pr.date,
    m.name as machine_name,
    m.machine_type,
    pr.bonus_type,
    SUM(pr.stitches) as total_stitches,
    SUM(pr.bonus_amount) as total_bonus,
    COUNT(*) as production_entries
FROM production_records pr
JOIN machines m ON pr.machine_id = m.id
GROUP BY pr.date, m.id, m.name, m.machine_type, pr.bonus_type
ORDER BY pr.date DESC;

-- Employee Performance View
CREATE VIEW employee_performance AS
SELECT 
    e.emp_id,
    e.name,
    et.name as designation,
    COUNT(DISTINCT pr.date) as working_days,
    SUM(pr.stitches) as total_stitches,
    SUM(pr.bonus_amount) as total_bonus_earned,
    AVG(pr.stitches) as avg_daily_stitches
FROM employees e
JOIN employee_types et ON e.designation_id = et.id
LEFT JOIN production_records pr ON e.id IN (pr.operator_id, pr.karigar_id, pr.helper_id)
WHERE et.name IN ('operator', 'karigar', 'helper')
GROUP BY e.id, e.emp_id, e.name, et.name;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Employees indexes
CREATE INDEX idx_employees_emp_id ON employees(emp_id);
CREATE INDEX idx_employees_designation ON employees(designation_id);
CREATE INDEX idx_employees_active ON employees(is_active);
CREATE INDEX idx_employees_name ON employees(name);
CREATE INDEX idx_employees_cnic ON employees(cnic);

-- Machines indexes
CREATE INDEX idx_machines_type ON machines(machine_type);
CREATE INDEX idx_machines_active ON machines(is_active);
CREATE INDEX idx_machines_name ON machines(name);

-- Machine bonus rates indexes
CREATE INDEX idx_bonus_rates_machine ON machine_bonus_rates(machine_id);
CREATE INDEX idx_bonus_rates_type_stitch ON machine_bonus_rates(bonus_type, stitch_count);

-- Machine salary rates indexes
CREATE INDEX idx_salary_rates_machine ON machine_salary_rates(machine_id);
CREATE INDEX idx_salary_rates_employee_type ON machine_salary_rates(employee_type_name);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE employee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_bonus_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_salary_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_records ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for authenticated users)
-- In production, you might want more restrictive policies

CREATE POLICY "Allow all operations for authenticated users" ON employee_types
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON machines
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON machine_bonus_rates
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON machine_salary_rates
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON employees
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON advances
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON salary_records
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON production_records
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert core employee types
INSERT INTO employee_types (name, has_fixed_salary, description, is_core_type) VALUES
('operator', false, 'Machine operator for production work', true),
('karigar', false, 'Skilled worker for production work', true),
('helper', false, 'Assistant worker for production work', true),
('supervisor', true, 'Production supervisor with fixed salary', false),
('manager', true, 'Department manager with fixed salary', false),
('admin', true, 'Administrative staff with fixed salary', false);

-- =====================================================
-- UTILITY FUNCTIONS FOR APPLICATION
-- =====================================================

-- Function to get employee's pending advances
CREATE OR REPLACE FUNCTION get_employee_pending_advances(p_employee_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_pending DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total_pending
    FROM advances
    WHERE employee_id = p_employee_id AND is_deducted = false;
    
    RETURN total_pending;
END;
$$ LANGUAGE plpgsql;

-- Function to get machine's salary rate for employee type
CREATE OR REPLACE FUNCTION get_machine_salary_rate(
    p_machine_id UUID,
    p_employee_type VARCHAR(100)
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    daily_rate DECIMAL(10,2);
BEGIN
    SELECT msr.daily_rate INTO daily_rate
    FROM machine_salary_rates msr
    WHERE msr.machine_id = p_machine_id 
      AND msr.employee_type_name = p_employee_type;
    
    RETURN COALESCE(daily_rate, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate monthly statistics
CREATE OR REPLACE FUNCTION get_monthly_stats(p_year INTEGER, p_month INTEGER)
RETURNS TABLE(
    total_employees BIGINT,
    total_salary_paid DECIMAL(10,2),
    total_bonus_paid DECIMAL(10,2),
    total_advances_deducted DECIMAL(10,2),
    average_salary DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COALESCE(SUM(sr.total_salary), 0),
        COALESCE(SUM(sr.bonus), 0),
        COALESCE(SUM(sr.advance_deducted), 0),
        COALESCE(AVG(sr.total_salary), 0)
    FROM salary_records sr
    WHERE sr.year = p_year AND sr.month = p_month;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE employee_types IS 'Stores different types of employees (operator, karigar, helper, supervisor, etc.)';
COMMENT ON TABLE machines IS 'Stores machine information with types (17/18/28/33/34 head)';
COMMENT ON TABLE machine_bonus_rates IS 'Stores bonus rates for different stitch counts per machine and bonus type';
COMMENT ON TABLE machine_salary_rates IS 'Stores daily salary rates for different employee types per machine';
COMMENT ON TABLE employees IS 'Stores complete employee information with auto-generated EMP IDs';
COMMENT ON TABLE advances IS 'Stores advance payments given to employees';
COMMENT ON TABLE salary_records IS 'Stores monthly salary calculations with Friday multipliers and deductions';
COMMENT ON TABLE production_records IS 'Stores daily production data for bonus calculations';

COMMENT ON FUNCTION generate_employee_id() IS 'Generates sequential employee IDs (EMP1, EMP2, etc.)';
COMMENT ON FUNCTION calculate_salary_with_multiplier(DECIMAL, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, DECIMAL) IS 'Calculates salary with Friday 2.5x multiplier and deductions';
COMMENT ON FUNCTION get_bonus_rate(UUID, bonus_type_enum, BIGINT) IS 'Gets appropriate bonus rate for given stitch count';
COMMENT ON FUNCTION calculate_bonus_amount(UUID, bonus_type_enum, BIGINT) IS 'Calculates total bonus amount for given stitches';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Manufacturing Management System database schema created successfully!';
    RAISE NOTICE 'Tables: % created', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE');
    RAISE NOTICE 'Functions: % created', (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION');
    RAISE NOTICE 'Views: % created', (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public');
END $$;
