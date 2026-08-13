document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Mobile nav ----
  const toggle = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Footer year ----
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // ---- Hero text reveal ----
  const heroReveals = document.querySelectorAll('.hero-reveal');
  const judgmentEl = document.getElementById('hero-judgment');
  const STRIKE_DELAY = 2400;
  const SWAP_DELAY = 2750;

  if (prefersReducedMotion) {
    heroReveals.forEach((el) => el.classList.add('is-visible'));
    if (judgmentEl) {
      judgmentEl.textContent = 'your judgment';
      judgmentEl.classList.add('is-final');
    }
  } else {
    heroReveals.forEach((el) => {
      const delay = Number(el.dataset.delay || 0);
      setTimeout(() => el.classList.add('is-visible'), delay);
    });
    if (judgmentEl) {
      setTimeout(() => judgmentEl.classList.add('is-struck'), STRIKE_DELAY);
      setTimeout(() => {
        judgmentEl.textContent = 'your judgment';
        judgmentEl.classList.remove('is-struck');
        judgmentEl.classList.add('is-final');
      }, SWAP_DELAY);
    }
  }

  // ---- Hero particles: chaos settles into the Agenzi swirl ----
  // A field of drifting, disordered dots — visual shorthand for "nobody's
  // judgment" — snaps into the logo's spiral formation at the same instant
  // the headline corrects itself to "your judgment". The copy and the
  // visual land the same point together, not as two separate effects.
  (() => {
    const canvas = document.getElementById('hero-particles');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');

    const BRAND_COLORS = ['#26339E', '#7B4FC9', '#C13FA0'];
    const GOLD = '#F3A83B';
    const ARMS = 4;
    const PER_ARM = 22;
    const CORE_COUNT = 8;

    let w = 0;
    let h = 0;
    let particles = [];
    let phase = prefersReducedMotion ? 'settled' : 'chaos';
    let settleStart = 0;
    let rotation = 0;
    const SETTLE_MS = 1300;

    function buildParticles() {
      const cx = w / 2;
      const cy = h * 0.48;
      const maxR = Math.min(w, h) * 0.52;
      particles = [];

      for (let a = 0; a < ARMS; a++) {
        const baseAngle = (a / ARMS) * Math.PI * 2;
        for (let i = 0; i < PER_ARM; i++) {
          const t = i / (PER_ARM - 1);
          const radius = maxR * (0.18 + t * 0.82);
          const angle = baseAngle + t * Math.PI * 1.35;
          particles.push({
            cx,
            cy,
            radius,
            angle,
            x: phase === 'chaos' ? Math.random() * w : cx + radius * Math.cos(angle + rotation),
            y: phase === 'chaos' ? Math.random() * h : cy + radius * Math.sin(angle + rotation),
            vx: (Math.random() - 0.5) * 0.9,
            vy: (Math.random() - 0.5) * 0.9,
            r: 1.4 + Math.random() * 1.6,
            color: BRAND_COLORS[a % BRAND_COLORS.length],
            core: false,
          });
        }
      }
      for (let i = 0; i < CORE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 9;
        particles.push({
          cx,
          cy,
          radius,
          angle,
          x: phase === 'chaos' ? Math.random() * w : cx + radius * Math.cos(angle),
          y: phase === 'chaos' ? Math.random() * h : cy + radius * Math.sin(angle),
          vx: (Math.random() - 0.5) * 0.9,
          vy: (Math.random() - 0.5) * 0.9,
          r: 2 + Math.random() * 2,
          color: GOLD,
          core: true,
        });
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
    }

    function startSettle() {
      if (phase !== 'chaos') return;
      phase = 'settling';
      settleStart = performance.now();
      particles.forEach((p) => {
        p.sx = p.x;
        p.sy = p.y;
      });
    }

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function draw(timestamp) {
      ctx.clearRect(0, 0, w, h);

      if (phase === 'settled') {
        rotation += 0.00012;
      }

      particles.forEach((p) => {
        if (phase === 'chaos') {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
        } else if (phase === 'settling') {
          const t = Math.min((timestamp - settleStart) / SETTLE_MS, 1);
          const e = easeOutCubic(t);
          const tx = p.cx + p.radius * Math.cos(p.angle + rotation);
          const ty = p.cy + p.radius * Math.sin(p.angle + rotation);
          p.x = p.sx + (tx - p.sx) * e;
          p.y = p.sy + (ty - p.sy) * e;
          if (t >= 1) phase = 'settled';
        } else {
          p.x = p.cx + p.radius * Math.cos(p.angle + rotation);
          p.y = p.cy + p.radius * Math.sin(p.angle + rotation);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.globalAlpha = p.core ? 0.9 : 0.62;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.core ? 12 : 5;
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);

    if (!prefersReducedMotion) {
      setTimeout(startSettle, SWAP_DELAY);
    }
    requestAnimationFrame(draw);
  })();

  // ---- GSAP ScrollTrigger pinned zoom ----
  // Sections scroll into place normally — fully visible, no shrink, no blur
  // approaching — then pin (genuinely locked in place, not just visually
  // static) and hold at full clarity for a deliberate beat, then zoom-blur
  // out and release into the next section. No entrance animation: a section
  // that's invisible/tiny while it's still approaching in normal scroll (its
  // pin hasn't engaged yet) is a dead, blank-looking stretch of scrolling —
  // that "blur" was actually this gap, not the transition itself.
  const zoomSections = Array.from(document.querySelectorAll('.reveal-section'));

  if (zoomSections.length && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    if (prefersReducedMotion) {
      zoomSections.forEach((section) => {
        const inner = section.querySelector('.reveal-inner');
        if (inner) gsap.set(inner, { opacity: 1, scale: 1 });
      });
    } else {
      // Hold worth roughly two natural scroll gestures, then a short exit —
      // the pin absorbs scroll input for this whole span, so it has to stay
      // short or scrolling feels stuck.
      const pinDistance = () => '+=' + Math.round(window.innerHeight * 1.6);

      zoomSections.forEach((section) => {
        const inner = section.querySelector('.reveal-inner');
        if (!inner) return;

        gsap.set(inner, { scale: 1, opacity: 1 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: pinDistance,
            pin: true,
            anticipatePin: 1,
            scrub: 0.5,
          },
        });
        // Position "2" leaves the first 2/3 of the pin as an implicit hold
        // at the gsap.set values above — that's the reading window — then
        // zooms out over the last 1/3.
        tl.to(inner, { scale: 1.35, opacity: 0, ease: 'none', duration: 1 }, 2);
      });
    }
  }

  // ---- Active nav link highlighting ----
  const navLinks = document.querySelectorAll('[data-nav-link]');
  const sections = document.querySelectorAll('main > section[id]');
  if (navLinks.length && sections.length && 'IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach((link) => {
              const match = link.getAttribute('href') === `#${id}`;
              link.toggleAttribute('aria-current', match);
              if (match) link.setAttribute('aria-current', 'page');
            });
          }
        });
      },
      { threshold: 0.5 }
    );
    sections.forEach((section) => navObserver.observe(section));
  }

  // ---- Land correctly on a direct hash link once layout/fonts settle ----
  if (window.location.hash) {
    window.addEventListener('load', () => {
      const target = document.querySelector(window.location.hash);
      if (target) {
        setTimeout(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }), 50);
      }
    });
  }

  // ---- Mouse parallax ----
  if (!prefersReducedMotion) {
    document.querySelectorAll('[data-parallax-scope]').forEach((scope) => {
      const targets = scope.querySelectorAll('[data-parallax-target]');
      if (!targets.length) return;
      let rafId = null;
      let pending = null;

      scope.addEventListener('mousemove', (e) => {
        const rect = scope.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        pending = { nx, ny };
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          if (pending) {
            targets.forEach((target) => {
              const depth = Number(target.dataset.parallaxDepth || 20);
              target.style.transform = `translate3d(${pending.nx * depth}px, ${pending.ny * depth}px, 0)`;
            });
          }
          rafId = null;
        });
      });

      scope.addEventListener('mouseleave', () => {
        targets.forEach((target) => {
          target.style.transform = 'translate3d(0, 0, 0)';
        });
      });
    });
  }
});
