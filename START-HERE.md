# 🚀 START HERE - TourLayer Setup

Welcome! This is your **zero-code product tour builder** Chrome Extension. Think Hopscotch or Pendo, but you don't need to wait for developers to install code first.

## What You're About to Build

A Chrome Extension that lets you:
- ✨ Click elements on any website to create tour steps
- 🎯 Add pulsing beacons and beautiful tooltips
- 💾 Save tours and replay them anytime
- 🔒 Works on any site without installing anything on that site

## 3-Minute Setup

### Step 1: Install Packages

Open Terminal in this folder and run:

```bash
npm install
```

This downloads React, TypeScript, Tailwind, and everything else needed.

### Step 2: Convert Icons

The extension needs PNG icons. You have 3 options:

**A) Use ImageMagick (if you have it):**
```bash
brew install imagemagick
cd public
convert icon16.svg icon16.png
convert icon48.svg icon48.png
convert icon128.svg icon128.png
cd ..
```

**B) Use online converter:**
- Go to https://svgtopng.com/
- Upload the 3 SVG files from `public/` folder
- Download as PNG
- Put them back in `public/` folder

**C) Skip for now:**
- Chrome might work with SVG (not guaranteed)
- You can add PNGs later

### Step 3: Build

```bash
npm run build
```

You'll see a new `dist/` folder appear. This is your extension!

### Step 4: Load in Chrome

1. Open Chrome
2. Go to: `chrome://extensions/`
3. Turn ON "Developer mode" (top-right toggle)
4. Click "Load unpacked" button
5. Choose the `dist/` folder
6. Done! You'll see TourLayer in your extensions

### Step 5: Try It Out

1. Visit any website (try https://example.com)
2. Click the TourLayer icon in Chrome toolbar (top-right)
3. Click "Create New Tour"
4. You should see a sidebar appear on the right!

## Creating Your First Tour

1. **Add a step**: Click the "Add Step" button in the sidebar
2. **Pick an element**: Hover over elements on the page (they'll highlight in blue)
3. **Click to select**: Click any element you want to add to the tour
4. **Fill in details**:
   - Title: "Welcome!" 
   - Content: "This is your dashboard"
   - Button text: "Next"
5. **Save**: Click "Save Step"
6. **Add more steps**: Repeat for other elements
7. **Save tour**: Click "Save Tour" when done

## Playing a Tour

1. Click TourLayer icon
2. Click "View All Tours"
3. Click your saved tour
4. You'll see pulsing blue beacons appear on the page
5. Click a beacon to open the tooltip
6. Navigate with Next/Back buttons

## Development Tips

### Making Changes

```bash
npm run dev
```

This watches for changes. After editing code:
1. Save your file
2. Go to `chrome://extensions/`
3. Click refresh on TourLayer
4. Reload your webpage

### File Structure

```
src/
├── components/        # UI components (Beacon, Tooltip, etc.)
├── hooks/            # React hooks (element picker)
├── store/            # State management (Zustand)
├── utils/            # Helper functions
├── types/            # TypeScript interfaces
├── content/          # Main extension code
├── popup/            # Extension popup
└── background/       # Chrome service worker
```

### Key Files

- `src/content/index.tsx` - Entry point, sets up Shadow DOM
- `src/components/EditorSidebar.tsx` - The builder interface
- `src/components/TourPlayer.tsx` - Plays tours
- `src/utils/selector.ts` - Smart selector generation
- `public/manifest.json` - Chrome extension config

## Common Issues

### "Extension error" in Chrome

**Fix:** Check the Console in `chrome://extensions/` for error details.

### Sidebar not appearing

**Fix:** 
- Open DevTools (F12) on the webpage
- Check Console for errors
- Make sure you clicked "Create New Tour" in popup
- Try a different website (not chrome:// pages)

### Elements not highlighting

**Fix:**
- Click "Add Step" button first
- Make sure you're in "picking" mode
- Don't hover over the sidebar itself

### Icons missing

**Fix:**
- Convert SVGs to PNGs (see Step 2)
- Rebuild: `npm run build`
- Reload extension in Chrome

## Next Steps

- Read `README.md` for full documentation
- Check `BUILD.md` for advanced build options
- See `ICONS.md` for custom icon creation
- Explore the code in `src/` folder

## Architecture Highlights

This extension uses some clever tech:

1. **Shadow DOM**: All UI is isolated from the host page (no style conflicts!)
2. **Smart Selectors**: Generates robust CSS selectors (id → data-testid → class → nth-child)
3. **Mutation Observer**: Waits for dynamically loaded elements (works with SPAs)
4. **Floating UI**: Tooltips position themselves intelligently
5. **Zustand**: Lightweight state management

## Need Help?

1. Check if Node.js is 18+: `node -v`
2. Check if build succeeded: `ls dist/`
3. Look for TypeScript errors: `npx tsc --noEmit`
4. Check Chrome Console: DevTools → Console

---

**You're all set!** 🎉

The extension is ready to use. Start creating tours on any website without needing developers to install anything first. That's the power of the Chrome Extension-first approach!

**Pro tip:** Try building a tour on a site you use often (Gmail, GitHub, Notion, etc.) to see how powerful this is.

