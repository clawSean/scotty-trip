(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const header = $('[data-header]');
  const toast = $('[data-toast]');

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function safeStorage() {
    try {
      const key = '__scotty_test';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return localStorage;
    } catch {
      return { getItem: () => null, setItem: () => {} };
    }
  }

  const storage = safeStorage();
  let visitor = storage.getItem('scottyVisitor');
  if (!visitor) {
    visitor = (crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`).replace(/[^a-zA-Z0-9_-]/g, '');
    storage.setItem('scottyVisitor', visitor);
  }

  const selected = (() => {
    try { return JSON.parse(storage.getItem('scottyVotes') || '{}'); }
    catch { return {}; }
  })();

  addEventListener('scroll', () => header.classList.toggle('is-scrolled', scrollY > 45), { passive: true });
  header.classList.toggle('is-scrolled', scrollY > 45);

  const navToggle = $('.nav-toggle');
  const nav = $('#site-nav');
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  $$('#site-nav a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));

  function updateCountdown() {
    const trip = Date.parse('2026-11-19T07:00:00Z');
    const remaining = Math.max(0, Math.ceil((trip - Date.now()) / 86_400_000));
    $('[data-countdown]').textContent = remaining;
  }
  updateCountdown();

  const dayTabs = $$('.day-tab');
  function showDay(day) {
    dayTabs.forEach((tab) => {
      const active = tab.dataset.day === day;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    $$('[data-panel]').forEach((panel) => {
      const active = panel.dataset.panel === day;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
  }
  dayTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showDay(tab.dataset.day));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      const next = dayTabs[(index + offset + dayTabs.length) % dayTabs.length];
      showDay(next.dataset.day);
      next.focus();
    });
  });

  const voteFilters = $$('.vote-filter');
  function showVoteCategory(category) {
    voteFilters.forEach((button) => button.classList.toggle('is-active', button.dataset.voteFilter === category));
    $$('.vote-card').forEach((card) => { card.hidden = card.dataset.category !== category; });
  }
  voteFilters.forEach((button) => button.addEventListener('click', () => showVoteCategory(button.dataset.voteFilter)));

  function paintSelections() {
    $$('.vote-card').forEach((card) => {
      card.classList.toggle('is-voted', selected[card.dataset.category] === card.dataset.option);
      const button = $('[data-vote]', card);
      const label = selected[card.dataset.category] === card.dataset.option ? 'Your vote' : 'Vote';
      button.childNodes[0].textContent = `${label} `;
    });
  }

  function applyTotals(votes = {}) {
    $$('.vote-card').forEach((card) => {
      const count = votes?.[card.dataset.category]?.[card.dataset.option] ?? 0;
      $('[data-count]', card).textContent = count;
    });
    paintSelections();
  }

  async function loadVotes() {
    try {
      const response = await fetch('/api/votes', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('offline');
      const payload = await response.json();
      applyTotals(payload.votes);
      $('[data-vote-status]').textContent = 'Live shared totals. The democracy is extremely low stakes.';
    } catch {
      paintSelections();
      $('[data-vote-status]').textContent = 'Shared totals are taking a pool break. Your picks remain on this device.';
    }
  }

  $$('[data-vote]').forEach((button) => button.addEventListener('click', async () => {
    const card = button.closest('.vote-card');
    const category = card.dataset.category;
    const option = card.dataset.option;
    button.disabled = true;
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ category, option, visitor })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Vote failed');
      selected[category] = option;
      storage.setItem('scottyVotes', JSON.stringify(selected));
      applyTotals(payload.votes);
      showToast('Vote counted. Democracy survives.');
    } catch (error) {
      showToast(error.message || 'The vote wandered into the desert.');
    } finally {
      button.disabled = false;
    }
  }));
  loadVotes();

  const plans = {
    morning: ['Papago + desert garden', 'Taliesin West', 'Sunrise balloon', 'Pool until further notice', 'Topgolf and plausible athleticism'],
    dinner: ['The Mission', 'Different Pointe of View', 'Citizen Public House', 'Olive & Ivy'],
    night: ['Rock the Rooftop', 'Party Bike', 'Social Tap → Old Town', 'Whiskey Row', 'Wonderspaces → cocktails'],
    verdict: ['Surprisingly defensible.', 'Legally a vacation.', 'Sean has seen worse.', 'Beautiful. Mildly incriminating.', 'No notes. Some concerns.']
  };
  $('[data-shuffle]').addEventListener('click', () => {
    const machine = $('.plan-machine');
    machine.classList.add('is-shuffling');
    setTimeout(() => {
      for (const lane of ['morning', 'dinner', 'night']) {
        const options = plans[lane];
        $(`[data-plan="${lane}"]`).textContent = options[Math.floor(Math.random() * options.length)];
      }
      $('[data-plan-verdict]').textContent = plans.verdict[Math.floor(Math.random() * plans.verdict.length)];
      machine.classList.remove('is-shuffling');
    }, 280);
  });

  const seanDialog = $('[data-sean-dialog]');
  const creditsDialog = $('[data-credits-dialog]');
  function openDialog(dialog) {
    if (dialog.showModal) dialog.showModal();
    else dialog.setAttribute('open', '');
    document.body.classList.add('modal-open');
  }
  function closeDialog(dialog) {
    if (dialog.close) dialog.close();
    else dialog.removeAttribute('open');
    document.body.classList.remove('modal-open');
  }
  $$('[data-open-sean]').forEach((button) => button.addEventListener('click', () => openDialog(seanDialog)));
  $('[data-close-sean]').addEventListener('click', () => closeDialog(seanDialog));
  $('[data-open-credits]').addEventListener('click', () => openDialog(creditsDialog));
  $('[data-close-credits]').addEventListener('click', () => closeDialog(creditsDialog));
  [seanDialog, creditsDialog].forEach((dialog) => dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog(dialog);
  }));

  const seanTips = {
    dinner: '<strong>Book The Mission first.</strong> It has the best combination of birthday atmosphere, Old Town location and realistic group fit. Hold Different Pointe of View as the sunset flex.',
    night: '<strong>Friday:</strong> Rock the Rooftop or the Party Bike. <strong>Saturday:</strong> Social Tap for F1, then walk directly into the bad decisions instead of arranging a second transportation operation.',
    nature: '<strong>Papago + Desert Botanical Garden.</strong> Pretty, easy, low logistics, flexible with the group. Gateway is the better “actual hike” if people insist on earning brunch.',
    recovery: '<strong>Do less.</strong> Breakfast, pool, electrolytes, one scenic stop. Any Sunday itinerary requiring timed tickets is hostile behavior.'
  };
  $$('[data-sean-tip]').forEach((button) => button.addEventListener('click', () => {
    $('[data-sean-answer]').innerHTML = `<p>${seanTips[button.dataset.seanTip]}</p>`;
  }));

  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('.vote-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const box = card.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - .5;
        const y = (event.clientY - box.top) / box.height - .5;
        card.style.transform = `perspective(900px) rotateY(${x * 2.5}deg) rotateX(${y * -2.5}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }
})();
