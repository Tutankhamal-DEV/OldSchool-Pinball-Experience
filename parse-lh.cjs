const fs = require('fs');
if (fs.existsSync('./lh-mobile.json')) {
    const lh = JSON.parse(fs.readFileSync('./lh-mobile.json', 'utf8'));
    console.log('--- LIGHTHOUSE MOBILE SCORES ---');
    console.log(`Performance: ${lh.categories.performance.score * 100}`);
    console.log(`Accessibility: ${lh.categories.accessibility.score * 100}`);
    console.log(`Best Practices: ${lh.categories['best-practices'].score * 100}`);
    console.log(`SEO: ${lh.categories.seo.score * 100}`);
}
if (fs.existsSync('./lh-desktop.json')) {
    const lh = JSON.parse(fs.readFileSync('./lh-desktop.json', 'utf8'));
    console.log('--- LIGHTHOUSE DESKTOP SCORES ---');
    console.log(`Performance: ${lh.categories.performance.score * 100}`);
    console.log(`Accessibility: ${lh.categories.accessibility.score * 100}`);
    console.log(`Best Practices: ${lh.categories['best-practices'].score * 100}`);
    console.log(`SEO: ${lh.categories.seo.score * 100}`);
}
