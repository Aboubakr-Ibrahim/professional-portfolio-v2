const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.primary-nav');
const commandPalette = document.querySelector('#command-palette');
const commandTrigger = document.querySelector('.command-trigger');
const commandClose = document.querySelector('.command-close');

requestAnimationFrame(() => document.body.classList.add('hero-ready'));

document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('motion-paused', document.hidden);
});

const progress = document.createElement('div');
progress.className = 'scroll-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.prepend(progress);

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 25);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${scrollable > 0 ? window.scrollY / scrollable : 0})`;
}, { passive: true });

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
  document.body.classList.toggle('menu-open', !open);
});

nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}));

document.querySelectorAll('a[href="#top"]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', `${location.pathname}${location.search}#top`);
  });
});

const openCommandPalette = () => {
  if (!commandPalette || commandPalette.open) return;
  commandPalette.showModal();
  commandPalette.querySelector('a')?.focus();
};

commandTrigger?.addEventListener('click', openCommandPalette);
commandClose?.addEventListener('click', () => commandPalette.close());
commandPalette?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => commandPalette.close()));
commandPalette?.addEventListener('click', event => {
  const bounds = commandPalette.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) commandPalette.close();
});

document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openCommandPalette();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    menuButton.focus();
  }
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

const navSections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
const navigationObserver = new IntersectionObserver(entries => {
  const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  document.body.dataset.section = visible.target.id;
  navLinks.forEach(link => {
    const target = link.getAttribute('href').slice(1);
    const active = target === visible.target.id || (target === 'top' && visible.target.id === 'home');
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
}, { rootMargin: '-20% 0px -65%', threshold: [0, .15, .4] });
navSections.forEach(section => navigationObserver.observe(section));

const filterButtons = document.querySelectorAll('.filter-button');
const credentials = document.querySelectorAll('.credential-card');
const credentialGrid = document.querySelector('.credential-grid');

filterButtons.forEach(button => button.addEventListener('click', () => {
  if (button.classList.contains('active')) return;
  filterButtons.forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  const filter = button.dataset.filter;
  credentialGrid?.classList.add('is-filtering');
  credentials.forEach((card, index) => {
    const visible = filter === 'all' || card.dataset.category === filter;
    card.classList.toggle('is-filtered-out', !visible);
    card.style.setProperty('--filter-order', index);
  });
  window.setTimeout(() => {
    credentials.forEach(card => {
      card.hidden = card.classList.contains('is-filtered-out');
    });
    credentialGrid?.classList.remove('is-filtering');
    requestAnimationFrame(() => credentials.forEach(card => {
      if (!card.hidden) card.classList.add('filter-enter');
    }));
    window.setTimeout(() => credentials.forEach(card => card.classList.remove('filter-enter')), 520);
  }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220);
}));

const modal = document.querySelector('#credential-modal');
const modalImage = document.querySelector('#modal-image');
const modalTitle = document.querySelector('#modal-title');
const modalCount = document.querySelector('.credential-modal-count');
let modalInvoker = null;
let credentialIndex = 0;
let modalScrollPosition = 0;
let modalScrollLocked = false;

const lockPageForModal = () => {
  if (modalScrollLocked) return;
  modalScrollPosition = window.scrollY;
  modalScrollLocked = true;
  document.body.classList.add('modal-open');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${modalScrollPosition}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
};

const unlockPageAfterModal = invoker => {
  if (!modalScrollLocked) {
    invoker?.focus({ preventScroll: true });
    return;
  }
  document.body.classList.remove('modal-open');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo({ top: modalScrollPosition, left: 0, behavior: 'auto' });
  modalScrollLocked = false;
  requestAnimationFrame(() => invoker?.focus({ preventScroll: true }));
};

const closeCredentialModal = () => {
  if (!modal?.open || modal.classList.contains('is-closing')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    modal.close();
    unlockPageAfterModal(modalInvoker);
    return;
  }
  modal.classList.add('is-closing');
  window.setTimeout(() => {
    modal.close();
    modal.classList.remove('is-closing', 'is-presented');
    unlockPageAfterModal(modalInvoker);
  }, 240);
};

const visibleCredentials = () => [...credentials].filter(card => !card.hidden);
const presentCredential = index => {
  const available = visibleCredentials();
  if (!available.length) return;
  credentialIndex = (index + available.length) % available.length;
  const card = available[credentialIndex];
  modalInvoker = card;
  modalImage.classList.add('is-changing');
  window.setTimeout(() => {
    modalImage.src = card.dataset.image;
    modalImage.alt = card.dataset.title;
    modalTitle.textContent = card.dataset.title;
    modalCount.textContent = `${String(credentialIndex + 1).padStart(2, '0')} / ${String(available.length).padStart(2, '0')}`;
    modalImage.classList.remove('is-changing');
  }, modal?.open ? 140 : 0);
};

credentials.forEach(card => card.addEventListener('click', () => {
  const available = visibleCredentials();
  const index = available.indexOf(card);
  presentCredential(index < 0 ? 0 : index);
  lockPageForModal();
  modal.showModal();
  requestAnimationFrame(() => modal.classList.add('is-presented'));
}));

document.querySelector('.modal-close')?.addEventListener('click', closeCredentialModal);
document.querySelector('.credential-modal-prev')?.addEventListener('click', () => presentCredential(credentialIndex - 1));
document.querySelector('.credential-modal-next')?.addEventListener('click', () => presentCredential(credentialIndex + 1));
modal.addEventListener('click', event => {
  const bounds = modal.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (outside) closeCredentialModal();
});
modal.addEventListener('cancel', event => {
  event.preventDefault();
  closeCredentialModal();
});
modal.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') presentCredential(credentialIndex - 1);
  if (event.key === 'ArrowRight') presentCredential(credentialIndex + 1);
});
modal.addEventListener('close', () => modal.classList.remove('is-presented', 'is-closing'));

