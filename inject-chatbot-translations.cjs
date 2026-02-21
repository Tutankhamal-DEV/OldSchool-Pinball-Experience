const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'src/locales');
const dirs = fs.readdirSync(localesDir);

const ptPath = path.join(localesDir, 'pt', 'translation.json');
const ptData = JSON.parse(fs.readFileSync(ptPath, 'utf8'));
const enPath = path.join(localesDir, 'en', 'translation.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Deep copy helper
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function deepMerge(target, source) {
    let output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else
                    output[key] = deepMerge(target[key], source[key]);
            } else {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                }
            }
        });
    }
    return output;
}

dirs.forEach(dir => {
    if (dir === 'pt' || dir === 'en') return;

    const translatePath = path.join(localesDir, dir, 'translation.json');
    if (fs.existsSync(translatePath)) {
        const langData = JSON.parse(fs.readFileSync(translatePath, 'utf8'));

        // Deep merge missing keys from 'en' into target locale
        const mergedData = deepMerge(langData, enData);

        fs.writeFileSync(translatePath, JSON.stringify(mergedData, null, 4), 'utf8');
        console.log(`Updated ${dir}/translation.json`);
    }
});
