# 🎨 Icon Setup

The extension needs three icon sizes for Chrome:

- `icon16.png` - Toolbar icon
- `icon48.png` - Extension management page
- `icon128.png` - Chrome Web Store

## Option 1: Generate Placeholder Icons (Fastest)

### Using ImageMagick (macOS/Linux)

```bash
# Install ImageMagick
brew install imagemagick  # macOS
# or: sudo apt-get install imagemagick  # Linux

# Generate blue square icons
cd public
convert -size 16x16 xc:#3b82f6 -gravity center -pointsize 12 -fill white -annotate +0+0 "T" icon16.png
convert -size 48x48 xc:#3b82f6 -gravity center -pointsize 32 -fill white -annotate +0+0 "T" icon48.png
convert -size 128x128 xc:#3b82f6 -gravity center -pointsize 80 -fill white -annotate +0+0 "T" icon128.png
```

### Using Node Script

```bash
npm install sharp  # Install image library
node scripts/generate-icons.js
```

## Option 2: Use Online Tools

1. Go to https://favicon.io/favicon-generator/
2. Create an icon with:
   - Text: "T" or "TL"
   - Background: #3b82f6 (blue)
   - Font: Bold, white
3. Download and extract
4. Rename files to match required sizes
5. Move to `public/` folder

## Option 3: Design Custom Icons

Use any design tool (Figma, Sketch, Canva):

1. Create three artboards: 16×16, 48×48, 128×128
2. Design your icon (keep it simple and recognizable)
3. Export as PNG
4. Name them correctly (icon16.png, icon48.png, icon128.png)
5. Place in `public/` folder

## Option 4: Use Emoji (Quick & Fun)

```bash
# macOS/Linux with ImageMagick
cd public
convert -size 16x16 xc:white -gravity center -pointsize 14 -annotate +0+0 "🎯" icon16.png
convert -size 48x48 xc:white -gravity center -pointsize 40 -annotate +0+0 "🎯" icon48.png
convert -size 128x128 xc:white -gravity center -pointsize 100 -annotate +0+0 "🎯" icon128.png
```

## Verification

After adding icons:

1. Rebuild: `npm run build`
2. Check `dist/` folder has the icons
3. Reload extension in Chrome
4. Icon should appear in toolbar

## Troubleshooting

**Icons not showing:**
- Make sure files are PNG format (not SVG, not JPEG)
- Check file names match exactly (case-sensitive)
- Icons must be in `public/` folder before building
- Rebuild after adding icons

**Blurry icons:**
- Make sure you're using the correct pixel dimensions
- Don't resize - create at actual size
- Use PNG, not JPEG (no compression artifacts)

