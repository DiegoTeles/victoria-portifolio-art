CREATE TABLE IF NOT EXISTS artworks (
  id TEXT PRIMARY KEY,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  artwork_date DATE NOT NULL,
  description JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_url TEXT,
  video_url TEXT,
  orientation TEXT NOT NULL CHECK (orientation IN ('square', 'horizontal', 'vertical')),
  group_key TEXT,
  group_display TEXT,
  types JSONB NOT NULL DEFAULT '[]'::jsonb,
  info JSONB,
  resolution JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artworks_order ON artworks (order_index);
CREATE INDEX IF NOT EXISTS idx_artworks_artwork_date ON artworks (artwork_date);
