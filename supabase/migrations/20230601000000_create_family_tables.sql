-- Create families table
CREATE TABLE families (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_code TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  native_place TEXT NOT NULL,
  gotra TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create family_members table
CREATE TABLE family_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  marital_status TEXT NOT NULL,
  married_to_other_samaj BOOLEAN NOT NULL,
  education TEXT NOT NULL,
  mobile_number TEXT,
  email TEXT,
  job_role TEXT,
  job_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on family_id for better query performance
CREATE INDEX idx_family_members_family_id ON family_members(family_id);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_families_updated_at
BEFORE UPDATE ON families
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON family_members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

