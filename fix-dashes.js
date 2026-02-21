const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'src/locales');

function findFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(findFiles(file));
        } else if (file.endsWith('.json')) {
            results.push(file);
        }
    });
    return results;
}

const jsonFiles = findFiles(localesDir);
jsonFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Replace all em-dashes "—" with standard hyphen "-"
    content = content.replace(/—/g, '-');
    fs.writeFileSync(file, content);
});

console.log(`✅ Removed all AI-style em-dashes "—" from ${jsonFiles.length} translation files globally!`);
