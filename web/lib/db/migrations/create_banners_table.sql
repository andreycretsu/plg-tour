-- Migration: Create banners table
-- Date: 2024-12-06

CREATE TABLE IF NOT EXISTS banners (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  workspace_id INTEGER,
  name VARCHAR(255) NOT NULL,
  url_pattern VARCHAR(500) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  -- Content
  title TEXT,
  body TEXT,
  image_url VARCHAR(500),
  button_text VARCHAR(100),
  -- Position (custom position on page)
  position_x VARCHAR(20) DEFAULT 'center', -- 'left', 'center', 'right', or pixel value
  position_y VARCHAR(20) DEFAULT 'top', -- 'top', 'center', 'bottom', or pixel value
  offset_x INTEGER DEFAULT 0, -- Additional offset in pixels
  offset_y INTEGER DEFAULT 0, -- Additional offset in pixels
  -- Size
  width INTEGER DEFAULT 400,
  height INTEGER DEFAULT 'auto', -- 'auto' or pixel value
  -- Styling (similar to tooltips)
  card_bg_color VARCHAR(7) DEFAULT '#ffffff',
  card_text_color VARCHAR(7) DEFAULT '#1f2937',
  card_border_radius INTEGER DEFAULT 12,
  card_padding INTEGER DEFAULT 20,
  card_shadow VARCHAR(100) DEFAULT '0 4px 20px rgba(0,0,0,0.15)',
  text_align VARCHAR(10) DEFAULT 'left',
  card_blur_intensity INTEGER DEFAULT 0,
  card_bg_opacity INTEGER DEFAULT 100,
  -- Typography
  title_size INTEGER DEFAULT 16,
  body_size INTEGER DEFAULT 14,
  body_line_height DECIMAL(3,2) DEFAULT 1.5,
  -- Button styling
  button_color VARCHAR(7) DEFAULT '#3b82f6',
  button_text_color VARCHAR(7) DEFAULT '#ffffff',
  button_border_radius INTEGER DEFAULT 8,
  button_size VARCHAR(10) DEFAULT 'm',
  button_position VARCHAR(10) DEFAULT 'left',
  button_type VARCHAR(10) DEFAULT 'regular',
  -- Advanced
  z_index INTEGER DEFAULT 2147483647,
  delay_ms INTEGER DEFAULT 0,
  -- Frequency
  frequency_type VARCHAR(20) DEFAULT 'once',
  frequency_count INTEGER DEFAULT 1,
  frequency_days INTEGER DEFAULT 7,
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banners_user_id ON banners(user_id);
CREATE INDEX IF NOT EXISTS idx_banners_workspace_id ON banners(workspace_id);
CREATE INDEX IF NOT EXISTS idx_banners_url_pattern ON banners(url_pattern);

