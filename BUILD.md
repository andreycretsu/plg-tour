# 🔨 Build Instructions

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate PNG Icons from SVG

The `public/` folder contains SVG icons, but Chrome extensions require PNG format.

**Option A: Using ImageMagick (Recommended)**

```bash
# Install ImageMagick
brew install imagemagick  # macOS
# sudo apt-get install imagemagick  # Linux

# Convert SVGs to PNGs
cd public
convert icon16.svg icon16.png
convert icon48.svg icon48.png
convert icon128.svg icon128.png
cd ..
```

**Option B: Online Converter**

1. Go to https://svgtopng.com/
2. Upload `icon16.svg`, `icon48.svg`, `icon128.svg` from `public/`
3. Download PNG versions
4. Place them in `public/` folder

**Option C: Skip Icons (Temporary)**

Chrome may still load the extension with SVG icons, though it prefers PNG.

### 3. Build the Extension

```bash
npm run build
```

This creates a `dist/` folder with:
- `content.js` - Content script (injected into pages)
- `background.js` - Service worker
- `popup.js` - Popup interface
- `popup/index.html` - Popup HTML
- `manifest.json` - Extension manifest
- All icon files

### 4. Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder
5. Extension should appear with TourLayer icon

### 5. Test It

1. Visit any website (e.g., https://example.com)
2. Click TourLayer icon in toolbar
3. Click "Create New Tour"
4. Editor sidebar should appear!

## Development Mode

For live development with hot reload:

```bash
npm run dev
```

After making code changes:
1. The build will auto-update
2. Go to `chrome://extensions/`
3. Click refresh icon on TourLayer
4. Reload your test webpage

## Common Build Issues

### "Cannot find module '@/types/tour'"

**Fix:** TypeScript path aliases need baseUrl set.

Check `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### "Failed to resolve import './styles.css?inline'"

**Fix:** Vite needs to process CSS as inline string.

This is already configured. If issue persists:
```bash
rm -rf node_modules dist
npm install
npm run build
```

### "Manifest file is missing or unreadable"

**Fix:** Make sure `public/manifest.json` exists and copies to `dist/`.

Check `vite.config.ts` has `publicDir` or manually copy:
```bash
cp public/manifest.json dist/
```

### Icons not showing in Chrome

**Fix:** Chrome prefers PNG over SVG.

Convert SVG icons to PNG (see step 2 above).

### TypeScript errors about 'chrome' namespace

**Fix:** Install Chrome types:
```bash
npm install --save-dev @types/chrome
```

Already in package.json, but run if missing.

## Build Optimization

### For Development
```bash
npm run dev
```
- Fast rebuild
- No minification
- Source maps enabled

### For Production
```bash
npm run build
```
- Minified code
- Optimized assets
- Smaller bundle size

## File Structure After Build

```
dist/
├── manifest.json
├── content.js          # ~200KB (React + components)
├── background.js       # ~2KB (service worker)
├── popup.js           # ~50KB (popup UI)
├── popup/
│   └── index.html
├── content.css        # Injected styles
├── icon16.png (or .svg)
├── icon48.png (or .svg)
└── icon128.png (or .svg)
```

## Packaging for Distribution

To create a ZIP for Chrome Web Store:

```bash
npm run build
cd dist
zip -r tourlayer-extension.zip .
```

Upload `tourlayer-extension.zip` to Chrome Web Store Developer Dashboard.

## Cleaning Build Artifacts

```bash
rm -rf dist node_modules
npm install
npm run build
```

This ensures a completely fresh build.

---

**Having issues?** Check:
1. Node.js version: `node -v` (should be 18+)
2. npm version: `npm -v` (should be 8+)
3. All files in `src/` directory exist
4. No TypeScript errors: `npx tsc --noEmit`

