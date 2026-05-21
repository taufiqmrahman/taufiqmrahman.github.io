document.addEventListener('DOMContentLoaded', () => {

    // ===== NAVBAR SCROLL EFFECT =====
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // ===== MOBILE MENU TOGGLE =====
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    navLinksItems.forEach(item => {
        item.addEventListener('click', () => {
            if (hamburger && hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    });

    // ===== FOOTER YEAR =====
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // ===== CURSOR GLOW EFFECT =====
    const cursorGlow = document.getElementById('cursorGlow');
    if (cursorGlow) {
        let mouseX = 0, mouseY = 0;
        let glowX = 0, glowY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animateCursor() {
            glowX += (mouseX - glowX) * 0.08;
            glowY += (mouseY - glowY) * 0.08;
            cursorGlow.style.left = glowX + 'px';
            cursorGlow.style.top = glowY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();
    }

    // ===== FLOATING PARTICLES =====
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        const PARTICLE_COUNT = 28;
        const colors = [
            'rgba(14, 165, 233, 0.7)',
            'rgba(56, 189, 248, 0.5)',
            'rgba(249, 115, 22, 0.5)',
            'rgba(253, 186, 116, 0.4)',
            'rgba(6, 182, 212, 0.4)',
        ];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = 2 + Math.random() * 4;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const duration = 12 + Math.random() * 20;
            const delay = Math.random() * 20;
            const startX = Math.random() * 100;

            p.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                left: ${startX}vw;
                animation-duration: ${duration}s;
                animation-delay: -${delay}s;
                box-shadow: 0 0 ${size * 3}px ${color};
            `;
            particlesContainer.appendChild(p);
        }
    }

    // ===== CONTACT FORM (Formspree AJAX) =====
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('contactSubmitBtn');
            const status = document.getElementById('formStatus');
            const originalText = btn.textContent;

            btn.textContent = 'Sending...';
            btn.disabled = true;
            status.style.display = 'none';

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    btn.textContent = 'Message Sent! ✓';
                    btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
                    status.textContent = "Thanks! I'll get back to you soon.";
                    status.style.color = '#10b981';
                    status.style.display = 'block';
                    form.reset();
                } else {
                    const data = await response.json();
                    throw new Error(data.errors ? data.errors.map(e => e.message).join(', ') : 'Something went wrong.');
                }
            } catch (error) {
                btn.textContent = 'Failed to Send ✗';
                btn.style.background = 'linear-gradient(135deg, #c0392b, #e74c3c)';
                status.textContent = error.message || 'Network error. Please try again.';
                status.style.color = '#f87171';
                status.style.display = 'block';
            }

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.disabled = false;
            }, 4000);
        });
    }

    // ===== SCROLL REVEAL (Intersection Observer) =====
    const observerOptions = {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Animate sections on scroll
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        observer.observe(section);
    });

    // Animate cards with stagger
    const cards = document.querySelectorAll('.card, .hobby-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(24px)';
        card.style.transition = `opacity 0.55s ease ${index * 0.08}s, transform 0.55s ease ${index * 0.08}s`;
        observer.observe(card);
    });

    // Animate about card
    const aboutCard = document.querySelector('.about-card');
    if (aboutCard) {
        aboutCard.style.opacity = '0';
        aboutCard.style.transform = 'translateY(30px)';
        aboutCard.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        const aboutObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });
        aboutObserver.observe(aboutCard);
    }

    // Animate subpage card
    const subpageCard = document.querySelector('.subpage-card');
    if (subpageCard) {
        subpageCard.style.opacity = '0';
        subpageCard.style.transform = 'translateY(30px) scale(0.98)';
        subpageCard.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        setTimeout(() => {
            subpageCard.style.opacity = '1';
            subpageCard.style.transform = 'translateY(0) scale(1)';
        }, 200);
    }

    // ===== MAGNETIC BUTTON EFFECT =====
    const magneticBtns = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-nav');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) translateY(-2px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });

    // ===== RIPPLE EFFECT ON BUTTONS =====
    const rippleBtns = document.querySelectorAll('.btn-primary, .btn-secondary, .explore-btn');
    rippleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ripple = document.createElement('span');
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255,255,255,0.15);
                border-radius: 50%;
                transform: scale(0);
                animation: rippleAnim 0.6s ease-out forwards;
                pointer-events: none;
                z-index: 10;
            `;

            // Inject animation if not already present
            if (!document.getElementById('rippleStyle')) {
                const style = document.createElement('style');
                style.id = 'rippleStyle';
                style.textContent = `
                    @keyframes rippleAnim {
                        to { transform: scale(2.5); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }

            // Make parent relative for absolute child
            const position = window.getComputedStyle(btn).position;
            if (position === 'static') btn.style.position = 'relative';
            btn.style.overflow = 'hidden';

            btn.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });

    // ===== ACTIVE NAV LINK HIGHLIGHT =====
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a:not(.btn-nav)').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.style.color = 'var(--accent-violet-light)';
            link.style.background = 'rgba(14, 165, 233, 0.1)';
        }
    });
});
