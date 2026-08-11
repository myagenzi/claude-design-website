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

  // ---- Hero word cycle + synced era background crossfade ----
  const cycleEl = document.getElementById('cycle-word');
  const eraPanels = document.querySelectorAll('.era-panel');
  const eras = ['press', 'steam', 'assembly', 'internet', 'smartphone', 'ai'];
  const words = [
    'the printing press',
    'the steam engine',
    'the assembly line',
    'the internet',
    'the smartphone',
    'AI',
  ];

  const setActiveEra = (i) => {
    eraPanels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.era === eras[i]);
    });
  };

  if (cycleEl) {
    if (prefersReducedMotion) {
      cycleEl.textContent = 'AI';
      cycleEl.classList.add('is-final');
      setActiveEra(eras.length - 1);
    } else {
      let i = 0;
      setActiveEra(0);
      const QUICK_HOLD_MS = 450;
      const AI_HOLD_MS = 5000;
      const SWAP_MS = 250;

      const scheduleSwap = () => {
        const holdTime = words[i] === 'AI' ? AI_HOLD_MS : QUICK_HOLD_MS;
        setTimeout(() => {
          cycleEl.classList.add('is-swapping');
          setTimeout(() => {
            i = (i + 1) % words.length;
            cycleEl.textContent = words[i];
            cycleEl.classList.remove('is-swapping');
            cycleEl.classList.toggle('is-final', words[i] === 'AI');
            setActiveEra(i);
            scheduleSwap();
          }, SWAP_MS);
        }, holdTime);
      };
      scheduleSwap();
    }
  }

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
