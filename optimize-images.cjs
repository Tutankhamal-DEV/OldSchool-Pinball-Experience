const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMG = 'public/images';
const BAR = 'public/american-bar-menu';

async function optimize(src, opts = {}) {
    try {
        if (!fs.existsSync(src)) { console.log('SKIP ' + src + ' (not found)'); return; }
        const ext = path.extname(src).slice(1);
        const oldSize = fs.statSync(src).size;

        // Read into buffer first to avoid file locking issues
        const inputBuf = fs.readFileSync(src);
        let pipeline = sharp(inputBuf);

        if (opts.width) {
            pipeline = pipeline.resize(opts.width, null, { withoutEnlargement: true });
        }

        const quality = opts.quality || 60;
        if (ext === 'avif') {
            pipeline = pipeline.avif({ quality, effort: 1 }); // effort 1 for speed
        } else if (ext === 'webp') {
            pipeline = pipeline.webp({ quality });
        } else if (ext === 'png') {
            pipeline = pipeline.png({ quality });
        }

        const outputBuf = await pipeline.toBuffer();

        // Only write if we actually saved space
        if (outputBuf.length < oldSize) {
            fs.writeFileSync(src, outputBuf);
            console.log(`✓ ${path.basename(src)}: ${Math.round(oldSize / 1024)}KB → ${Math.round(outputBuf.length / 1024)}KB (saved ${Math.round((oldSize - outputBuf.length) / 1024)}KB)`);
        } else {
            console.log(`= ${path.basename(src)}: ${Math.round(oldSize / 1024)}KB (already optimal)`);
        }
    } catch (err) {
        console.log(`✗ ${path.basename(src)}: ERROR - ${err.message}`);
    }
}

async function run() {
    console.log('=== WebP images ===');
    await optimize(IMG + '/ambiente_01.webp', { quality: 55, width: 800 });
    await optimize(IMG + '/pinball_machines_1.webp', { quality: 55, width: 1200 });
    await optimize(IMG + '/ambiente-retro-starwars.webp', { quality: 55, width: 800 });
    await optimize(IMG + '/ambiente_04.webp', { quality: 55, width: 1200 });
    await optimize(IMG + '/ambiente_04-sm.webp', { quality: 50 });
    await optimize(IMG + '/ambiente_do_bar-sm.webp', { quality: 50 });
    await optimize(IMG + '/nav_logo.webp', { quality: 70, width: 120 });
    await optimize(IMG + '/hero_logo.webp', { quality: 65 });
    await optimize(IMG + '/hero_logo-sm.webp', { quality: 60 });

    console.log('\n=== AVIF images ===');
    await optimize(IMG + '/tv-frame-off.avif', { quality: 50 });
    await optimize(IMG + '/dj-na-pista.avif', { quality: 45 });

    console.log('\n=== Menu pages ===');
    for (let i = 1; i <= 11; i++) {
        await optimize(BAR + '/page' + i + '.avif', { quality: 55, width: 400 });
    }

    console.log('\nDone!');
}

run();
