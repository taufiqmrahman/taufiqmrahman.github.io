// roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        this.beginPath();
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.arcTo(x + w, y, x + w, y + r, r);
        this.lineTo(x + w, y + h - r);
        this.arcTo(x + w, y + h, x + w - r, y + h, r);
        this.lineTo(x + r, y + h);
        this.arcTo(x, y + h, x, y + h - r, r);
        this.lineTo(x, y + r);
        this.arcTo(x, y, x + r, y, r);
        this.closePath();
        return this;
    };
}

document.addEventListener('DOMContentLoaded', () => {

    // ===== THEME TOGGLE =====
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('tmr-theme') || 'light';
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
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
        fadeEls.forEach((el, i) => { el.style.transitionDelay = `${i * 0.06}s`; obs.observe(el); });
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

    // ===== RIPPLE =====
    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
        btn.style.cssText += ';position:relative;overflow:hidden';
        btn.addEventListener('click', (e) => {
            const r    = document.createElement('span');
            const rect = btn.getBoundingClientRect();
            const sz   = Math.max(rect.width, rect.height);
            r.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;left:${e.clientX-rect.left-sz/2}px;top:${e.clientY-rect.top-sz/2}px;border-radius:50%;background:rgba(128,128,128,0.18);transform:scale(0);animation:rippleAnim 0.55s ease-out forwards;pointer-events:none`;
            if (!document.getElementById('rippleStyle')) {
                const s = document.createElement('style'); s.id = 'rippleStyle';
                s.textContent = '@keyframes rippleAnim{to{transform:scale(2.8);opacity:0}}';
                document.head.appendChild(s);
            }
            btn.appendChild(r);
            r.addEventListener('animationend', () => r.remove());
        });
    });

    // ===== DOODLES =====
    initDoodles();
});


// ================================================================
//  STATIC BACKGROUND DOODLES — deterministic placement, fixed icons
// ================================================================
function initDoodles() {

    const canvas = document.createElement('canvas');
    canvas.id = 'bgDoodles';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none';
    document.body.insertBefore(canvas, document.body.firstChild);
    const ctx = canvas.getContext('2d');

    // ── Seeded PRNG (deterministic — same result every load) ─────
    function seededRandom(seed) {
        let s = seed;
        return function() {
            s = (s * 16807 + 0) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }
    const SEED = 314159;  // fixed seed — never changes
    let rng = seededRandom(SEED);

    // ── colour helper ────────────────────────────────────────────
    function getColor(alpha) {
        const dark = document.documentElement.getAttribute('data-theme') === 'dark';
        return dark ? `rgba(123,154,204,${alpha})` : `rgba(28,42,98,${alpha})`;
    }
    function applyStyle(ctx, alpha, lw) {
        ctx.strokeStyle = getColor(alpha);
        ctx.fillStyle   = getColor(alpha);
        ctx.lineWidth   = lw;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
    }

    // ── icon drawers (centred at 0,0, scaled by s) ───────────────

    // 1. PC Monitor
    function drawMonitor(ctx, s, a) {
        applyStyle(ctx, a, s * 0.09);
        const W = s*2, H = s*1.4, r = s*0.12, pad = s*0.2;
        ctx.beginPath(); ctx.roundRect(-W/2,-H/2,W,H,r); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(-W/2+pad,-H/2+pad,W-pad*2,H-pad*2,r*0.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(0,H/2+s*0.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*0.6,H/2+s*0.4); ctx.lineTo(s*0.6,H/2+s*0.4); ctx.stroke();
    }

    // 2. Processor / CPU
    function drawCPU(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const W = s*1.8, pins = 4, pinLen = s*0.45, gap = W/(pins+1);
        ctx.beginPath(); ctx.roundRect(-W/2,-W/2,W,W,s*0.18); ctx.stroke();
        const inner = W*0.5;
        ctx.beginPath(); ctx.roundRect(-inner/2,-inner/2,inner,inner,s*0.08); ctx.stroke();
        ctx.lineWidth = s*0.05;
        ctx.beginPath(); ctx.moveTo(-inner/2,0); ctx.lineTo(inner/2,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,-inner/2); ctx.lineTo(0,inner/2); ctx.stroke();
        ctx.lineWidth = s*0.09;
        for (let i = 1; i <= pins; i++) {
            const p = -W/2 + i*gap;
            ctx.beginPath(); ctx.moveTo(p,-W/2); ctx.lineTo(p,-W/2-pinLen); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p, W/2); ctx.lineTo(p, W/2+pinLen); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-W/2,p); ctx.lineTo(-W/2-pinLen,p); ctx.stroke();
            ctx.beginPath(); ctx.moveTo( W/2,p); ctx.lineTo( W/2+pinLen,p); ctx.stroke();
        }
    }

    // 3. Headphones
    function drawHeadphones(ctx, s, a) {
        applyStyle(ctx, a, s*0.1);
        const r = s*1.0;
        ctx.beginPath(); ctx.arc(0,0,r,Math.PI,0); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(-r,s*0.1,s*0.32,s*0.5,0,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse( r,s*0.1,s*0.32,s*0.5,0,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r,-s*0.05); ctx.lineTo(-r,-r*0.92); ctx.stroke();
        ctx.beginPath(); ctx.moveTo( r,-s*0.05); ctx.lineTo( r,-r*0.92); ctx.stroke();
    }

    // 4. Camera
    function drawCamera(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const W = s*2.4, H = s*1.6, r = s*0.15;
        // Body
        ctx.beginPath(); ctx.roundRect(-W/2,-H/2,W,H,r); ctx.stroke();
        // Lens (big circle)
        ctx.beginPath(); ctx.arc(-s*0.1,0,s*0.55,0,Math.PI*2); ctx.stroke();
        // Inner lens
        ctx.beginPath(); ctx.arc(-s*0.1,0,s*0.28,0,Math.PI*2); ctx.stroke();
        // Lens dot
        ctx.beginPath(); ctx.arc(-s*0.1,0,s*0.08,0,Math.PI*2); ctx.fill();
        // Viewfinder bump
        ctx.beginPath(); ctx.roundRect(s*0.15,-H/2-s*0.28,s*0.55,s*0.3,s*0.06); ctx.stroke();
        // Flash
        ctx.beginPath(); ctx.arc(W/2-s*0.35,-H/2+s*0.3,s*0.12,0,Math.PI*2); ctx.stroke();
    }

    // 5. RAM
    function drawRAM(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const W = s*3.2, H = s*1.1;
        ctx.beginPath(); ctx.roundRect(-W/2,-H/2,W,H,s*0.08); ctx.stroke();
        const chipW = s*0.32, chipH = s*0.38, chips = 6, spacing = W/(chips+1);
        for (let i = 1; i <= chips; i++) {
            ctx.beginPath(); ctx.roundRect(-W/2+i*spacing-chipW/2,-H*0.38,chipW,chipH,s*0.04); ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(-s*0.12, H/2); ctx.lineTo(-s*0.12, H/2-s*0.22);
        ctx.lineTo( s*0.12, H/2-s*0.22); ctx.lineTo( s*0.12, H/2);
        ctx.stroke();
    }

    // 6. SSD
    function drawSSD(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const W = s*2.4, H = s*1.6, r = s*0.14;
        // Outer casing
        ctx.beginPath(); ctx.roundRect(-W/2,-H/2,W,H,r); ctx.stroke();
        // Label area
        ctx.beginPath(); ctx.roundRect(-W/2+s*0.18,-H/2+s*0.15,W-s*0.36,H*0.45,s*0.06); ctx.stroke();
        // SSD text line
        ctx.lineWidth = s*0.06;
        ctx.beginPath(); ctx.moveTo(-s*0.4,-H/2+s*0.32); ctx.lineTo(s*0.4,-H/2+s*0.32); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*0.25,-H/2+s*0.48); ctx.lineTo(s*0.25,-H/2+s*0.48); ctx.stroke();
        // Connector pins at bottom
        ctx.lineWidth = s*0.09;
        const pins = 6, pinGap = (W*0.7)/(pins-1);
        for (let i = 0; i < pins; i++) {
            const px = -W*0.35 + i*pinGap;
            ctx.beginPath(); ctx.moveTo(px,H/2-s*0.08); ctx.lineTo(px,H/2+s*0.15); ctx.stroke();
        }
        // Corner screw holes
        const sc = s*0.1;
        [[-W/2+s*0.2,-H/2+s*0.2],[W/2-s*0.2,-H/2+s*0.2],[-W/2+s*0.2,H/2-s*0.2],[W/2-s*0.2,H/2-s*0.2]].forEach(([cx,cy])=>{
            ctx.beginPath(); ctx.arc(cx,cy,sc,0,Math.PI*2); ctx.stroke();
        });
    }

    // 7. GPU
    function drawGPU(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const W = s*2.8, H = s*1.8, r = s*0.12;
        // PCB board
        ctx.beginPath(); ctx.roundRect(-W/2,-H/2,W,H,r); ctx.stroke();
        // Big fan (circle)
        ctx.beginPath(); ctx.arc(-s*0.3,0,s*0.6,0,Math.PI*2); ctx.stroke();
        // Fan blades (cross)
        ctx.lineWidth = s*0.06;
        const fanR = s*0.45;
        for (let i = 0; i < 6; i++) {
            const ang = (i/6)*Math.PI*2;
            ctx.beginPath();
            ctx.moveTo(-s*0.3+Math.cos(ang)*s*0.12, Math.sin(ang)*s*0.12);
            ctx.lineTo(-s*0.3+Math.cos(ang)*fanR, Math.sin(ang)*fanR);
            ctx.stroke();
        }
        // Fan center
        ctx.lineWidth = s*0.09;
        ctx.beginPath(); ctx.arc(-s*0.3,0,s*0.15,0,Math.PI*2); ctx.stroke();
        // Heatsink fins on right side
        ctx.lineWidth = s*0.05;
        for (let i = 0; i < 5; i++) {
            const fy = -H*0.35 + i*(H*0.7)/4;
            ctx.beginPath(); ctx.moveTo(s*0.45,fy); ctx.lineTo(W/2-s*0.12,fy); ctx.stroke();
        }
        // Display ports at bottom
        ctx.lineWidth = s*0.09;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath(); ctx.roundRect(-W*0.35+i*s*0.6,H/2-s*0.04,s*0.4,s*0.2,s*0.04); ctx.stroke();
        }
    }

    // 8. Cloud
    function drawCloud(ctx, s, a) {
        applyStyle(ctx, a, s*0.1);
        // Main cloud shape using overlapping circles
        ctx.beginPath();
        ctx.arc(-s*0.55, s*0.1, s*0.55, Math.PI*0.6, Math.PI*1.9); // left
        ctx.arc(0, -s*0.35, s*0.65, Math.PI*1.1, Math.PI*0.0);     // top
        ctx.arc(s*0.6, s*0.05, s*0.5, Math.PI*1.4, Math.PI*0.5);   // right
        ctx.lineTo(-s*0.55+s*0.55*Math.cos(Math.PI*0.6), s*0.1+s*0.55*Math.sin(Math.PI*0.6));
        ctx.stroke();
        // Upload arrow inside
        ctx.lineWidth = s*0.08;
        ctx.beginPath(); ctx.moveTo(0,s*0.35); ctx.lineTo(0,-s*0.05); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*0.22,s*0.12); ctx.lineTo(0,-s*0.1); ctx.lineTo(s*0.22,s*0.12); ctx.stroke();
    }

    // 9. AI (Brain)
    function drawAI(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const r = s*0.9;
        // Brain outline — left hemisphere
        ctx.beginPath();
        ctx.arc(-s*0.15, -s*0.1, r*0.6, Math.PI*0.5, Math.PI*1.5);
        ctx.stroke();
        // Brain outline — right hemisphere
        ctx.beginPath();
        ctx.arc(s*0.15, -s*0.1, r*0.6, Math.PI*1.5, Math.PI*0.5);
        ctx.stroke();
        // Center divide
        ctx.beginPath(); ctx.moveTo(0,-r*0.6-s*0.1); ctx.lineTo(0,r*0.5-s*0.1); ctx.stroke();
        // Neural connection dots
        ctx.lineWidth = s*0.06;
        const nodes = [
            {x:-s*0.35, y:-s*0.3}, {x:-s*0.3, y:s*0.15},
            {x:s*0.35, y:-s*0.3},  {x:s*0.3, y:s*0.15},
            {x:0, y:-s*0.5},       {x:0, y:s*0.25}
        ];
        // Connection lines
        ctx.beginPath(); ctx.moveTo(nodes[0].x,nodes[0].y); ctx.lineTo(nodes[4].x,nodes[4].y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(nodes[2].x,nodes[2].y); ctx.lineTo(nodes[4].x,nodes[4].y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(nodes[0].x,nodes[0].y); ctx.lineTo(nodes[1].x,nodes[1].y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(nodes[2].x,nodes[2].y); ctx.lineTo(nodes[3].x,nodes[3].y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(nodes[1].x,nodes[1].y); ctx.lineTo(nodes[5].x,nodes[5].y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(nodes[3].x,nodes[3].y); ctx.lineTo(nodes[5].x,nodes[5].y); ctx.stroke();
        // Dots
        nodes.forEach(n => {
            ctx.beginPath(); ctx.arc(n.x,n.y,s*0.08,0,Math.PI*2); ctx.fill();
        });
        // "AI" label below
        ctx.lineWidth = s*0.07;
        // A
        ctx.beginPath(); ctx.moveTo(-s*0.28,s*0.75); ctx.lineTo(-s*0.15,s*0.5); ctx.lineTo(-s*0.02,s*0.75); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*0.24,s*0.65); ctx.lineTo(-s*0.06,s*0.65); ctx.stroke();
        // I
        ctx.beginPath(); ctx.moveTo(s*0.12,s*0.5); ctx.lineTo(s*0.12,s*0.75); ctx.stroke();
    }

    // 10. Robot
    function drawRobot(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        // Head
        const hW = s*1.4, hH = s*1.0;
        ctx.beginPath(); ctx.roundRect(-hW/2,-s*0.9,hW,hH,s*0.18); ctx.stroke();
        // Eyes
        ctx.beginPath(); ctx.arc(-s*0.32,-s*0.45,s*0.18,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc( s*0.32,-s*0.45,s*0.18,0,Math.PI*2); ctx.stroke();
        // Eye pupils
        ctx.beginPath(); ctx.arc(-s*0.32,-s*0.45,s*0.07,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc( s*0.32,-s*0.45,s*0.07,0,Math.PI*2); ctx.fill();
        // Mouth
        ctx.beginPath(); ctx.roundRect(-s*0.35,-s*0.15,s*0.7,s*0.18,s*0.06); ctx.stroke();
        // Mouth lines
        ctx.lineWidth = s*0.05;
        for (let i = 0; i < 4; i++) {
            const mx = -s*0.2 + i*s*0.13;
            ctx.beginPath(); ctx.moveTo(mx,-s*0.14); ctx.lineTo(mx,-s*0.0); ctx.stroke();
        }
        // Antenna
        ctx.lineWidth = s*0.09;
        ctx.beginPath(); ctx.moveTo(0,-s*0.9); ctx.lineTo(0,-s*1.25); ctx.stroke();
        ctx.beginPath(); ctx.arc(0,-s*1.3,s*0.1,0,Math.PI*2); ctx.fill();
        // Body
        const bW = s*1.6, bH = s*0.9;
        ctx.beginPath(); ctx.roundRect(-bW/2,s*0.15,bW,bH,s*0.12); ctx.stroke();
        // Body panel lines
        ctx.lineWidth = s*0.05;
        ctx.beginPath(); ctx.moveTo(-s*0.5,s*0.45); ctx.lineTo(s*0.5,s*0.45); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*0.5,s*0.7); ctx.lineTo(s*0.5,s*0.7); ctx.stroke();
        // Arms
        ctx.lineWidth = s*0.09;
        ctx.beginPath(); ctx.moveTo(-bW/2,s*0.4); ctx.lineTo(-bW/2-s*0.35,s*0.55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo( bW/2,s*0.4); ctx.lineTo( bW/2+s*0.35,s*0.55); ctx.stroke();
    }

    // ── fixed icon list (exactly 10, in order) ──────────────────
    const DRAWERS = [
        drawMonitor,    // PC
        drawCPU,        // Processor
        drawHeadphones, // Headphones
        drawCamera,     // Camera
        drawRAM,        // RAM
        drawSSD,        // SSD
        drawGPU,        // GPU
        drawCloud,      // Cloud
        drawAI,         // AI
        drawRobot,      // Robot
    ];

    // ── layout: deterministic placement in side gutters ───────────
    let W, H, particles = [];

    function buildParticles() {
        particles = [];
        rng = seededRandom(SEED); // reset seed — same positions every time

        // Content column bounds (matches CSS max-width: 860px centred)
        const CONTENT_W    = 900;
        const contentLeft  = Math.max(0, (W - CONTENT_W) / 2);
        const contentRight = Math.min(W,  (W + CONTENT_W) / 2);
        const gutterL = contentLeft;
        const gutterR = W - contentRight;

        const MIN_GUTTER = 100;

        const maxSize = Math.min(34, Math.max(18, Math.min(gutterL, gutterR) * 0.30));
        const minSize = maxSize * 0.55;

        let iconIdx = 0;

        // --- LEFT GUTTER ---
        if (gutterL >= MIN_GUTTER) {
            const rows = Math.floor(H / (maxSize * 3.8));
            for (let row = 0; row < rows; row++) {
                const size = minSize + rng() * (maxSize - minSize);
                const pad  = size * 1.8;
                const xMax = gutterL - pad;
                if (xMax < pad) continue;
                const x = pad + rng() * (xMax - pad);
                const y = (row / rows) * H + (rng() * (H / rows));
                particles.push(makeParticle(x, y, size, iconIdx));
                iconIdx = (iconIdx + 1) % DRAWERS.length;
            }
        }

        // --- RIGHT GUTTER ---
        if (gutterR >= MIN_GUTTER) {
            const rows = Math.floor(H / (maxSize * 3.8));
            for (let row = 0; row < rows; row++) {
                const size = minSize + rng() * (maxSize - minSize);
                const pad  = size * 1.8;
                const xMin = contentRight + pad;
                const xMax = W - pad;
                if (xMin >= xMax) continue;
                const x = xMin + rng() * (xMax - xMin);
                const y = (row / rows) * H + (rng() * (H / rows));
                particles.push(makeParticle(x, y, size, iconIdx));
                iconIdx = (iconIdx + 1) % DRAWERS.length;
            }
        }

        // --- Narrow screens: a few tiny doodles top & bottom ---
        if (gutterL < MIN_GUTTER && gutterR < MIN_GUTTER) {
            const count = 6;
            for (let i = 0; i < count; i++) {
                const size = 14 + rng() * 10;
                const side = rng() < 0.5 ? -1 : 1;
                const x = W/2 + side * (rng() * W * 0.42 + W * 0.06);
                const top = rng() < 0.5;
                const y = top ? size * 2 + rng() * 60 : H - size * 2 - rng() * 60;
                particles.push(makeParticle(x, y, size, iconIdx));
                iconIdx = (iconIdx + 1) % DRAWERS.length;
            }
        }
    }

    function makeParticle(x, y, size, iconIndex) {
        return {
            draw:  DRAWERS[iconIndex],
            x, y, size,
            alpha: 0.15 + rng() * 0.15,
            rot:   (rng() - 0.5) * 0.55,
            phase: rng() * Math.PI * 2,
        };
    }

    // ── animation: opacity breathe only, NO position changes ─────
    let frame = 0;
    function tick() {
        ctx.clearRect(0, 0, W, H);
        frame++;
        for (const p of particles) {
            const breathe = 0.85 + 0.15 * Math.sin(frame * 0.008 + p.phase);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            p.draw(ctx, p.size, p.alpha * breathe);
            ctx.restore();
        }
        requestAnimationFrame(tick);
    }

    let resizeTimer;
    let prevWidth = 0;

    function handleResize() {
        const newW = window.innerWidth;
        const newH = window.innerHeight;
        canvas.width  = newW;
        canvas.height = newH;

        // Only regenerate doodles if width actually changed (not height-only from mobile address bar)
        if (newW !== prevWidth) {
            prevWidth = newW;
            W = newW;
            H = newH;
            buildParticles();
        } else {
            W = newW;
            H = newH;
        }
    }

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 150);
    }, { passive: true });

    // Initial setup
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    prevWidth = W;
    buildParticles();
    tick();
}