const evidenceModal = document.querySelector('#evidence-modal');
const evidenceModalImage = document.querySelector('#evidence-modal-image');
const evidenceModalTitle = document.querySelector('#evidence-modal-title');
const evidenceModalDescription = document.querySelector('#evidence-modal-description');
const evidenceModalCount = document.querySelector('.evidence-modal-count');
const evidenceItems = [...document.querySelectorAll('.evidence-item')];
let evidenceInvoker = null;
let evidenceIndex = 0;

const closeEvidenceModal = () => {
  if (!evidenceModal?.open || evidenceModal.classList.contains('is-closing')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    evidenceModal.close();
    unlockPageAfterModal(evidenceInvoker);
    return;
  }
  evidenceModal.classList.add('is-closing');
  window.setTimeout(() => {
    evidenceModal.close();
    evidenceModal.classList.remove('is-closing', 'is-presented');
    unlockPageAfterModal(evidenceInvoker);
  }, 260);
};

const presentEvidence = index => {
  if (!evidenceItems.length) return;
  evidenceIndex = (index + evidenceItems.length) % evidenceItems.length;
  const item = evidenceItems[evidenceIndex];
  const image = item.querySelector('img');
  const title = item.querySelector('figcaption b')?.textContent?.trim() || 'Internship evidence';
  const description = item.querySelector('figcaption span')?.textContent?.trim() || '';
  if (!image) return;
  evidenceModalImage.classList.add('is-changing');
  window.setTimeout(() => {
    evidenceModalImage.src = image.currentSrc || image.src;
    evidenceModalImage.alt = image.alt;
    evidenceModalTitle.textContent = title;
    evidenceModalDescription.textContent = description;
    evidenceModalCount.textContent = `${String(evidenceIndex + 1).padStart(2, '0')} / ${String(evidenceItems.length).padStart(2, '0')}`;
    evidenceModalImage.classList.remove('is-changing');
  }, evidenceModal?.open ? 150 : 0);
};

evidenceItems.forEach((item, index) => {
  const image = item.querySelector('img');
  const title = item.querySelector('figcaption b')?.textContent?.trim() || 'Internship evidence';
  item.tabIndex = 0;
  item.setAttribute('role', 'button');
  item.setAttribute('aria-label', `Open ${title} internship evidence`);

  const openEvidence = () => {
    if (!evidenceModal || !image) return;
    evidenceInvoker = item;
    presentEvidence(index);
    lockPageForModal();
    evidenceModal.showModal();
    requestAnimationFrame(() => evidenceModal.classList.add('is-presented'));
  };

  item.addEventListener('click', openEvidence);
  item.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openEvidence();
  });
});

document.querySelector('.evidence-modal-close')?.addEventListener('click', closeEvidenceModal);
document.querySelector('.evidence-modal-prev')?.addEventListener('click', () => presentEvidence(evidenceIndex - 1));
document.querySelector('.evidence-modal-next')?.addEventListener('click', () => presentEvidence(evidenceIndex + 1));
evidenceModal?.addEventListener('click', event => {
  const bounds = evidenceModal.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (outside) closeEvidenceModal();
});
evidenceModal?.addEventListener('cancel', event => {
  event.preventDefault();
  closeEvidenceModal();
});
evidenceModal?.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') presentEvidence(evidenceIndex - 1);
  if (event.key === 'ArrowRight') presentEvidence(evidenceIndex + 1);
});
evidenceModal?.addEventListener('close', () => evidenceModal.classList.remove('is-presented', 'is-closing'));

document.querySelector('#year').textContent = new Date().getFullYear();

const heroVisual = document.querySelector('.hero-visual');
const canAnimateDepth = window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const animatedVisuals = document.querySelectorAll(
  '.monitor-ui, .sepsis-visual, .mini-wave, .poincare, .spectrogram, .calibration-chart, .quality-seal, .brand-mark-ab'
);

