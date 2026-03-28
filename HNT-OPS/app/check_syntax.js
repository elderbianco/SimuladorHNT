const fs = require('fs');
const acorn = require('acorn'); // If available, or just use eval/Function
try {
    const content = fs.readFileSync('app.js', 'utf8');
    // Use Function to trigger a syntax error if any
    new Function(content);
    console.log('Valid');
} catch (e) {
    console.error('Syntax Error detected!');
    console.error(e.message);
    console.error(e.stack);
}
