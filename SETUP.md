# 🚀 Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- Chrome browser
- Basic command line knowledge

## Step-by-Step Installation

### 1. Install Dependencies

Open your terminal in the project folder and run:

```bash
npm install
```

This will download all the necessary packages (React, TypeScript, Tailwind, etc.)

### 2. Build the Extension

```bash
npm run build
```

You'll see a new `dist/` folder appear with all the compiled code.

### 3. Add Icons

Before loading into Chrome, you need to add placeholder icons to `public/`:

- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)  
- `icon128.png` (128x128 pixels)

You can use any image or create simple colored squares for now.

**Quick icon generation** (if you have ImageMagick):

```bash
# macOS
brew install imagemagick

# Create simple blue square icons
convert -size 16x16 xc:#3b82f6 public/icon16.png
convert -size 48x48 xc:#3b82f6 public/icon48.png
convert -size 128x128 xc:#3b82f6 public/icon128.png
```

### 4. Load Extension in Chrome

1. Open Chrome
2. Type `chrome://extensions/` in the address bar
3. Toggle "Developer mode" ON (top right corner)
4. Click "Load unpacked" button
5. Select the `dist/` folder from this project
6. You should see "TourLayer" appear in your extensions list!

### 5. Test It Out

1. Navigate to any website (try https://example.com)
2. Click the TourLayer extension icon in Chrome toolbar
3. Click "Create New Tour"
4. The editor sidebar should appear on the right
5. Click "Add Step" and hover over elements on the page
6. Click an element to select it
7. Fill in the title and description
8. Click "Save Step"
9. Click "Save Tour"

### 6. Run a Tour

1. Click the extension icon again
2. Click "View All Tours"
3. Click on your saved tour
4. You should see a pulsing blue beacon appear
5. Click the beacon to see your tooltip!

## Development Mode

If you want to make changes and see them update:

```bash
npm run dev
```

This watches for file changes. After making edits:

1. Save your files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the TourLayer extension
4. Reload the webpage you're testing on

## Troubleshooting

### "Module not found" errors

Make sure you ran `npm install` first.

### Extension not showing up

- Check that you selected the `dist/` folder (not the root folder)
- Make sure the build completed successfully
- Try clicking the refresh icon in chrome://extensions/

### Sidebar not appearing

- Open Chrome DevTools (F12)
- Check the Console for errors
- Make sure you're on a real website (not chrome:// pages)

### Icons missing

- Add the icon files to the `public/` folder
- Rebuild: `npm run build`
- Reload the extension in Chrome

## Next Steps

Check out `README.md` for the full documentation on:
- How the architecture works
- How to customize styles
- Advanced features
- API reference

---

**Need Help?** Open an issue with:
- What you tried
- What error message you saw
- Screenshot if possible

