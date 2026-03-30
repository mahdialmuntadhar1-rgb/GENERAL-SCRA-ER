# Supabase Schema for Iraq Business Discovery

Run this SQL in your Supabase SQL Editor to set up the database.

```sql
-- Create the businesses table
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  local_name TEXT,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  governorate TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  confidence_score FLOAT DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common filters
CREATE INDEX idx_businesses_city ON businesses(city);
CREATE INDEX idx_businesses_category ON businesses(category);
CREATE INDEX idx_businesses_source ON businesses(source);

-- Add a unique constraint for basic deduplication
-- Note: This is a strict constraint. In production, you might prefer 
-- application-level logic or a more flexible index.
-- ALTER TABLE businesses ADD CONSTRAINT unique_business UNIQUE (name, phone, city);
```

## Setup Instructions

1. Create a new Supabase project.
2. Run the SQL above in the SQL Editor.
3. Copy your `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to your secrets/env.
4. Add `GEMINI_API_KEY` to your secrets.
5. Run `npm run dev` to start the app.
