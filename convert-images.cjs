const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'public/images');
const files = fs.readdirSync(dir);

async function convert() {
    for (const file of files) {
        if (file.match(/\.(png|jpe?g)$/i)) {
            const ext = path.extname(file);
            const base = path.basename(file, ext);
            const inPath = path.join(dir, file);

            const outPathWebp = path.join(dir, `${base}.webp`);
            const outPathSm = path.join(dir, `${base}-sm.webp`);

            console.log(`Converting ${file}...`);
            const image = sharp(inPath);
            const metadata = await image.metadata();

            // Standard WebP
            await image.webp({ quality: 80 }).toFile(outPathWebp);

            // Responsive WebP (max width 768px)
            if (metadata.width > 768) {
                await image.resize({ width: 768, withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toFile(outPathSm);
            } else {
                // If it's already small, just copy the webp to -sm
                fs.copyFileSync(outPathWebp, outPathSm);
            }

            // Remove old file
            fs.unlinkSync(inPath);
        }
    }
    console.log('Conversion complete!');
}

convert().catch(console.error);
