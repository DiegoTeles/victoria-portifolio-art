ALTER TABLE artworks ADD COLUMN IF NOT EXISTS extra_resolutions JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS extra_media_bytes JSONB NOT NULL DEFAULT '[]'::jsonb;
