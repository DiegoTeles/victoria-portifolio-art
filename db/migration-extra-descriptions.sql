ALTER TABLE artworks ADD COLUMN IF NOT EXISTS extra_descriptions JSONB NOT NULL DEFAULT '[]'::jsonb;
