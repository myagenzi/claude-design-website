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
      const QUICK_HOLD_MS = 750;
      const AI_HOLD_MS = 5000;
      const SWAP_MS = 400;

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

  // ---- Scroll-triggered tunnel-zoom reveal ----
  const revealTargets = document.querySelectorAll('.reveal-section');
  const tunnelBurst = document.getElementById('tunnel-burst');
  const fireTunnelBurst = () => {
    if (!tunnelBurst) return;
    tunnelBurst.classList.remove('is-firing');
    void tunnelBurst.offsetWidth;
    tunnelBurst.classList.add('is-firing');
  };

  if (prefersReducedMotion) {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target;
          if (entry.isIntersecting) {
            target.classList.remove('is-exiting');
            target.classList.add('is-visible');
            fireTunnelBurst();
          } else if (target.classList.contains('is-visible')) {
            // Scrolled past the top: rush toward the camera and blow out, like exiting the tunnel.
            // Scrolled back below before ever settling: just reset, no exit punch.
            if (entry.boundingClientRect.top < 0) {
              target.classList.add('is-exiting');
            } else {
              target.classList.remove('is-visible', 'is-exiting');
            }
          }
        });
      },
      { threshold: [0, 0.25], rootMargin: '0px 0px -10% 0px' }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
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
