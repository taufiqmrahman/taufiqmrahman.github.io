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
//  STATIC BACKGROUND DOODLES — placed in gutters, no movement
// ================================================================
function initDoodles() {

    const canvas = document.createElement('canvas');
    canvas.id = 'bgDoodles';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none';
    document.body.insertBefore(canvas, document.body.firstChild);
    const ctx = canvas.getContext('2d');

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

    function drawMonitor(ctx, s, a) {
        applyStyle(ctx, a, s * 0.09);
        const W = s*2, H = s*1.4, r = s*0.12, pad = s*0.2;
        ctx.beginPath(); ctx.roundRect(-W/2,-H/2,W,H,r); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(-W/2+pad,-H/2+pad,W-pad*2,H-pad*2,r*0.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(0,H/2+s*0.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*0.6,H/2+s*0.4); ctx.lineTo(s*0.6,H/2+s*0.4); ctx.stroke();
    }

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

    function drawKeyboard(ctx, s, a) {
        applyStyle(ctx, a, s*0.08);
        const W = s*3.0, H = s*1.1, r = s*0.1;
        ctx.beginPath(); ctx.roundRect(-W/2,-H/2,W,H,r); ctx.stroke();
        const cols = 8, rows = 3, kW = (W*0.88)/cols, kH = (H*0.7)/rows;
        const sx = -W/2+W*0.06, sy = -H/2+H*0.12;
        ctx.lineWidth = s*0.06;
        for (let r2 = 0; r2 < rows; r2++) {
            for (let c = 0; c < cols; c++) {
                ctx.beginPath(); ctx.roundRect(sx+c*kW, sy+r2*kH, kW*0.78, kH*0.75, s*0.04); ctx.stroke();
            }
        }
    }

    function drawMouse(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const W = s*1.2, H = s*1.8;
        ctx.beginPath(); ctx.ellipse(0,s*0.15,W/2,H/2,0,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,-H/2+s*0.1); ctx.lineTo(0,0); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(-s*0.18,-s*0.28,s*0.36,s*0.5,s*0.08); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-W/2+s*0.05,-s*0.1); ctx.quadraticCurveTo(0,s*0.05,W/2-s*0.05,-s*0.1); ctx.stroke();
    }

    function drawHeadphones(ctx, s, a) {
        applyStyle(ctx, a, s*0.1);
        const r = s*1.0;
        ctx.beginPath(); ctx.arc(0,0,r,Math.PI,0); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(-r,s*0.1,s*0.32,s*0.5,0,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse( r,s*0.1,s*0.32,s*0.5,0,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r,-s*0.05); ctx.lineTo(-r,-r*0.92); ctx.stroke();
        ctx.beginPath(); ctx.moveTo( r,-s*0.05); ctx.lineTo( r,-r*0.92); ctx.stroke();
    }

    function drawWifi(ctx, s, a) {
        applyStyle(ctx, a, s*0.1);
        for (let i = 3; i >= 1; i--) {
            ctx.beginPath(); ctx.arc(0,s*0.6,s*0.45*i,Math.PI*1.2,Math.PI*1.8); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(0,s*0.6,s*0.12,0,Math.PI*2); ctx.fill();
    }

    function drawGear(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const teeth = 8, outerR = s*1.0, innerR = s*0.68, toothH = s*0.28;
        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
            const ang  = (i/teeth)*Math.PI*2;
            const next = ((i+1)/teeth)*Math.PI*2;
            const half = (next-ang)*0.3;
            ctx.lineTo(Math.cos(ang-half)*innerR,         Math.sin(ang-half)*innerR);
            ctx.lineTo(Math.cos(ang-half)*(outerR+toothH),Math.sin(ang-half)*(outerR+toothH));
            ctx.lineTo(Math.cos(ang+half)*(outerR+toothH),Math.sin(ang+half)*(outerR+toothH));
            ctx.lineTo(Math.cos(ang+half)*innerR,         Math.sin(ang+half)*innerR);
        }
        ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0,0,s*0.35,0,Math.PI*2); ctx.stroke();
    }

    function drawHDD(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const W = s*2.2, H = s*1.5, r = s*0.25;
        ctx.beginPath(); ctx.roundRect(-W/2,-H/2,W,H,r); ctx.stroke();
        ctx.beginPath(); ctx.arc(-s*0.15,0,s*0.52,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(-s*0.15,0,s*0.18,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*0.15+s*0.18,0); ctx.lineTo(s*0.85,-s*0.25); ctx.stroke();
        ctx.beginPath(); ctx.arc(s*0.85,-s*0.25,s*0.12,0,Math.PI*2); ctx.fill();
        for (let i = 0; i < 4; i++) {
            ctx.beginPath(); ctx.roundRect(W/2-s*0.18,-H*0.3+i*s*0.22,s*0.16,s*0.14,s*0.03); ctx.stroke();
        }
    }

    function drawBattery(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const W = s*2.2, H = s*1.0, r = s*0.12;
        ctx.beginPath(); ctx.roundRect(-W/2,-H/2,W,H,r); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(W/2,-H*0.25,s*0.22,H*0.5,s*0.06); ctx.stroke();
        const bars = 3, barW = (W*0.72)/bars - s*0.1;
        for (let i = 0; i < bars; i++) {
            ctx.beginPath(); ctx.roundRect(-W*0.38+i*(barW+s*0.1),-H*0.28,barW,H*0.56,s*0.05); ctx.fill();
        }
    }

    function drawPower(ctx, s, a) {
        applyStyle(ctx, a, s*0.11);
        const r = s*1.0;
        ctx.beginPath(); ctx.arc(0,0,r,Math.PI*0.2,Math.PI*0.8,false); ctx.stroke();
        ctx.beginPath(); ctx.arc(0,0,r,Math.PI*1.2,Math.PI*1.8,false); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,-r); ctx.lineTo(0,-r*0.3); ctx.stroke();
    }

    function drawUSB(ctx, s, a) {
        applyStyle(ctx, a, s*0.1);
        ctx.beginPath(); ctx.moveTo(0,s*0.9); ctx.lineTo(0,-s*0.3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,s*0.0); ctx.lineTo(-s*0.65,-s*0.6); ctx.stroke();
        ctx.beginPath(); ctx.rect(-s*0.65-s*0.18,-s*0.6-s*0.14,s*0.36,s*0.28); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,-s*0.1); ctx.lineTo(s*0.55,-s*0.65); ctx.stroke();
        ctx.beginPath(); ctx.arc(s*0.55,-s*0.65-s*0.14,s*0.16,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0,s*0.9,s*0.16,0,Math.PI*2); ctx.fill();
    }

    function drawServer(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const W = s*2.2, unitH = s*0.5, units = 4, r = s*0.07;
        for (let i = 0; i < units; i++) {
            const y = -units*unitH/2+i*unitH;
            ctx.beginPath(); ctx.roundRect(-W/2,y+s*0.04,W,unitH-s*0.08,r); ctx.stroke();
            ctx.beginPath(); ctx.arc(W/2-s*0.2,y+unitH/2,s*0.07,0,Math.PI*2); ctx.fill();
            for (let d = 0; d < 3; d++) {
                ctx.beginPath(); ctx.roundRect(-W/2+s*0.15+d*s*0.42,y+s*0.14,s*0.3,unitH*0.55,s*0.03); ctx.stroke();
            }
        }
    }

    function drawLaptop(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const W = s*2.4, H = s*1.5, r = s*0.1, pad = s*0.18;
        ctx.beginPath(); ctx.roundRect(-W/2,-H,W,H*0.7,r); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(-W/2+pad,-H+pad,W-pad*2,H*0.7-pad*2,s*0.05); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(-W/2-s*0.15,-H*0.3,W+s*0.3,H*0.3,r); ctx.stroke();
        ctx.lineWidth = s*0.06;
        for (let row = 0; row < 2; row++) {
            ctx.beginPath(); ctx.moveTo(-W/2+s*0.35,-H*0.18+row*s*0.28); ctx.lineTo(W/2-s*0.35,-H*0.18+row*s*0.28); ctx.stroke();
        }
    }

    function drawCircuit(ctx, s, a, segments) {
        applyStyle(ctx, a, s*0.1);
        let cx = -s, cy = 0;
        ctx.beginPath(); ctx.moveTo(cx,cy);
        if (segments) {
            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                if (i%2===0) cx += seg * s;
                else         cy += seg * s;
                ctx.lineTo(cx,cy);
            }
        }
        ctx.stroke();
        ctx.beginPath(); ctx.arc(-s,0,s*0.13,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx,cy,s*0.13,0,Math.PI*2); ctx.fill();
    }

    function drawSine(ctx, s, a) {
        applyStyle(ctx, a, s*0.1);
        const W = s*3.0, amp = s*0.55;
        ctx.beginPath(); ctx.roundRect(-W/2,-amp-s*0.2,W,amp*2+s*0.4,s*0.1); ctx.stroke();
        ctx.beginPath();
        for (let t = 0; t <= 1; t += 0.02) {
            const x = -W/2+s*0.2+t*(W-s*0.4), y = -amp*Math.sin(t*Math.PI*4);
            t===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.stroke();
    }

    function drawController(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const W = s*2.4, H = s*1.5;
        ctx.beginPath();
        ctx.moveTo(-W*0.18,-H/2); ctx.lineTo(W*0.18,-H/2);
        ctx.quadraticCurveTo(W/2,-H/2,W/2,0);
        ctx.quadraticCurveTo(W/2,H/2,W*0.25,H/2);
        ctx.lineTo(W*0.08,H*0.25); ctx.lineTo(-W*0.08,H*0.25);
        ctx.lineTo(-W*0.25,H/2);
        ctx.quadraticCurveTo(-W/2,H/2,-W/2,0);
        ctx.quadraticCurveTo(-W/2,-H/2,-W*0.18,-H/2);
        ctx.stroke();
        ctx.lineWidth = s*0.07;
        const dpX=-W*0.3, dpY=s*0.05, ds=s*0.22;
        ctx.beginPath(); ctx.moveTo(dpX,dpY-ds); ctx.lineTo(dpX,dpY+ds); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(dpX-ds,dpY); ctx.lineTo(dpX+ds,dpY); ctx.stroke();
        [{x:W*0.32,y:-s*0.18},{x:W*0.2,y:s*0.05},{x:W*0.44,y:s*0.05},{x:W*0.32,y:s*0.28}].forEach(b=>{
            ctx.beginPath(); ctx.arc(b.x,b.y,s*0.11,0,Math.PI*2); ctx.stroke();
        });
    }

    function drawBulb(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const r = s*0.85;
        ctx.beginPath();
        ctx.arc(0,-s*0.2,r,Math.PI*0.15,Math.PI*0.85,true);
        ctx.lineTo(-r*0.55,s*0.45);
        ctx.quadraticCurveTo(-r*0.55,s*0.7,0,s*0.75);
        ctx.quadraticCurveTo(r*0.55,s*0.7,r*0.55,s*0.45);
        ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*0.45,s*0.78); ctx.lineTo(s*0.45,s*0.78); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*0.38,s*0.95); ctx.lineTo(s*0.38,s*0.95); ctx.stroke();
        ctx.lineWidth = s*0.07;
        ctx.beginPath();
        ctx.moveTo(-s*0.28,s*0.2); ctx.lineTo(-s*0.1,s*0.05);
        ctx.lineTo(s*0.1,s*0.2);   ctx.lineTo(s*0.28,s*0.05);
        ctx.stroke();
    }

    function drawNetwork(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const nodes = [{x:0,y:-s},{x:-s,y:s*0.3},{x:s,y:s*0.3},{x:-s*0.4,y:s*1.1},{x:s*0.4,y:s*1.1}];
        [[0,1],[0,2],[1,2],[1,3],[2,4],[3,4]].forEach(([i,j])=>{
            ctx.beginPath(); ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y); ctx.stroke();
        });
        nodes.forEach(n=>{
            ctx.beginPath(); ctx.arc(n.x,n.y,s*0.18,0,Math.PI*2); ctx.stroke();
        });
    }

    function drawMotherboard(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const W = s*2.8, H = s*2.4, r = s*0.15;
        ctx.beginPath(); ctx.roundRect(-W/2,-H/2,W,H,r); ctx.stroke();
        const sq = s*0.8;
        ctx.beginPath(); ctx.roundRect(-sq/2,-H*0.2,sq,sq,s*0.08); ctx.stroke();
        for (let i = 0; i < 2; i++) {
            ctx.beginPath(); ctx.roundRect(W*0.25+i*s*0.35,-H*0.35,s*0.22,H*0.55,s*0.04); ctx.stroke();
        }
        ctx.beginPath(); ctx.roundRect(-W*0.42,H*0.2,W*0.65,s*0.24,s*0.04); ctx.stroke();
        [[-W*0.38,-H*0.32],[W*0.38,H*0.1],[-W*0.15,H*0.35]].forEach(([cx,cy])=>{
            ctx.beginPath(); ctx.arc(cx,cy,s*0.14,0,Math.PI*2); ctx.stroke();
        });
    }

    function drawMagnifier(ctx, s, a) {
        applyStyle(ctx, a, s*0.11);
        ctx.beginPath(); ctx.arc(0,-s*0.2,s*0.72,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s*0.72*0.72,-s*0.2+s*0.72*0.72); ctx.lineTo(s*1.2,s*1.1); ctx.stroke();
    }

    function drawSD(ctx, s, a) {
        applyStyle(ctx, a, s*0.09);
        const W = s*1.4, H = s*1.8, cut = s*0.35, r = s*0.1;
        ctx.beginPath();
        ctx.moveTo(-W/2+cut,-H/2); ctx.lineTo(W/2-r,-H/2); ctx.arcTo(W/2,-H/2,W/2,-H/2+r,r);
        ctx.lineTo(W/2,H/2-r); ctx.arcTo(W/2,H/2,W/2-r,H/2,r);
        ctx.lineTo(-W/2+r,H/2); ctx.arcTo(-W/2,H/2,-W/2,H/2-r,r);
        ctx.lineTo(-W/2,-H/2+cut); ctx.closePath(); ctx.stroke();
        const pins=4, pinW=(W*0.7)/pins;
        for (let i=0;i<pins;i++) {
            ctx.beginPath(); ctx.moveTo(-W*0.32+i*pinW,H/2-s*0.08); ctx.lineTo(-W*0.32+i*pinW,H/2-s*0.5); ctx.stroke();
        }
    }

    // ── all drawers ──────────────────────────────────────────────
    const DRAWERS = [
        drawMonitor, drawCPU, drawRAM, drawKeyboard, drawMouse,
        drawHeadphones, drawWifi, drawGear, drawHDD, drawBattery,
        drawPower, drawUSB, drawServer, drawLaptop, drawCircuit,
        drawSine, drawController, drawBulb, drawNetwork,
        drawMotherboard, drawMagnifier, drawSD,
    ];

    // ── layout: place doodles only in the side gutters ───────────
    let W, H, particles = [];

    function buildParticles() {
        particles = [];

        // Content column bounds (matches CSS max-width: 860px centred)
        const CONTENT_W   = 900;           // a little wider than 860 for safety
        const contentLeft  = Math.max(0, (W - CONTENT_W) / 2);
        const contentRight = Math.min(W,  (W + CONTENT_W) / 2);
        const gutterL = contentLeft;        // width of left gutter
        const gutterR = W - contentRight;   // width of right gutter

        const MIN_GUTTER = 100;            // don't draw if gutter too thin

        // Determine doodle size based on available space
        const maxSize = Math.min(34, Math.max(18, Math.min(gutterL, gutterR) * 0.30));
        const minSize = maxSize * 0.55;

        // --- LEFT GUTTER ---
        if (gutterL >= MIN_GUTTER) {
            // How many rows fit?
            const rows = Math.floor(H / (maxSize * 3.8));
            for (let row = 0; row < rows; row++) {
                const size  = minSize + Math.random() * (maxSize - minSize);
                const pad   = size * 1.8;
                const xMax  = gutterL - pad;
                if (xMax < pad) continue;
                const x = pad + Math.random() * (xMax - pad);
                const y = (row / rows) * H + (Math.random() * (H / rows));
                particles.push(makeParticle(x, y, size));
            }
        }

        // --- RIGHT GUTTER ---
        if (gutterR >= MIN_GUTTER) {
            const rows = Math.floor(H / (maxSize * 3.8));
            for (let row = 0; row < rows; row++) {
                const size  = minSize + Math.random() * (maxSize - minSize);
                const pad   = size * 1.8;
                const xMin  = contentRight + pad;
                const xMax  = W - pad;
                if (xMin >= xMax) continue;
                const x = xMin + Math.random() * (xMax - xMin);
                const y = (row / rows) * H + (Math.random() * (H / rows));
                particles.push(makeParticle(x, y, size));
            }
        }

        // --- Narrow screens: sprinkle a few tiny ones top & bottom ---
        if (gutterL < MIN_GUTTER && gutterR < MIN_GUTTER) {
            const count = 6;
            for (let i = 0; i < count; i++) {
                const size = 14 + Math.random() * 10;
                const side = Math.random() < 0.5 ? -1 : 1;
                const x = W/2 + side * (Math.random() * W * 0.42 + W * 0.06);
                const top = Math.random() < 0.5;
                const y = top ? size * 2 + Math.random() * 60 : H - size * 2 - Math.random() * 60;
                particles.push(makeParticle(x, y, size));
            }
        }
    }

    function makeParticle(x, y, size) {
        const drawFn = DRAWERS[Math.floor(Math.random() * DRAWERS.length)];
        let circuitSegments = null;
        if (drawFn === drawCircuit) {
            const segs = 3 + Math.floor(Math.random() * 3);
            circuitSegments = [];
            for (let i = 0; i < segs; i++) {
                const len = 0.5 + Math.random() * 1.2;
                circuitSegments.push((Math.random() < 0.5 ? 1 : -1) * len);
            }
        }
        return {
            draw:  drawFn,
            x, y, size,
            alpha: 0.15 + Math.random() * 0.15,
            rot:   (Math.random() - 0.5) * 0.55,
            phase: Math.random() * Math.PI * 2,
            circuitSegments,
        };
    }

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width  = W;
        canvas.height = H;
        buildParticles();
    }

    // ── animation: opacity breathe only, NO position changes ─────
    let frame = 0;
    function tick() {
        ctx.clearRect(0, 0, W, H);
        frame++;
        for (const p of particles) {
            // very slow, gentle opacity pulse ±15 %
            const breathe = 0.85 + 0.15 * Math.sin(frame * 0.008 + p.phase);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            p.draw(ctx, p.size, p.alpha * breathe, p.circuitSegments);
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
