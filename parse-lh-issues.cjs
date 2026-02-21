const fs = require('fs');
const lh = JSON.parse(fs.readFileSync('./lh-mobile.json', 'utf8'));
const audits = lh.audits;
const sorted = Object.values(audits)
    .filter(a => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative')
    .sort((a, b) => a.score - b.score)
    .map(a => `${a.id}: ${a.score} - ${a.title} - ${a.displayValue || ''}`);
fs.writeFileSync('issues.txt', '--- MOBILE ISSUES ---\n' + sorted.join('\n'), 'utf8');
