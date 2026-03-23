const fs = require('fs');
const path = require('path');

const modules = ['top', 'calca-legging', 'shorts-legging'];

modules.forEach(mod => {
    const simPath = `js/modules/${mod}/simulator.js`;
    if (fs.existsSync(simPath)) {
        let content = fs.readFileSync(simPath, 'utf8');

        // Find the render() method and inject renderFinalForm() before the end of the method
        // Looking for the closing brace of the render() function
        // The subagent said it looks like: render() { ... }

        // Robust replacement: find the last part of the render() method
        // Usually it ends with something like: this.updatePrice(); } or similar.
        // Let's use a regex to find the render method and append the call.

        const renderRegex = /render\(\s*\)\s*\{([\s\S]*?)\}/;
        const match = content.match(renderRegex);

        if (match) {
            let methodBody = match[1];
            if (!methodBody.includes('renderFinalForm')) {
                // Append before the last closing brace of the method body
                // Actually, let's just replace the whole method body to be sure.
                const newMethodBody = methodBody + "\n        if (typeof renderFinalForm === 'function') {\n            this.controlsContainer.appendChild(renderFinalForm());\n        }";
                const newContent = content.replace(methodBody, newMethodBody);
                fs.writeFileSync(simPath, newContent);
                console.log(`✅ Patched render() in ${simPath}`);
            } else {
                console.log(`ℹ️ renderFinalForm already present in ${simPath}`);
            }
        } else {
            // If not found as a method, check if it's a standalone function (like in older modules)
            console.warn(`⚠️ Could not find render() method in ${simPath}`);
        }
    }
});
