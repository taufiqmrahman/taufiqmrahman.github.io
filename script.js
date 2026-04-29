document.addEventListener('DOMContentLoaded', () => {
    // Navbar Scroll Effect
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

    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu when a link is clicked
    navLinksItems.forEach(item => {
        item.addEventListener('click', () => {
            if (hamburger && hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    });

    // Set Footer Year
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Prevent default form submission for the demo
    const form = document.querySelector('.contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = "Message Sent! ✓";
            btn.style.background = "var(--accent-green)";
            form.reset();

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = "";
            }, 3000);
        });
    }

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
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
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Animate cards with stagger
    const cards = document.querySelectorAll('.card, .hobby-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // ===== BAT SWARM ON BUTTON CLICK =====
    const batSVG = '<svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12c1.5-3 4.5-5 8-5h0c.5-2 1-3.5 2-5 1 1.5 1.5 3 2 5h0c3.5 0 6.5 2 8 5-0-5.5-4.5-10-10-10z"/></svg>';

    function spawnBatSwarm(originX, originY) {
        const container = document.getElementById('batSwarm');
        if (!container) return;

        const batCount = 35;

        for (let i = 0; i < batCount; i++) {
            const bat = document.createElement('div');
            bat.className = 'swarm-bat';
            bat.innerHTML = batSVG;

            // Random size — much bigger now
            const size = 24 + Math.random() * 50;
            bat.style.fontSize = size + 'px';

            // Start from click origin
            bat.style.left = originX + 'px';
            bat.style.top = originY + 'px';

            container.appendChild(bat);

            // Random flight direction and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = 400 + Math.random() * 800;
            const endX = originX + Math.cos(angle) * distance;
            const endY = originY + Math.sin(angle) * distance - Math.random() * 300;
            const duration = 900 + Math.random() * 1400;
            const delay = Math.random() * 400;

            // Flip direction based on movement
            if (endX < originX) {
                bat.style.transform = 'scaleX(-1)';
            }

            // Animate using Web Animation API
            const animation = bat.animate([
                { 
                    left: originX + 'px', 
                    top: originY + 'px', 
                    opacity: 0,
                    transform: `scaleX(${endX < originX ? -1 : 1}) scale(0.3)`
                },
                { 
                    opacity: 1,
                    offset: 0.1
                },
                { 
                    opacity: 0.9,
                    offset: 0.5
                },
                { 
                    left: endX + 'px', 
                    top: endY + 'px', 
                    opacity: 0,
                    transform: `scaleX(${endX < originX ? -1 : 1}) scale(1) rotate(${(Math.random() - 0.5) * 40}deg)`
                }
            ], {
                duration: duration,
                delay: delay,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fill: 'forwards'
            });

            animation.onfinish = () => bat.remove();
        }
    }

    // Attach bat swarm to all buttons and clickable links
    const clickables = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-nav, .social-icon, .card-link, .hobby-card');
    clickables.forEach(el => {
        el.addEventListener('click', (e) => {
            const rect = el.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            spawnBatSwarm(x, y);
        });
    });
});
