import fs from 'fs';

const sizes = [16, 48, 128];

function createSVGIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#4A90E2"/>
    <rect x="${size * 0.1}" y="${size * 0.3}" width="${size * 0.8}" height="${size * 0.6}" fill="#FFFFFF"/>
    <circle cx="${size * 0.5}" cy="${size * 0.6}" r="${size * 0.15}" fill="#4A90E2" stroke="#FFFFFF" stroke-width="${size * 0.05}"/>
    <rect x="${size * 0.65}" y="${size * 0.25}" width="${size * 0.2}" height="${size * 0.1}" fill="#FFFFFF"/>
  </svg>`;
}

sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  fs.writeFileSync(`public/icon${size}.svg`, svgContent);
  console.log(`Created icon${size}.svg`);
});

console.log('Icons created successfully!');