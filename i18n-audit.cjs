const fs = require('fs');
const path = require('path');

const ptPath = path.join(process.cwd(), 'src/locales/pt/translation.json');
const enPath = path.join(process.cwd(), 'src/locales/en/translation.json');

const ptDoc = JSON.parse(fs.readFileSync(ptPath, 'utf8'));
const enDoc = JSON.parse(fs.readFileSync(enPath, 'utf8'));

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

const ptKeys = getKeys(ptDoc);
const enKeys = getKeys(enDoc);

const missingInEn = ptKeys.filter(k => !enKeys.includes(k));
const missingInPt = enKeys.filter(k => !ptKeys.includes(k));

console.log('--- i18n Deep Object Audit ---');
if (missingInEn.length === 0 && missingInPt.length === 0) {
    console.log('✅ PERFECT PARITY! Both JSONs have exactly the same keys.');
} else {
    if (missingInEn.length > 0) {
        console.log('\\n❌ TRANSLATIONS MISSING IN ENGLISH:');
        missingInEn.forEach(k => console.log('   - ' + k));
    }
    if (missingInPt.length > 0) {
        console.log('\\n❌ TRANSLATIONS MISSING IN PORTUGUESE:');
        missingInPt.forEach(k => console.log('   - ' + k));
    }
}
