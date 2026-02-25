/**
 * SimulatorHNT - Pós-Venda JavaScript
 * Lógica de interatividade para a página de pós-venda
 */

// ========================================
// TAB NAVIGATION SYSTEM
// ========================================

/**
 * Switch between tabs
 * @param {string} tabId - ID of the target tab content
 */
function switchTab(tabId) {
    // Remove active class from all tabs
    const allTabs = document.querySelectorAll('.nav-tab');
    allTabs.forEach(tab => tab.classList.remove('active'));

    // Remove active class from all content sections
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => section.classList.remove('active'));

    // Add active class to clicked tab
    const activeTab = document.querySelector(`.nav-tab[data-target="${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Add active class to corresponding content section
    const activeSection = document.getElementById(tabId);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// ACCORDION SYSTEM
// ========================================

/**
 * Toggle accordion item
 * @param {HTMLElement} trigger - The accordion trigger button
 */
function toggleAccordion(trigger) {
    const content = trigger.nextElementSibling;
    const isOpen = content.classList.contains('open');

    // Toggle current accordion
    if (isOpen) {
        content.classList.remove('open');
        trigger.classList.remove('active');
    } else {
        content.classList.add('open');
        trigger.classList.add('active');
    }
}

// ========================================
// CART COUNT UPDATE
// ========================================

/**
 * Update cart count badge
 */
function updateCartCount() {
    const cartData = localStorage.getItem('cart');
    if (cartData) {
        try {
            const cart = JSON.parse(cartData);
            const count = cart.length || 0;
            const badge = document.getElementById('cart-count');
            if (badge) {
                badge.textContent = count;
            }
        } catch (e) {
            console.error('Error parsing cart data:', e);
        }
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', function () {

    // Tab Navigation
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            switchTab(targetId);
        });
    });

    // Accordion Triggers
    const accordionTriggers = document.querySelectorAll('.accordion-trigger');
    accordionTriggers.forEach(trigger => {
        trigger.addEventListener('click', function () {
            toggleAccordion(this);
        });
    });

    // Update cart count on page load
    updateCartCount();

    // Listen for storage changes (cart updates from other pages)
    window.addEventListener('storage', function (e) {
        if (e.key === 'cart') {
            updateCartCount();
        }
    });

    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    console.log('✅ Pós-Venda page initialized');
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Show a simple toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, info)
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 30px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#D4AF37'};
        color: #fff;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// ========================================
// FORM HANDLERS (Placeholders)
// ========================================

function handleVIPFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    console.log('VIP Form Data:', data);
    showToast('Cadastro VIP realizado com sucesso! 🎉', 'success');
    e.target.reset();
}

function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecione uma imagem válida', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showToast('Imagem muito grande. Máximo 5MB', 'error');
        return;
    }
    console.log('Uploading photo:', file.name);
    showToast('Foto enviada com sucesso! 📸', 'success');
}

function generateReferralLink() {
    // Melhoria de segurança: utilizar crypto para gerar hash seguro ao invés de Math.random()
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const randomHash = array[0].toString(36).substring(0, 6).toUpperCase().padStart(6, 'X');
    const referralCode = 'HNT' + randomHash;
    const referralLink = `${window.location.origin}/index.html?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink).then(() => {
        showToast('Link de indicação copiado! 🔗', 'success');
    }).catch(() => {
        const input = document.createElement('input');
        input.value = referralLink;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('Link de indicação copiado! 🔗', 'success');
    });
    console.log('Referral Link:', referralLink);
}

// ========================================
// ANIMATIONS
// ========================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ========================================
// EXPORT FUNCTIONS (for inline onclick handlers)
// ========================================

window.switchTab = switchTab;
window.toggleAccordion = toggleAccordion;
window.handleVIPFormSubmit = handleVIPFormSubmit;
window.handlePhotoUpload = handlePhotoUpload;
window.generateReferralLink = generateReferralLink;
window.showToast = showToast;

// ========================================
// 3 CARROSSÉIS INDEPENDENTES
// ========================================

class MiniCarousel {
    constructor(carouselId, speed = 3500) {
        this.carouselId = carouselId;
        this.track = document.getElementById(carouselId);
        this.slides = this.track ? this.track.querySelectorAll('.mini-slide') : [];
        this.indicators = document.querySelectorAll(`.mini-indicator[data-carousel="${carouselId.replace('Carousel', '')}"]`);

        this.currentIndex = 0;
        this.totalSlides = this.slides.length;
        this.autoPlayInterval = null;
        this.speed = speed;

        if (this.track && this.slides.length > 0) {
            this.init();
        }
    }

    init() {
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });

        const carousel = this.track.closest('.mini-carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', () => this.stopAutoPlay());
            carousel.addEventListener('mouseleave', () => this.startAutoPlay());
        }

        this.startAutoPlay();
        console.log(`✅ Carrossel ${this.carouselId} inicializado com ${this.totalSlides} slides`);
    }

    goToSlide(index) {
        if (index < 0) {
            this.currentIndex = this.totalSlides - 1;
        } else if (index >= this.totalSlides) {
            this.currentIndex = 0;
        } else {
            this.currentIndex = index;
        }

        const offset = -this.currentIndex * 100;
        this.track.style.transform = `translateX(${offset}%)`;
        this.updateIndicators();
    }

    nextSlide() {
        this.goToSlide(this.currentIndex + 1);
    }

    updateIndicators() {
        this.indicators.forEach((indicator, index) => {
            if (index === this.currentIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    startAutoPlay() {
        this.stopAutoPlay();
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, this.speed);
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
}

// Inicializar os 3 carrosséis quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        const leftCarousel = new MiniCarousel('leftCarousel', 3000);
        const centerCarousel = new MiniCarousel('centerCarousel', 3500);
        const rightCarousel = new MiniCarousel('rightCarousel', 4000);

        window.leftCarousel = leftCarousel;
        window.centerCarousel = centerCarousel;
        window.rightCarousel = rightCarousel;

        console.log('✅ Todos os 3 carrosséis inicializados');
    }, 100);
});

// ========================================
// SISTEMA DE AVALIAÇÕES (Lista estática)
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Lista de avaliações carregada');
});


// ========================================
// ACORDEÕES DA SEÇÃO NOSSA HISTÓRIA
// ========================================

function toggleStoryAccordion(btn) {
    const content = btn.nextElementSibling;
    const isOpen = btn.classList.contains('open');

    // Fecha todos os outros acordeões da história
    document.querySelectorAll('.story-accordion-btn.open').forEach(function (openBtn) {
        if (openBtn !== btn) {
            openBtn.classList.remove('open');
            openBtn.nextElementSibling.classList.remove('open');
        }
    });

    // Abre ou fecha o clicado
    if (isOpen) {
        btn.classList.remove('open');
        content.classList.remove('open');
    } else {
        btn.classList.add('open');
        content.classList.add('open');
    }
}

window.toggleStoryAccordion = toggleStoryAccordion;
