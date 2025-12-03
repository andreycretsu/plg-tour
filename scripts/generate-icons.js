/**
 * Simple script to generate placeholder icons
 * Run with: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSvgIcon = (size) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#3b82f6" rx="4"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="${size * 0.5}" font-weight="bold">T</text>
  </svg>`;
};

// Ensure public directory exists
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Note: In a real setup, you'd use a library like sharp or jimp to convert SVG to PNG
// For now, we'll create SVG files that Chrome can use temporarily

const sizes = [16, 48, 128];

sizes.forEach(size => {
  const svg = createSvgIcon(size);
  const filename = path.join(publicDir, `icon${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`✅ Created ${filename}`);
});

console.log('\n📝 Note: Chrome extensions prefer PNG icons.');
console.log('You can use an online tool to convert these SVGs to PNGs:');
console.log('- https://svgtopng.com/');
console.log('- Or use ImageMagick: convert icon.svg icon.png\n');

