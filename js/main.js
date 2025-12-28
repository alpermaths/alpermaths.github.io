// ===== Game Portal Main Script =====

document.addEventListener('DOMContentLoaded', () => {
    initAnimations();
    initTouchSupport();
});

// Initialize entrance animations
function initAnimations() {
    const cards = document.querySelectorAll('.game-card');

    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px)';

        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + (index * 150));
    });
}

// Touch support for mobile and smart boards
function initTouchSupport() {
    const cards = document.querySelectorAll('.game-card:not(.coming-soon)');

    cards.forEach(card => {
        // Add touch feedback
        card.addEventListener('touchstart', () => {
            card.style.transform = 'scale(0.98)';
        }, { passive: true });

        card.addEventListener('touchend', () => {
            card.style.transform = 'scale(1)';
        }, { passive: true });
    });
}

// Parallax effect for background orbs (optional - disabled for performance)
function initParallax() {
    const orbs = document.querySelectorAll('.gradient-orb');

    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;

        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 20;
            orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
        });
    });
}
