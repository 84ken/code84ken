// Workshop (TATE Lab.) photos: resize the camera originals to web size, jpg + webp
import sharp from 'sharp';
import { statSync } from 'fs';

const SRC = process.env.USERPROFILE + '/Downloads';
const P = '../assets/img/photos';
const kb = f => Math.round(statSync(f).size / 1024);

const photos = [
  ['DSCF4517.jpg', 'atelier_space'],  // TATE Lab. interior
  ['DSC_4600.jpg', 'atelier_cnc_a'],
  ['DSC_4602.jpg', 'atelier_cnc_b'],
];

for (const [file, name] of photos) {
  const img = sharp(`${SRC}/${file}`).rotate().resize({ width: 1600, withoutEnlargement: true });
  await img.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(`${P}/${name}.jpg`);
  await img.clone().webp({ quality: 76 }).toFile(`${P}/${name}.webp`);
  const m = await sharp(`${P}/${name}.jpg`).metadata();
  console.log(`${name}: ${m.width}x${m.height}  jpg=${kb(`${P}/${name}.jpg`)}KB webp=${kb(`${P}/${name}.webp`)}KB`);
}
