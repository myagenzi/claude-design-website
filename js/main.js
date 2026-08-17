document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Intro video ----
  // Plays once on load, then fades out into the site. Reduced-motion
  // skips it outright (autoplaying video is exactly what that preference
  // asks to avoid). A hard timeout and an error handler both fall back to
  // revealing the site immediately — a failed or slow-loading video must
  // never leave a visitor stuck looking at a black screen.
  (() => {
    const overlay = document.getElementById('intro-overlay');
    const video = document.getElementById('intro-video');
    const skipBtn = document.getElementById('intro-skip');
    if (!overlay) return;

    if (prefersReducedMotion || !video) {
      overlay.remove();
      return;
    }

    document.body.classList.add('intro-locked');
    let dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      document.body.classList.remove('intro-locked');
      overlay.classList.add('is-hidden');
      setTimeout(() => overlay.remove(), 750);
    }

    video.addEventListener('ended', dismiss);
    video.addEventListener('error', dismiss);
    if (skipBtn) skipBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, 8000);

    // Autoplay can still be blocked by the browser despite muted+playsinline
    // (rare, but happens) — if play() rejects, don't wait for an 'ended'
    // event that will never come.
    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(dismiss);
    }
  })();

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

  // ---- Cart ----
  const cartToggle = document.getElementById('cart-toggle');
  const cartPanel = document.getElementById('cart-panel');
  const cartClose = document.getElementById('cart-close');
  const cartCount = document.getElementById('cart-count');
  const cartEmpty = document.getElementById('cart-empty');
  const cartItemsEl = document.getElementById('cart-items');
  const cartFooter = document.getElementById('cart-footer');
  const cartTotalRow = document.getElementById('cart-total-row');
  const cartTotalAmount = document.getElementById('cart-total-amount');
  const cartCheckout = document.getElementById('cart-checkout');
  const messageField = document.getElementById('message');
  const CART_KEY = 'agenzi-cart';

  if (cartToggle && cartPanel) {
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      cart = [];
    }

    function saveCart() {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
      } catch {
        // localStorage unavailable (private browsing, etc.) — cart still works for this session
      }
    }

    function renderCart() {
      const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
      if (totalQty > 0) {
        cartCount.textContent = String(totalQty);
        cartCount.classList.remove('hidden');
        cartCount.classList.add('inline-flex');
      } else {
        cartCount.classList.add('hidden');
        cartCount.classList.remove('inline-flex');
      }

      if (cart.length === 0) {
        cartEmpty.classList.remove('hidden');
        cartItemsEl.classList.add('hidden');
        cartFooter.classList.add('hidden');
        cartItemsEl.innerHTML = '';
        return;
      }

      cartEmpty.classList.add('hidden');
      cartItemsEl.classList.remove('hidden');
      cartFooter.classList.remove('hidden');

      cartItemsEl.innerHTML = cart
        .map(
          (item) => `
        <li class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-paper">${item.plan}${item.qty > 1 ? ` × ${item.qty}` : ''}</p>
            <p class="text-xs text-muted">${item.price}</p>
          </div>
          <button type="button" class="press text-xs text-paper/40 hover:text-magenta" data-remove-plan="${item.plan}" aria-label="Remove ${item.plan} from cart">Remove</button>
        </li>`
        )
        .join('');

      // Custom has no fixed number ("Custom quote") so it can't be summed —
      // it's the one plan that needs a real consult before a price exists.
      // Fixed-price plans (Starter/Growth) just total up; no consult needed
      // to see that number, so the button stays hidden unless Custom is in
      // the mix.
      let numericTotal = 0;
      let hasCustom = false;
      cart.forEach((item) => {
        if (item.plan === 'Custom') {
          hasCustom = true;
          return;
        }
        const digits = item.price.replace(/[^0-9.]/g, '');
        if (digits) numericTotal += parseFloat(digits) * item.qty;
      });

      if (numericTotal > 0) {
        const formatted = `$${numericTotal.toLocaleString('en-US')}/mo`;
        cartTotalAmount.textContent = hasCustom ? `${formatted} + custom quote` : formatted;
        cartTotalRow.classList.remove('hidden');
        cartTotalRow.classList.add('flex');
      } else {
        cartTotalRow.classList.add('hidden');
        cartTotalRow.classList.remove('flex');
      }

      if (hasCustom) {
        cartCheckout.classList.remove('hidden');
        cartCheckout.classList.add('flex');
      } else {
        cartCheckout.classList.add('hidden');
        cartCheckout.classList.remove('flex');
      }
    }

    function addToCart(plan, price) {
      const existing = cart.find((item) => item.plan === plan);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ plan, price, qty: 1 });
      }
      saveCart();
      renderCart();
      openCart();
    }

    function removeFromCart(plan) {
      cart = cart.filter((item) => item.plan !== plan);
      saveCart();
      renderCart();
    }

    function openCart() {
      cartPanel.classList.remove('hidden');
      cartToggle.setAttribute('aria-expanded', 'true');
    }

    function closeCart() {
      cartPanel.classList.add('hidden');
      cartToggle.setAttribute('aria-expanded', 'false');
    }

    cartToggle.addEventListener('click', () => {
      if (cartPanel.classList.contains('hidden')) openCart();
      else closeCart();
    });

    if (cartClose) cartClose.addEventListener('click', closeCart);

    document.addEventListener('click', (e) => {
      if (!cartPanel.classList.contains('hidden') && !cartPanel.contains(e.target) && !cartToggle.contains(e.target)) {
        closeCart();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCart();
    });

    cartItemsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-plan]');
      if (btn) removeFromCart(btn.dataset.removePlan);
    });

    document.querySelectorAll('.add-to-cart').forEach((btn) => {
      btn.addEventListener('click', () => {
        addToCart(btn.dataset.plan, btn.dataset.price);
        const original = btn.textContent;
        btn.textContent = 'Added ✓';
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = original;
          btn.disabled = false;
        }, 1200);
      });
    });

    if (cartCheckout && messageField) {
      cartCheckout.addEventListener('click', () => {
        if (cart.length) {
          const summary = cart.map((item) => `- ${item.plan} (${item.price})${item.qty > 1 ? ` x${item.qty}` : ''}`).join('\n');
          messageField.value = `Interested in:\n${summary}\n\n`;
        }
        closeCart();
      });
    }

    renderCart();
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

    const BRAND_COLORS = ['#2944A3', '#6B33B8', '#B337A5'];
    const GOLD = '#EDB145';
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

  // ---- Ambient dot field: every page, bouncy, mouse-reactive ----
  // A lighter, general-purpose version of the hero's particle system —
  // no chaos-to-logo choreography, just a field of brand-colored dots that
  // bounce elastically off the section edges (near-1 restitution, so they
  // stay lively instead of settling down) and scatter away from the
  // cursor on contact. One canvas per section (sections have opaque
  // backgrounds, so a single page-spanning fixed canvas would be hidden
  // behind whichever one is on top) — each pauses its own render loop
  // when scrolled out of view.
  if (!prefersReducedMotion) {
    const DOT_COLORS = ['#2944A3', '#6B33B8', '#B337A5', '#EDB145'];
    const DOT_COUNT = 34;
    const MOUSE_RADIUS = 70;
    const BOUNCE_RESTITUTION = 0.99;

    document.querySelectorAll('.dot-field').forEach((canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const host = canvas.closest('section') || canvas.parentElement;

      let w = 0;
      let h = 0;
      let dots = [];
      let running = false;
      let rafId = null;
      let mouseX = -9999;
      let mouseY = -9999;

      function build() {
        dots = Array.from({ length: DOT_COUNT }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 1.1,
          vy: (Math.random() - 0.5) * 1.1,
          r: 1.3 + Math.random() * 1.7,
          color: DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)],
        }));
      }

      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        build();
      }

      function onMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      }

      function draw() {
        if (!running) return;
        ctx.clearRect(0, 0, w, h);

        dots.forEach((d) => {
          d.x += d.vx;
          d.y += d.vy;

          if (d.x - d.r < 0) {
            d.x = d.r;
            d.vx = Math.abs(d.vx) * BOUNCE_RESTITUTION;
          } else if (d.x + d.r > w) {
            d.x = w - d.r;
            d.vx = -Math.abs(d.vx) * BOUNCE_RESTITUTION;
          }
          if (d.y - d.r < 0) {
            d.y = d.r;
            d.vy = Math.abs(d.vy) * BOUNCE_RESTITUTION;
          } else if (d.y + d.r > h) {
            d.y = h - d.r;
            d.vy = -Math.abs(d.vy) * BOUNCE_RESTITUTION;
          }

          // Contact with the cursor scatters the dot away — a hard, quick
          // impulse (ping-pong paddle hit), not a gentle push.
          const dx = d.x - mouseX;
          const dy = d.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS && dist > 0.001) {
            const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * 2.4;
            d.vx += (dx / dist) * force;
            d.vy += (dy / dist) * force;
          }

          // Keep speed in a lively but bounded range so contact impulses
          // don't accumulate into runaway velocity over time.
          const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
          const maxSpeed = 4.5;
          if (speed > maxSpeed) {
            d.vx = (d.vx / speed) * maxSpeed;
            d.vy = (d.vy / speed) * maxSpeed;
          }

          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = d.color;
          ctx.shadowColor = d.color;
          ctx.shadowBlur = 4;
          ctx.fill();
        });
        ctx.globalAlpha = 1;

        rafId = requestAnimationFrame(draw);
      }

      function start() {
        if (running) return;
        running = true;
        rafId = requestAnimationFrame(draw);
      }
      function stop() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
      }

      resize();
      window.addEventListener('resize', resize);
      window.addEventListener('mousemove', onMouseMove);

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(
          (entries) => entries.forEach((entry) => (entry.isIntersecting ? start() : stop())),
          { threshold: 0.01 }
        ).observe(host);
      } else {
        start();
      }
    });
  }

  // ---- Stacked cards: text-only crossfade ----
  // CSS position:sticky does the actual pinning and stacking (see
  // .stack-card__sticky in styles.css) — its background is always full-bleed
  // and never transforms, so there's no shrinking/growing box to see as one
  // section covers the next. Only the text (.stack-card__content) fades and
  // un-blurs in as its section arrives, and fades out as the next section
  // covers it — the words are the only thing that visibly moves; the page's
  // color glow (below) carries the rest of the motion.
  const stackCards = Array.from(document.querySelectorAll('.stack-card'));

  // ---- Per-page color identity: header accent + corner glow rotation ----
  // Each of the 4 narrative pages owns one accent color (magenta, violet,
  // navy, gold — same order as the sections). The header's accent bar and
  // each page's own corner glow blob both key off this array, so the
  // header and the ambient light "belong" to whichever page is on screen.
  const PAGE_COLORS = ['#B337A5', '#6B33B8', '#2944A3', '#EDB145'];
  const headerAccent = document.getElementById('header-accent');
  const glowBlobs = stackCards.map((card) => card.querySelector('.page-glow'));

  if (headerAccent) {
    gsap.set(headerAccent, { backgroundColor: PAGE_COLORS[0] });
  }

  if (stackCards.length && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    // Mobile browsers resize the viewport (address bar show/hide) as you
    // scroll; without this, that resize makes ScrollTrigger re-measure
    // mid-scroll and can snap triggers to the wrong progress.
    ScrollTrigger.config({ ignoreMobileResize: true });

    if (prefersReducedMotion) {
      stackCards.forEach((card) => {
        const content = card.querySelector('.stack-card__content');
        if (content) gsap.set(content, { opacity: 1, filter: 'blur(0px)' });
      });
      glowBlobs.forEach((blob) => {
        if (blob) gsap.set(blob, { opacity: 1, scale: 1 });
      });
    } else {
      if (glowBlobs[0]) gsap.set(glowBlobs[0], { opacity: 1, scale: 1 });
      glowBlobs.slice(1).forEach((blob) => {
        if (blob) gsap.set(blob, { opacity: 0, scale: 0.6 });
      });

      stackCards.forEach((card, i) => {
        if (i === 0) return;
        const content = card.querySelector('.stack-card__content');
        const prevContent = stackCards[i - 1].querySelector('.stack-card__content');
        if (!content) return;

        // The card is already sliding up into view (in normal flow) for a
        // full viewport height BEFORE its sticky pin engages — animating
        // only across the pin window (top top -> bottom top) leaves that
        // entire approach dead at the opacity:0 initial state, which reads
        // as a blank gap. Instead, run the whole reveal across the actual
        // approach (top hits viewport bottom -> top hits viewport top), so
        // it finishes exactly as the card locks into its pinned hold.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        });

        // Staggered, overlapping handoff: the outgoing text is already mostly
        // faded by the time the incoming text is still arriving, and the
        // incoming text is sharp again well before the outgoing one fully
        // fades — so there's always one legible layer, never two blurred
        // ones stacked on top of each other mid-scroll. Only opacity/blur
        // animate here (no transform) so this never fights with the
        // mouse-parallax translate already applied to these same elements.
        if (prevContent) {
          tl.to(prevContent, { opacity: 0, filter: 'blur(4px)', ease: 'power1.in', duration: 0.6 }, 0);
        }
        tl.to(content, { opacity: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 0.7 }, 0.3);

        // Header tints to the incoming page's color, and its glow blob
        // swaps corners with it — the outgoing blob fades on the same
        // beat as the outgoing text, the incoming one settles into its
        // corner on the same beat as the incoming text.
        if (headerAccent) {
          tl.to(headerAccent, { backgroundColor: PAGE_COLORS[i], ease: 'none' }, 0);
        }
        const prevBlob = glowBlobs[i - 1];
        const currentBlob = glowBlobs[i];
        if (prevBlob) {
          tl.to(prevBlob, { opacity: 0, scale: 0.6, ease: 'power1.in', duration: 0.6 }, 0);
        }
        if (currentBlob) {
          tl.to(currentBlob, { opacity: 1, scale: 1, ease: 'power2.out', duration: 0.7 }, 0.3);
        }
      });

      // Each ScrollTrigger above renders its current progress the instant
      // it's created, using whatever layout info exists at that moment —
      // on tall, narrow (mobile-shaped) viewports this can measure a later
      // trigger's range as already "behind" scroll position 0, snapping
      // its color forward immediately (e.g. the header opening on gold
      // instead of magenta). A refresh once everything is registered
      // forces every trigger to re-measure against final layout and
      // re-render from the correct scroll position.
      ScrollTrigger.refresh();
    }
  }

  // ---- Fade-up reveal for content sections ----
  // These sections (How We Work, Pricing, Contact) each own a color too
  // (see index.html --section-accent), continuing the same rotation the
  // stack-card pages use. They're not scroll-scrubbed like those pages —
  // just a one-time reveal of the section's own glow + a header tint,
  // fired the same moment its content fades in.
  const fadePanels = document.querySelectorAll('.fade-panel');
  fadePanels.forEach((panel) => {
    panel.querySelectorAll('.fade-item').forEach((item, i) => {
      item.style.transitionDelay = `${i * 0.08}s`;
    });
  });
  function revealFadeSection(panel) {
    panel.classList.add('is-visible');
    const section = panel.closest('.fade-section');
    if (!section) return;
    section.classList.add('is-glow-visible');
    const accent = getComputedStyle(section).getPropertyValue('--section-accent').trim();
    if (accent && headerAccent) {
      if (prefersReducedMotion) gsap.set(headerAccent, { backgroundColor: accent });
      else gsap.to(headerAccent, { backgroundColor: accent, duration: 0.6, ease: 'power1.out' });
    }
  }
  if (fadePanels.length) {
    if (prefersReducedMotion) {
      fadePanels.forEach((panel) => revealFadeSection(panel));
    } else if ('IntersectionObserver' in window) {
      const fadeObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              revealFadeSection(entry.target);
              fadeObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      fadePanels.forEach((panel) => fadeObserver.observe(panel));
    } else {
      fadePanels.forEach((panel) => revealFadeSection(panel));
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

  // ---- Custom cursor: tiny logo with a weighted, lagging spiral ----
  // The golden core chases the real cursor almost immediately (fast lerp);
  // the spiral around it has "weight" so it eases in slower, trailing the
  // core rather than moving in lockstep with it. Only on devices with an
  // actual mouse — touchscreens never see this, and reduced-motion keeps
  // the plain OS cursor rather than an animated replacement.
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!prefersReducedMotion && hasFinePointer) {
    const cursorEl = document.getElementById('custom-cursor');
    const spiralEl = document.getElementById('cursor-spiral');
    const coreEl = document.getElementById('cursor-core');
    if (cursorEl && spiralEl && coreEl) {
      document.documentElement.classList.add('custom-cursor-active');

      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let coreX = mouseX;
      let coreY = mouseY;
      let spiralX = mouseX;
      let spiralY = mouseY;
      let started = false;

      const CORE_EASE = 0.38;
      const SPIRAL_EASE = 0.1;

      window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!started) {
          started = true;
          coreX = spiralX = mouseX;
          coreY = spiralY = mouseY;
          cursorEl.classList.remove('hidden');
        }
      });
      document.addEventListener('mouseleave', () => cursorEl.classList.add('hidden'));
      document.addEventListener('mouseenter', () => {
        if (started) cursorEl.classList.remove('hidden');
      });

      function tick() {
        coreX += (mouseX - coreX) * CORE_EASE;
        coreY += (mouseY - coreY) * CORE_EASE;
        spiralX += (mouseX - spiralX) * SPIRAL_EASE;
        spiralY += (mouseY - spiralY) * SPIRAL_EASE;

        coreEl.style.transform = `translate3d(${coreX}px, ${coreY}px, 0) translate(-50%, -50%)`;
        spiralEl.style.transform = `translate3d(${spiralX}px, ${spiralY}px, 0) translate(-50%, -50%)`;

        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }
});
