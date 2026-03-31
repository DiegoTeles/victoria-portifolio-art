CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS category_translations (
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('pt-Br', 'en', 'fr', 'it', 'de')),
  name TEXT NOT NULL,
  PRIMARY KEY (category_id, locale)
);

CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (category_id, slug)
);

CREATE TABLE IF NOT EXISTS subcategory_translations (
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('pt-Br', 'en', 'fr', 'it', 'de')),
  name TEXT NOT NULL,
  PRIMARY KEY (subcategory_id, locale)
);

CREATE TABLE IF NOT EXISTS artwork_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id TEXT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_artwork_categories_art_cat_only
  ON artwork_categories (artwork_id, category_id)
  WHERE subcategory_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_artwork_categories_art_sub
  ON artwork_categories (artwork_id, subcategory_id)
  WHERE subcategory_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_artwork_categories_artwork ON artwork_categories (artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_categories_category ON artwork_categories (category_id);

CREATE TABLE IF NOT EXISTS bio_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale TEXT NOT NULL UNIQUE CHECK (locale IN ('pt-Br', 'en', 'fr', 'it', 'de')),
  content TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS curriculum_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale TEXT NOT NULL UNIQUE CHECK (locale IN ('pt-Br', 'en', 'fr', 'it', 'de')),
  content TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network TEXT NOT NULL,
  url TEXT NOT NULL,
  label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
