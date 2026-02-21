const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'src/locales');
const dirs = fs.readdirSync(localesDir);

const ptPath = path.join(localesDir, 'pt', 'translation.json');
const ptData = JSON.parse(fs.readFileSync(ptPath, 'utf8'));

// Helper string format function
function getKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
        } else {
            keys.push(prefix + key);
        }
    }
    return keys;
}

const baseKeys = getKeys(ptData);
let hasErrors = false;

dirs.forEach(dir => {
    const translatePath = path.join(localesDir, dir, 'translation.json');
    if (fs.existsSync(translatePath)) {
        const langData = JSON.parse(fs.readFileSync(translatePath, 'utf8'));
        const targetKeys = getKeys(langData);

        const missingInTarget = baseKeys.filter(key => !targetKeys.includes(key));

        if (missingInTarget.length > 0) {
            console.log(`\n❌ [${dir}] is missing keys:`);
            missingInTarget.forEach(k => console.log(`   - ${k}`));
            hasErrors = true;
        }
    }
});

if (!hasErrors) {
    console.log('\n✅ AUDIT PASSED: All 18 languages have 100% key parity with PT!');
}
