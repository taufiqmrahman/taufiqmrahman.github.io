document.addEventListener('DOMContentLoaded', () => {

    // ===== THEME TOGGLE =====
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('tmr-theme') || 'dark';
    root.setAttribute('data-theme', savedTheme);
    updateToggleIcon(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = root.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            localStorage.setItem('tmr-theme', next);
            updateToggleIcon(next);
        });
    }

    function updateToggleIcon(theme) {
        if (!themeToggle) return;
        themeToggle.innerHTML = theme === 'dark'
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';
        themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }

    // ===== NAVBAR SCROLL =====
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 40);
        }, { passive: true });
    }

    // ===== MOBILE MENU =====
    const hamburger = document.querySelector('.hamburger');
    const navLinks  = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        document.querySelectorAll('.nav-links a').forEach(a => {
            a.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // ===== FOOTER YEAR =====
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ===== ACTIVE NAV LINK =====
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a:not(.btn-nav)').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active-link');
        }
    });

    // ===== SCROLL REVEAL =====
    const fadeEls = document.querySelectorAll('.fade-in');
    if (fadeEls.length > 0) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
        fadeEls.forEach((el, i) => { el.style.transitionDelay = `${i * 0.07}s`; obs.observe(el); });
    }

    // ===== CONTACT FORM =====
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn    = document.getElementById('contactSubmitBtn');
            const status = document.getElementById('formStatus');
            const orig   = btn.textContent;
            btn.textContent = 'Sending...'; btn.disabled = true;
            if (status) status.style.display = 'none';
            try {
                const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } });
                if (res.ok) {
                    btn.textContent = 'Sent! ✓';
                    if (status) { status.textContent = "Thanks! I'll get back to you soon."; status.style.color = '#16a34a'; status.style.display = 'block'; }
                    form.reset();
                } else {
                    const d = await res.json();
                    throw new Error(d.errors ? d.errors.map(x => x.message).join(', ') : 'Something went wrong.');
                }
            } catch (err) {
                btn.textContent = 'Failed ✗';
                if (status) { status.textContent = err.message || 'Network error.'; status.style.color = '#dc2626'; status.style.display = 'block'; }
            }
            setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 4000);
        });
    }

    // ===== RIPPLE EFFECT =====
    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
        btn.style.cssText += ';position:relative;overflow:hidden';
        btn.addEventListener('click', (e) => {
            const r    = document.createElement('span');
            const rect = btn.getBoundingClientRect();
            const sz   = Math.max(rect.width, rect.height);
            r.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;left:${e.clientX-rect.left-sz/2}px;top:${e.clientY-rect.top-sz/2}px;border-radius:50%;background:rgba(0,0,0,0.1);transform:scale(0);animation:rippleAnim 0.5s ease-out forwards;pointer-events:none`;
            if (!document.getElementById('rippleStyle')) {
                const s = document.createElement('style'); s.id = 'rippleStyle';
                s.textContent = '@keyframes rippleAnim{to{transform:scale(2.5);opacity:0}}';
                document.head.appendChild(s);
            }
            btn.appendChild(r);
            r.addEventListener('animationend', () => r.remove());
        });
    });

});
