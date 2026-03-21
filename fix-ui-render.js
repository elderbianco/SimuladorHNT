const fs = require('fs');
const files = [
  'js/modules/moletom/ui-render.js',
  'js/modules/calca-legging/ui-render.js',
  'js/modules/shorts-legging/ui-render.js',
  'js/modules/top/ui-render.js',
  'js/modules/shorts/ui-render.js'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/< img src/g, '<img src');
    content = content.replace(/< div /g, '<div ');
    content = content.replace(/<\/div > /g, '</div>');
    content = content.replace(/upload - \$\{ z \} /g, 'upload-');
    content = content.replace(/\$\{ suffix \} /g, '');
    content = content.replace(/\$\{ val \} /g, '');
    content = content.replace(/\$\{ state\.simulationId \} /g, '');
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  } else {
    console.log('Not found', file);
  }
});

