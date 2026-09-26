// Designer portrait (cropped to the person) + magazine cover, jpg + webp
import sharp from 'sharp';
import { mkdirSync, statSync } from 'fs';

const SRC = process.argv[2];               // folder with the originals
const kb = f => Math.round(statSync(f).size / 1024);
mkdirSync('../assets/img/press', { recursive: true });

// 伊藤淳: lying in the river rapids — crop to the person, 4:3
{
  const out = '../assets/img/photos/designer_ito';
  const img = sharp(`${SRC}/3.webp`).extract({ left: 370, top: 590, width: 720, height: 540 }).resize({ width: 720 });
  await img.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(`${out}.jpg`);
  await img.clone().webp({ quality: 80 }).toFile(`${out}.webp`);
  console.log(`designer_ito: jpg=${kb(out + '.jpg')}KB webp=${kb(out + '.webp')}KB`);
}

// 大人の科学マガジン Special cover (small original, keep its size)
{
  const out = '../assets/img/press/otona_kagaku_sp';
  const img = sharp(`${SRC}/1.png`).flatten({ background: '#ffffff' });
  await img.clone().jpeg({ quality: 88, mozjpeg: true }).toFile(`${out}.jpg`);
  await img.clone().webp({ quality: 88 }).toFile(`${out}.webp`);
  console.log(`cover: jpg=${kb(out + '.jpg')}KB webp=${kb(out + '.webp')}KB`);
}
