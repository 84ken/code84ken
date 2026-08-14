// Generate WebP versions of images used on the site + lightweight bg texture
import sharp from 'sharp';
import { statSync } from 'fs';

const P = '../assets/img/photos';
const IMG = '../assets/img';

// Images referenced by <img> on the top page
const photos = [
  '_dsc1245', '_dsc1232', '_dsc1274', '_dsc0600',
  'img_4381', 'img_4380', 'img_4382', 'img_8094',
];

const kb = f => Math.round(statSync(f).size / 1024);

for (const name of photos) {
  const src = `${P}/${name}.jpg`;
  const dst = `${P}/${name}.webp`;
  const meta = await sharp(src).metadata();
  await sharp(src).webp({ quality: 78 }).toFile(dst);
  console.log(`${name}: ${meta.width}x${meta.height}  jpg=${kb(src)}KB -> webp=${kb(dst)}KB`);
}

// Hero background (CSS) — webp version
{
  const src = `${P}/_dsc1232.jpg`;
  const dst = `${P}/_dsc1232_hero.webp`;
  await sharp(src).webp({ quality: 72 }).toFile(dst);
  console.log(`hero bg: webp=${kb(dst)}KB`);
}

// Plywood texture bg — downscale hard, it sits under gradients
{
  const src = `${P}/img_8137.jpg`;
  const dst = `${P}/img_8137_bg.webp`;
  await sharp(src).resize({ width: 1000 }).webp({ quality: 58 }).toFile(dst);
  console.log(`plywood bg: ${kb(src)}KB -> ${kb(dst)}KB`);
}

// Award mark shown at ~80px — shrink drastically
{
  const src = `${IMG}/wooddesign-2024.jpg`;
  const dst = `${IMG}/wooddesign-2024_sm.jpg`;
  const dstW = `${IMG}/wooddesign-2024_sm.webp`;
  await sharp(src).resize({ width: 400 }).jpeg({ quality: 82 }).toFile(dst);
  await sharp(src).resize({ width: 400 }).webp({ quality: 80 }).toFile(dstW);
  console.log(`award mark: ${kb(src)}KB -> jpg ${kb(dst)}KB / webp ${kb(dstW)}KB`);
}
