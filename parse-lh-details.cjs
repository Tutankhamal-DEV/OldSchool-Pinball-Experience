const fs = require('fs');
const lh = JSON.parse(fs.readFileSync('./lh-mobile.json', 'utf8'));

console.log("Render blocking items:");
const rb = lh.audits['render-blocking-resources'];
if (rb.details && rb.details.items) {
    rb.details.items.forEach(i => console.log(i.url));
}

console.log("Unsized images items:");
const ui = lh.audits['unsized-images'];
if (ui.details && ui.details.items) {
    ui.details.items.forEach(i => console.log(i.url || i.node.snippet));
}

console.log("Responsive images items:");
const ri = lh.audits['uses-responsive-images'];
if (ri.details && ri.details.items) {
    ri.details.items.forEach(i => console.log(i.url));
}
