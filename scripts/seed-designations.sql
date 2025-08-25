-- Create script to seed core designations
INSERT INTO "Designation" (id, name, "isVariablePay", slug, notes, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'operator', true, 'operator', 'Production worker - variable pay based on output', NOW(), NOW()),
  (gen_random_uuid(), 'karigar', true, 'karigar', 'Skilled worker - variable pay based on output', NOW(), NOW()),
  (gen_random_uuid(), 'helper', true, 'helper', 'Assistant worker - variable pay based on output', NOW(), NOW()),
  (gen_random_uuid(), 'supervisor', false, 'supervisor', 'Team supervisor - fixed monthly salary', NOW(), NOW()),
  (gen_random_uuid(), 'manager', false, 'manager', 'Department manager - fixed monthly salary', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
