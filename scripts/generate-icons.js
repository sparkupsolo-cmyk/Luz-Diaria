import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create beautiful SVG icon for browser tab and vector display
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#451a03" />
      <stop offset="50%" stop-color="#78350f" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <radialGradient id="sunGlow" cx="50%" cy="45%" r="45%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9" />
      <stop offset="40%" stop-color="#f59e0b" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#d97706" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <linearGradient id="bookPage" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb" />
      <stop offset="100%" stop-color="#fef3c7" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#1e1b4b" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Background with rounded squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />

  <!-- Sun Rays Glow -->
  <circle cx="256" cy="225" r="160" fill="url(#sunGlow)" />

  <!-- Radiating Sun Rays -->
  <g stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" opacity="0.85">
    <line x1="256" y1="75" x2="256" y2="115" />
    <line x1="256" y1="335" x2="256" y2="375" opacity="0.3" />
    <line x1="106" y1="225" x2="146" y2="225" />
    <line x1="366" y1="225" x2="406" y2="225" />
    <line x1="150" y1="119" x2="178" y2="147" />
    <line x1="362" y1="119" x2="334" y2="147" />
    <line x1="150" y1="331" x2="178" y2="303" opacity="0.3" />
    <line x1="362" y1="331" x2="334" y2="303" opacity="0.3" />
  </g>

  <!-- Open Bible (Symbol of Word of God & Morning Light) -->
  <g filter="url(#shadow)">
    <!-- Left Page -->
    <path d="M 256,360 C 215,348 160,345 125,355 C 120,356 115,352 115,347 L 115,220 C 115,215 120,210 126,209 C 160,200 215,203 256,218 Z" fill="url(#bookPage)" stroke="#d97706" stroke-width="2" />
    <!-- Right Page -->
    <path d="M 256,360 C 297,348 352,345 387,355 C 392,356 397,352 397,347 L 397,220 C 397,215 392,210 386,209 C 352,200 297,203 256,218 Z" fill="url(#bookPage)" stroke="#d97706" stroke-width="2" />
    <!-- Spine Central Line -->
    <line x1="256" y1="216" x2="256" y2="362" stroke="#b45309" stroke-width="3" stroke-linecap="round" />
  </g>

  <!-- Radiant Cross rising from the Word -->
  <g filter="url(#shadow)">
    <!-- Vertical beam -->
    <rect x="250" y="145" width="12" height="75" rx="4" fill="url(#goldGrad)" stroke="#fef08a" stroke-width="1.5" />
    <!-- Horizontal beam -->
    <rect x="236" y="165" width="40" height="11" rx="4" fill="url(#goldGrad)" stroke="#fef08a" stroke-width="1.5" />
    <!-- Cross center halo -->
    <circle cx="256" cy="170" r="14" fill="none" stroke="#fef08a" stroke-width="2" opacity="0.8" />
  </g>

  <!-- Small Text Accent "LUZ DIÁRIA" -->
  <text x="256" y="420" font-family="'Cinzel', 'Times New Roman', serif" font-size="28" font-weight="700" fill="#fef3c7" text-anchor="middle" letter-spacing="4">LUZ DIÁRIA</text>
  <text x="256" y="445" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="500" fill="#fcd34d" text-anchor="middle" letter-spacing="2">DEVOCIONAL DIÁRIO</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

// Helper function to create PNG directly with Node.js
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crcData = buf.subarray(4, 8 + len);
  buf.writeUInt32BE(crc32(crcData), 8 + len);
  return buf;
}

function generateIconPNG(size, isMaskable = false) {
  const width = size;
  const height = size;

  // Raw RGBA pixel buffer
  const pixels = Buffer.alloc(width * height * 4);

  const cx = width / 2;
  const cy = height * 0.44;
  const maxR = size * (isMaskable ? 0.35 : 0.48);

  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const idx = (y * width + x) * 4;

      // Base background gradient: #451a03 (top-left) to #b45309 (bottom-right)
      const gradT = (nx + ny) * 0.5;
      let r = Math.round(69 + gradT * (180 - 69));
      let g = Math.round(26 + gradT * (83 - 26));
      let b = Math.round(3 + gradT * (9 - 3));
      let a = 255;

      // Distance from sun center
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Sun glow
      if (dist < maxR) {
        const glowFactor = Math.pow(1 - dist / maxR, 2);
        r = Math.min(255, Math.round(r + glowFactor * 160));
        g = Math.min(255, Math.round(g + glowFactor * 120));
        b = Math.min(255, Math.round(b + glowFactor * 40));
      }

      // Sun rays
      const angle = Math.atan2(dy, dx);
      const rayCount = 12;
      const rayMod = Math.abs(Math.cos(angle * rayCount / 2));
      if (dist > maxR * 0.4 && dist < maxR * 0.85 && rayMod > 0.8) {
        const rayIntensity = (rayMod - 0.8) / 0.2 * (1 - dist / maxR);
        r = Math.min(255, Math.round(r + rayIntensity * 90));
        g = Math.min(255, Math.round(g + rayIntensity * 70));
        b = Math.min(255, Math.round(b + rayIntensity * 20));
      }

      // Open book shape (lower center)
      const bookCy = cy + size * (isMaskable ? 0.16 : 0.2);
      const bookW = size * (isMaskable ? 0.38 : 0.52);
      const bookH = size * (isMaskable ? 0.18 : 0.25);
      
      const bdx = Math.abs(x - cx);
      const bdy = y - bookCy;

      if (bdx < bookW / 2 && bdy > -bookH * 0.5 && bdy < bookH * 0.5) {
        // Book page curvature
        const curve = Math.sin((bdx / (bookW / 2)) * Math.PI) * (bookH * 0.15);
        if (bdy > -bookH * 0.4 - curve && bdy < bookH * 0.4 + curve) {
          // Warm parchment page color #fffbeb with gold tint
          r = 254;
          g = 243;
          b = 199;

          // Book center crease
          if (bdx < size * 0.015) {
            r = 180;
            g = 83;
            b = 9;
          }
        }
      }

      // Cross shape in upper center
      const crossCy = cy - size * (isMaskable ? 0.08 : 0.1);
      const crossW = size * (isMaskable ? 0.05 : 0.06);
      const crossH = size * (isMaskable ? 0.22 : 0.28);
      const crossBeamW = size * (isMaskable ? 0.16 : 0.2);
      const crossBeamH = size * (isMaskable ? 0.05 : 0.06);

      const inVert = Math.abs(x - cx) < crossW / 2 && Math.abs(y - crossCy) < crossH / 2;
      const inHoriz = Math.abs(x - cx) < crossBeamW / 2 && Math.abs(y - (crossCy - crossH * 0.12)) < crossBeamH / 2;

      if (inVert || inHoriz) {
        r = 254;
        g = 240;
        b = 138;
      }

      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = a;
    }
  }

  // Construct PNG file
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // non-interlaced
  const ihdrChunk = writeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  let scanOffset = 0;
  let pixelOffset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[scanOffset++] = 0; // Filter 0 (None)
    pixels.copy(scanlines, scanOffset, pixelOffset, pixelOffset + width * 4);
    scanOffset += width * 4;
    pixelOffset += width * 4;
  }

  const compressed = zlib.deflateSync(scanlines);
  const idatChunk = writeChunk('IDAT', compressed);

  // IEND
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate PNG icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateIconPNG(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateIconPNG(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateIconPNG(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateIconPNG(180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generateIconPNG(64, false));

console.log('Successfully generated all PWA icons and SVG assets in /public.');
