const fs = require('fs');
const files = [
    'js/modules/moletom/ui-render.js',
    'js/modules/calca-legging/ui-render.js',
    'js/modules/shorts-legging/ui-render.js',
    'js/modules/top/ui-render.js',
    'js/modules/shorts/ui-render.js'
];

files.forEach(f => {
    if (!fs.existsSync(f)) {
        console.log('Skipping', f);
        return;
    }
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/< div /g, '<div ');
    c = c.replace(/<\/div >/g, '</div>');
    c = c.replace(/< div>/g, '<div>');
    c = c.replace(/< img /g, '<img ');
    c = c.replace(/< span /g, '<span ');
    c = c.replace(/<\/span >/g, '</span>');
    c = c.replace(/< input /g, '<input ');
    c = c.replace(/\$\{ z \} /g, '${z}');
    c = c.replace(/\$\{ z \}/g, '${z}');
    c = c.replace(/\$\{ suffix \} /g, '${suffix}');
    c = c.replace(/\$\{ suffix \}/g, '${suffix}');
    c = c.replace(/\$\{ val \} /g, '${val}');
    c = c.replace(/\$\{ val \}/g, '${val}');
    c = c.replace(/\$\{ state\.simulationId \} /g, '${state.simulationId}');
    c = c.replace(/\$\{ state\.simulationId \}/g, '${state.simulationId}');
    c = c.replace(/upload - \$\{z\} /g, 'upload-${z}');
    c = c.replace(/upload - \$\{z\}/g, 'upload-${z}');
    c = c.replace(/`upload - \$\{z\} `/g, '`upload-${z}`');
    c = c.replace(/`upload - \$\{z\}`/g, '`upload-${z}`');
    c = c.replace(/`HNT - ML - \$\{suffix\} `/g, '`HNT-ML-${suffix}`');
    c = c.replace(/`HNT - LG - \$\{suffix\} `/g, '`HNT-LG-${suffix}`');
    c = c.replace(/`HNT - SL - \$\{suffix\} `/g, '`HNT-SL-${suffix}`');
    c = c.replace(/`HNT - TO - \$\{suffix\} `/g, '`HNT-TO-${suffix}`');
    c = c.replace(/`\$\{val\} -ML - \$\{suffix\} `/g, '`${val}-ML-${suffix}`');
    c = c.replace(/`\$\{val\} -LG - \$\{suffix\} `/g, '`${val}-LG-${suffix}`');
    c = c.replace(/`\$\{val\} -SL - \$\{suffix\} `/g, '`${val}-SL-${suffix}`');
    c = c.replace(/`\$\{val\} -TO - \$\{suffix\} `/g, '`${val}-TO-${suffix}`');
    fs.writeFileSync(f, c);
    console.log('Fixed', f);
});
