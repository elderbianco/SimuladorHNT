function renderDrawer(p) {
    const produtos = p.produtos || [p];
    const numProdutos = produtos.length;

    $('drawer-num').textContent = p.numero || 'N/A';
    $('drawer-sku').textContent = numProdutos > 1
        ? `${numProdutos} Produtos no Pedido · ${p.quantidade} un. total`
        : `${p.sku || p.modelo} · ${p.tamanho || 'Tam. Misto'} · ${p.quantidade || p.quantidade_real} un.`;

    document.querySelectorAll('.drawer-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === drawerTab));
}