document.querySelectorAll('.brand-mark-ab .ab-pulse').forEach(pulse => {
  if (pulse.parentElement?.querySelector('.ab-pulse-glow')) return;
  const glow = pulse.cloneNode();
  glow.removeAttribute('class');
  glow.classList.add('ab-pulse-glow');
  glow.setAttribute('aria-hidden', 'true');
  pulse.after(glow);
});

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const motionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const oneShot = entry.target.matches('.mini-wave, .poincare, .calibration-chart');
      if (entry.isIntersecting) {
        entry.target.classList.add('motion-active');
        if (oneShot) motionObserver.unobserve(entry.target);
      } else if (!oneShot) {
        entry.target.classList.remove('motion-active');
      }
    });
  }, { threshold: 0.18, rootMargin: '60px 0px' });
  animatedVisuals.forEach(visual => motionObserver.observe(visual));
} else {
  animatedVisuals.forEach(visual => visual.classList.add('motion-active'));
}

document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('pointerenter', () => {
    if (prefersReducedMotion) return;
    const replay = card.querySelector('.mini-wave, .poincare, .calibration-chart');
    if (!replay) return;
    replay.classList.remove('motion-active');
    void replay.offsetWidth;
    replay.classList.add('motion-active');
  });
});

if (heroVisual && canAnimateDepth) {
  heroVisual.addEventListener('pointermove', event => {
    const bounds = heroVisual.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 18;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 18;
    heroVisual.style.setProperty('--signal-x', `${x * 0.45}px`);
    heroVisual.style.setProperty('--signal-y', `${y * 0.45}px`);
    heroVisual.style.setProperty('--quality-x', `${x * -0.35}px`);
    heroVisual.style.setProperty('--quality-y', `${y * -0.35}px`);
  });

  heroVisual.addEventListener('pointerleave', () => {
    heroVisual.style.setProperty('--signal-x', '0px');
    heroVisual.style.setProperty('--signal-y', '0px');
    heroVisual.style.setProperty('--quality-x', '0px');
    heroVisual.style.setProperty('--quality-y', '0px');
  });
}

const motionTargets = document.querySelectorAll('.pillar, .project-card, .credential-card, .evidence-item, .quality-list > div, .module-card');
motionTargets.forEach((target, index) => {
  target.classList.add('motion-card');
  if (target.classList.contains('reveal')) target.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
  const press = () => target.classList.add('is-pressed');
  const release = () => target.classList.remove('is-pressed');
  target.addEventListener('pointerdown', press);
  target.addEventListener('pointerup', release);
  target.addEventListener('pointercancel', release);
  target.addEventListener('pointerleave', release);
});

document.querySelectorAll('.button').forEach(button => button.classList.add('magnetic'));

document.querySelectorAll('.credential-archive').forEach(details => {
  const summary = details.querySelector(':scope > summary');
  if (!summary) return;

  summary.addEventListener('click', event => {
    event.preventDefault();
    const opening = !details.open;
    if (prefersReducedMotion) {
      details.open = opening;
      return;
    }

    const startHeight = `${details.offsetHeight}px`;
    if (opening) details.open = true;
    const summaryHeight = summary.offsetHeight + parseFloat(getComputedStyle(details).paddingTop || 0);
    const endHeight = opening ? `${details.scrollHeight}px` : `${summaryHeight}px`;

    details.style.height = startHeight;
    details.style.overflow = 'clip';
    requestAnimationFrame(() => {
      details.style.height = endHeight;
      details.classList.toggle('is-expanding', opening);
      details.classList.toggle('is-collapsing', !opening);
    });

    details.addEventListener('transitionend', () => {
      if (!opening) details.open = false;
      details.style.height = '';
      details.style.overflow = '';
      details.classList.remove('is-expanding', 'is-collapsing');
    }, { once: true });
  });
});

if (canAnimateDepth) {
  motionTargets.forEach(target => {
    target.addEventListener('pointermove', event => {
      const bounds = target.getBoundingClientRect();
      const px = (event.clientX - bounds.left) / bounds.width - 0.5;
      const py = (event.clientY - bounds.top) / bounds.height - 0.5;
      target.style.setProperty('--rx', `${py * -3.2}deg`);
      target.style.setProperty('--ry', `${px * 3.2}deg`);
    });
    target.addEventListener('pointerleave', () => {
      target.style.setProperty('--rx', '0deg');
      target.style.setProperty('--ry', '0deg');
    });
  });

  document.querySelectorAll('.magnetic').forEach(button => {
    button.addEventListener('pointermove', event => {
      const bounds = button.getBoundingClientRect();
      button.style.setProperty('--mag-x', `${(event.clientX - bounds.left - bounds.width / 2) * 0.08}px`);
      button.style.setProperty('--mag-y', `${(event.clientY - bounds.top - bounds.height / 2) * 0.08}px`);
    });
    button.addEventListener('pointerleave', () => {
      button.style.setProperty('--mag-x', '0px');
      button.style.setProperty('--mag-y', '0px');
    });
  });
}

document.querySelectorAll('main > .section').forEach((section, index, sections) => {
  if (index === sections.length - 1) return;
  const flow = document.createElement('div');
  flow.className = 'section-flow';
  flow.setAttribute('aria-hidden', 'true');
  flow.innerHTML = '<svg viewBox="0 0 420 38"><path d="M0 20h145l10-10 12 22 15-30 18 18h42l8-8 9 8h161"/></svg>';
  section.after(flow);
});
