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

  // ---- Stacked cards: 3D depth tunnel ----
  // CSS position:sticky does the actual pinning (see .stack-card__sticky in
  // styles.css) — no JS pinning library needed. <main> carries the shared
  // `perspective`, so every sticky card lives in the same 3D space. As you
  // scroll through a card's own range, GSAP pushes the PREVIOUS card back
  // along Z (it shrinks, dims, blurs, recedes) while the CURRENT card flies
  // in from deep behind it (starts small/dark/blurred/far, arrives at full
  // size, opacity, and clarity) — a push-through-the-stack feel.
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

    if (prefersReducedMotion) {
      stackCards.forEach((card) => {
        const sticky = card.querySelector('.stack-card__sticky');
        if (sticky) gsap.set(sticky, { z: 0, scale: 1, opacity: 1, filter: 'blur(0px)' });
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
        const sticky = card.querySelector('.stack-card__sticky');
        const prevSticky = stackCards[i - 1].querySelector('.stack-card__sticky');
        if (!sticky) return;

        gsap.set(sticky, { z: -1400, scale: 0.35, opacity: 0, filter: 'blur(8px)' });

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

        // Staggered, overlapping handoff: the previous card is already mostly
        // gone by the time the incoming one is still arriving, and the
        // incoming card is sharp again well before the previous one fully
        // fades — so there's always one legible layer, never two blurred
        // ones stacked on top of each other mid-scroll.
        if (prevSticky) {
          tl.to(prevSticky, { z: -700, scale: 0.85, opacity: 0, filter: 'blur(5px)', ease: 'power1.in', duration: 0.6 }, 0);
        }
        tl.to(sticky, { z: 0, scale: 1, opacity: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 0.7 }, 0.3);

        // Header tints to the incoming page's color, and its glow blob
        // swaps corners with it — the outgoing blob fades on the same
        // beat as the outgoing card, the incoming one settles into its
        // corner on the same beat as the incoming card.
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
    }
  }

  // ---- Fade-up reveal for content sections ----
  const fadePanels = document.querySelectorAll('.fade-panel');
  fadePanels.forEach((panel) => {
    panel.querySelectorAll('.fade-item').forEach((item, i) => {
      item.style.transitionDelay = `${i * 0.08}s`;
    });
  });
  if (fadePanels.length) {
    if (prefersReducedMotion) {
      fadePanels.forEach((panel) => panel.classList.add('is-visible'));
    } else if ('IntersectionObserver' in window) {
      const fadeObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              fadeObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      fadePanels.forEach((panel) => fadeObserver.observe(panel));
    } else {
      fadePanels.forEach((panel) => panel.classList.add('is-visible'));
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
