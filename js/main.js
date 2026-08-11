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

  // ---- GSAP ScrollTrigger tunnel zoom ----
  // Each section's .reveal-inner is scrubbed directly to scroll position:
  // zooming in from tiny+blurred as the section approaches viewport center,
  // then HOLDING there at full clarity for a real reading window, then
  // continuing to zoom out past it as you keep scrolling. The hold is the
  // point — without it, text only comes into focus for an instant before
  // blurring away again, too fast to actually read.
  const zoomSections = Array.from(document.querySelectorAll('.reveal-section'));

  if (zoomSections.length && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    if (prefersReducedMotion) {
      zoomSections.forEach((section) => {
        const inner = section.querySelector('.reveal-inner');
        if (inner) gsap.set(inner, { opacity: 1, scale: 1, filter: 'blur(0px)' });
      });
    } else {
      // Extend well past a single viewport height so the zoom (and the
      // reading window inside it) is unmistakable even on a fast trackpad
      // flick, not just a slow deliberate scroll.
      const zoomDistance = () => Math.round(window.innerHeight * 3.2);

      zoomSections.forEach((section) => {
        const inner = section.querySelector('.reveal-inner');
        if (!inner) return;
        const onlyExit = section.classList.contains('zoom-only-exit');

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            // The hero is already at the top of the page on load, so its
            // exit-only timeline has to start from "top top" (its natural
            // resting position), not "top bottom" (which never occurs for
            // the very first section — that would leave ScrollTrigger
            // computing progress from a start point in the negative-scroll
            // past, landing mid-timeline immediately on load).
            start: onlyExit ? 'top top' : 'top bottom',
            end: zoomDistance,
            scrub: 0.6,
          },
        });

        if (!onlyExit) {
          tl.fromTo(
            inner,
            { scale: 0.2, opacity: 0, filter: 'blur(24px)' },
            { scale: 1, opacity: 1, filter: 'blur(0px)', ease: 'none', duration: 1 }
          );
          // Hold at full clarity — this gap is where the section is actually read.
          tl.to(inner, { scale: 2.2, opacity: 0, filter: 'blur(18px)', ease: 'none', duration: 1 }, '+=3');
        } else {
          gsap.set(inner, { scale: 1, opacity: 1, filter: 'blur(0px)' });
          tl.to(inner, { scale: 2.2, opacity: 0, filter: 'blur(18px)', ease: 'none', duration: 1 }, 3);
        }
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
