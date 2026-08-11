document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  const cycleEl = document.getElementById('cycle-word');
  if (cycleEl) {
    const words = [
      'the printing press',
      'the steam engine',
      'the assembly line',
      'the internet',
      'the smartphone',
      'AI',
    ];
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      cycleEl.textContent = 'AI';
      cycleEl.classList.add('is-final');
    } else {
      let i = 0;
      const interval = setInterval(() => {
        cycleEl.classList.add('is-swapping');
        setTimeout(() => {
          i += 1;
          cycleEl.textContent = words[i];
          cycleEl.classList.remove('is-swapping');
          if (words[i] === 'AI') {
            cycleEl.classList.add('is-final');
            clearInterval(interval);
          }
        }, 350);
      }, 1000);
    }
  }
});
