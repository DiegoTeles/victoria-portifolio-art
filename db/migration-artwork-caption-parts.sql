ALTER TABLE artworks ADD COLUMN IF NOT EXISTS caption_medium JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS physical_dimensions JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS extra_titles JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS extra_caption_media JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS extra_physical_dimensions JSONB NOT NULL DEFAULT '[]'::jsonb;
