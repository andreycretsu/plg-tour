-- Migration: Add customization fields to tours table
-- Date: 2024-12-06

ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS card_width INTEGER DEFAULT 400,
ADD COLUMN IF NOT EXISTS text_align VARCHAR(10) DEFAULT 'left',
ADD COLUMN IF NOT EXISTS card_blur_intensity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS card_bg_opacity INTEGER DEFAULT 100;

