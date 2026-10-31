/**
 * PageCast PWA Icon Generator
 * Generates valid PNG and SVG icons for PWA compliance (FR-070).
 */

import fs from "fs";
import path from "path";
import zlib from "zlib";

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcData = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([lenBuf, crcData, crcBuf]);
}

function generatePng(width, height, isMaskable = false) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const ihdrChunk = writeChunk("IHDR", ihdr);

  // Raw Image Data (Filter 0)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const margin = isMaskable ? Math.floor(width * 0.15) : Math.floor(width * 0.06);
  const borderThick = Math.max(3, Math.floor(width * 0.03));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Default CRT background #050505
      let r = 5;
      let g = 5;
      let b = 5;
      let a = 255;

      // Outer phosphor border
      const inOuter = x >= margin && x < width - margin && y >= margin && y < height - margin;
      const inInner =
        x >= margin + borderThick &&
        x < width - margin - borderThick &&
        y >= margin + borderThick &&
        y < height - margin - borderThick;

      if (inOuter && !inInner) {
        // Teletext Green #00ff66
        r = 0;
        g = 255;
        b = 102;
      } else if (inInner) {
        // Draw stylized Teletext 'P' in center
        const cx = x / width;
        const cy = y / height;

        // Stem: x in [0.28, 0.40], y in [0.24, 0.76]
        const isStem = cx >= 0.28 && cx <= 0.4 && cy >= 0.24 && cy <= 0.76;

        // Top loop: y in [0.24, 0.52], x in [0.38, 0.72]
        const isLoop =
          cx >= 0.38 &&
          cx <= 0.72 &&
          cy >= 0.24 &&
          cy <= 0.52 &&
          !(cx > 0.48 && cx < 0.62 && cy > 0.33 && cy < 0.43);

        // Accent strip (cyan)
        const isAccent = cx >= 0.64 && cx <= 0.72 && cy >= 0.6 && cy <= 0.76;

        if (isStem || isLoop) {
          // Teletext Yellow #ffff00
          r = 255;
          g = 255;
          b = 0;
        } else if (isAccent) {
          // Teletext Cyan #00ffff
          r = 0;
          g = 255;
          b = 255;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = writeChunk("IDAT", compressed);
  const iendChunk = writeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve(process.cwd(), "public/icons");
fs.mkdirSync(iconsDir, { recursive: true });

// 1. 192x192 PNG
const png192 = generatePng(192, 192, false);
fs.writeFileSync(path.join(iconsDir, "icon-192x192.png"), png192);

// 2. 512x512 PNG
const png512 = generatePng(512, 512, false);
fs.writeFileSync(path.join(iconsDir, "icon-512x512.png"), png512);

// 3. 512x512 Maskable PNG
const pngMaskable = generatePng(512, 512, true);
fs.writeFileSync(path.join(iconsDir, "icon-maskable-512x512.png"), pngMaskable);

// 4. Favicon (use 192x192 buffer as ico placeholder)
fs.writeFileSync(path.resolve(process.cwd(), "public/favicon.ico"), png192);

// 5. SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#050505"/>
  <rect x="24" y="24" width="464" height="464" fill="none" stroke="#00ff66" stroke-width="16" rx="32"/>
  <!-- P Stem -->
  <rect x="140" y="120" width="60" height="270" fill="#ffff00"/>
  <!-- P Loop -->
  <path d="M190 120 H340 C380 120 400 150 400 190 C400 230 380 260 340 260 H190 Z" fill="#ffff00"/>
  <path d="M250 170 H330 C350 170 360 180 360 190 C360 200 350 210 330 210 H250 Z" fill="#050505"/>
  <!-- Accent Cyan Block -->
  <rect x="330" y="310" width="50" height="80" fill="#00ffff"/>
</svg>`;
fs.writeFileSync(path.join(iconsDir, "icon.svg"), svgContent);

console.log("PWA Icons generated successfully in public/icons/");
