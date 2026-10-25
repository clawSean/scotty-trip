(() => {
  'use strict';

  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');

  const paintHeader = () => header.classList.toggle('is-scrolled', scrollY > 45);
  addEventListener('scroll', paintHeader, { passive: true });
  paintHeader();

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
})();
