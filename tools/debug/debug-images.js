// Script de Diagnóstico de Imagens
// Execute no console do navegador: Ctrl+Shift+J (Chrome) ou F12

console.log('🔍 DIAGNÓSTICO DE IMAGENS DO SIMULADOR');
console.log('=====================================\n');

const images = document.querySelectorAll('.simulator-wrapper img');
console.log(`Total de imagens encontradas: ${images.length}\n`);

images.forEach((img, index) => {
    const status = {
        index: index + 1,
        src: img.src || '(sem src)',
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        display: window.getComputedStyle(img).display,
        visibility: window.getComputedStyle(img).visibility
    };

    let statusIcon = '✅';
    let statusMsg = 'OK';

    if (!img.src) {
        statusIcon = '❌';
        statusMsg = 'SEM SRC';
    } else if (!img.complete) {
        statusIcon = '⏳';
        statusMsg = 'CARREGANDO';
    } else if (img.naturalWidth === 0) {
        statusIcon = '❌';
        statusMsg = 'FALHA AO CARREGAR';
    }

    console.log(`${statusIcon} Imagem ${index + 1}: ${statusMsg}`);
    console.log(`   URL: ${status.src.substring(0, 80)}${status.src.length > 80 ? '...' : ''}`);
    console.log(`   Dimensões: ${status.naturalWidth}x${status.naturalHeight}`);
    console.log(`   Display: ${status.display}, Visibility: ${status.visibility}`);
    console.log('');
});

console.log('=====================================');
console.log('✅ Diagnóstico concluído!');
